import asyncHandler from 'express-async-handler';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import QuizAttempt from '../models/QuizAttempt.js';
import { completeLessonForEnrollment, sendCertificateEmail } from './enrollmentController.js';

function findLesson(course, lessonId) {
  for (const section of course.sections) {
    const lesson = section.lessons.find((l) => l._id.toString() === lessonId.toString());
    if (lesson) return lesson;
  }
  return null;
}

function gradeQuiz(questions, answers, passingScore) {
  const correctCount = questions.reduce(
    (count, q, i) => (answers[i] === q.correctOptionIndex ? count + 1 : count),
    0
  );
  const score = Math.round((correctCount / questions.length) * 100);
  const passed = score >= (passingScore ?? 70);
  return { correctCount, score, passed };
}

// @desc    Submit answers for a quiz lesson (auto-graded)
// @route   POST /api/quizzes/:courseId/lessons/:lessonId/attempts
// @access  Private (must be enrolled)
export const submitQuizAttempt = asyncHandler(async (req, res) => {
  const { courseId, lessonId } = req.params;
  const { answers } = req.body; // array of selected option indices, in question order

  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  const lesson = findLesson(course, lessonId);
  if (!lesson || lesson.type !== 'quiz' || !lesson.quiz) {
    res.status(404);
    throw new Error('Quiz lesson not found');
  }

  const enrollment = await Enrollment.findOne({ student: req.user._id, course: courseId });
  if (!enrollment) {
    res.status(403);
    throw new Error('You must be enrolled in this course to take the quiz');
  }

  const questions = lesson.quiz.questions;
  if (!Array.isArray(answers) || answers.length !== questions.length) {
    res.status(400);
    throw new Error(`Expected ${questions.length} answers`);
  }

  const { correctCount, score, passed } = gradeQuiz(questions, answers, lesson.quiz.passingScore);

  const attempt = await QuizAttempt.create({
    student: req.user._id,
    course: courseId,
    lesson: lessonId,
    answers,
    score,
    passed,
  });

  let updatedProgress = null;
  if (passed) {
    const { enrollment: updatedEnrollment } = await completeLessonForEnrollment(req.user._id, courseId, lessonId);
    updatedProgress = updatedEnrollment.completedLessons;
  }

  res.status(201).json({
    attemptId: attempt._id,
    score,
    passed,
    correctCount,
    totalQuestions: questions.length,
    completedLessons: updatedProgress ?? enrollment.completedLessons,
  });
});

// @desc    List the current user's attempts for a quiz lesson
// @route   GET /api/quizzes/:courseId/lessons/:lessonId/attempts
// @access  Private
export const getMyAttempts = asyncHandler(async (req, res) => {
  const { courseId, lessonId } = req.params;

  const attempts = await QuizAttempt.find({
    student: req.user._id,
    course: courseId,
    lesson: lessonId,
  }).sort({ createdAt: -1 });

  res.json(attempts);
});

// @desc    Submit answers for a course's final exam (auto-graded)
// @route   POST /api/courses/:courseId/final-exam/attempts
// @access  Private (must be enrolled)
export const submitFinalExamAttempt = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { answers } = req.body;

  const course = await Course.findById(courseId);
  if (!course || !course.finalExam) {
    res.status(404);
    throw new Error('This course has no final exam');
  }

  const enrollment = await Enrollment.findOne({ student: req.user._id, course: courseId });
  if (!enrollment) {
    res.status(403);
    throw new Error('You must be enrolled in this course to take the final exam');
  }

  const questions = course.finalExam.questions;
  if (!Array.isArray(answers) || answers.length !== questions.length) {
    res.status(400);
    throw new Error(`Expected ${questions.length} answers`);
  }

  const { correctCount, score, passed } = gradeQuiz(questions, answers, course.finalExam.passingScore);

  // Check before creating the new attempt, so we only email on the *first* pass.
  const alreadyPassed = await QuizAttempt.exists({
    student: req.user._id,
    course: courseId,
    isFinalExam: true,
    passed: true,
  });

  const attempt = await QuizAttempt.create({
    student: req.user._id,
    course: courseId,
    isFinalExam: true,
    answers,
    score,
    passed,
  });

  // The exam is the last gate for a course that has one - lessons were already done.
  if (passed && !alreadyPassed && enrollment.completed) {
    sendCertificateEmail(req.user._id, course);
  }

  res.status(201).json({
    attemptId: attempt._id,
    score,
    passed,
    correctCount,
    totalQuestions: questions.length,
  });
});

// @desc    List the current user's final exam attempts for a course
// @route   GET /api/courses/:courseId/final-exam/attempts
// @access  Private
export const getMyFinalExamAttempts = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const attempts = await QuizAttempt.find({
    student: req.user._id,
    course: courseId,
    isFinalExam: true,
  }).sort({ createdAt: -1 });

  res.json(attempts);
});
