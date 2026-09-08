import asyncHandler from 'express-async-handler';
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import CoursePurchase from '../models/CoursePurchase.js';
import QuizAttempt from '../models/QuizAttempt.js';
import User from '../models/User.js';
import { sendEmail } from '../utils/sendEmail.js';
import { certificateEarnedEmail } from '../utils/emailTemplates.js';

function redactAnswers(course) {
  const plain = typeof course.toObject === 'function' ? course.toObject() : course;
  return {
    ...plain,
    sections: plain.sections.map((section) => ({
      ...section,
      lessons: section.lessons.map((lesson) => {
        if (!lesson.quiz) return lesson;
        return {
          ...lesson,
          quiz: {
            ...lesson.quiz,
            questions: lesson.quiz.questions.map(({ correctOptionIndex, ...q }) => q),
          },
        };
      }),
    })),
    finalExam: plain.finalExam
      ? {
          ...plain.finalExam,
          questions: plain.finalExam.questions.map(({ correctOptionIndex, ...q }) => q),
        }
      : plain.finalExam,
  };
}

async function hasPassedFinalExam(studentId, courseId) {
  const attempt = await QuizAttempt.findOne({
    student: studentId,
    course: courseId,
    isFinalExam: true,
    passed: true,
  });
  return !!attempt;
}

async function withProgress(enrollment, course) {
  const totalLessons = course.getTotalLessons();
  const completedCount = enrollment.completedLessons.length;
  const progress = totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100);

  const examRequired = !!course.finalExam;
  const examPassed = examRequired ? await hasPassedFinalExam(enrollment.student, course._id) : true;

  return {
    _id: enrollment._id,
    course: redactAnswers(course),
    completedLessons: enrollment.completedLessons,
    completed: enrollment.completed,
    progress,
    examRequired,
    examPassed,
    certificateEligible: enrollment.completed && examPassed,
    createdAt: enrollment.createdAt,
  };
}

// Sends the "certificate earned" email exactly once, at the moment a course
// first becomes fully complete. Exported so quizController can reuse it for the
// final-exam-pass completion path.
export async function sendCertificateEmail(studentId, course) {
  const student = await User.findById(studentId);
  if (!student) return;

  const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();
  const certificateUrl = `${clientUrl}/courses/${course._id}/certificate`;

  sendEmail({
    to: student.email,
    ...certificateEarnedEmail({ studentName: student.name, courseTitle: course.title, certificateUrl }),
  });
}

// Shared mutation: creates the enrollment if one doesn't already exist.
// Used both for free direct-enroll and for auto-enrolling after a purchase is approved.
export async function createEnrollmentIfMissing(studentId, courseId) {
  const existing = await Enrollment.findOne({ student: studentId, course: courseId });
  if (existing) return existing;
  return Enrollment.create({ student: studentId, course: courseId });
}

// @desc    Enroll the current user in a course (free courses only - paid courses go through /api/course-purchases)
// @route   POST /api/enrollments
// @access  Private
export const enroll = asyncHandler(async (req, res) => {
  const { courseId } = req.body;

  const course = await Course.findById(courseId);
  if (!course || !course.published) {
    res.status(404);
    throw new Error('Course not found');
  }

  const existing = await Enrollment.findOne({ student: req.user._id, course: courseId });
  if (existing) {
    res.status(400);
    throw new Error('Already enrolled in this course');
  }

  if (course.isPaid()) {
    const paidPurchase = await CoursePurchase.findOne({ student: req.user._id, course: courseId, status: 'paid' });
    if (!paidPurchase) {
      res.status(403);
      throw new Error('This course must be purchased before enrolling');
    }
  }

  const enrollment = await createEnrollmentIfMissing(req.user._id, courseId);
  res.status(201).json(await withProgress(enrollment, course));
});

// @desc    List the current user's enrollments with progress
// @route   GET /api/enrollments/mine
// @access  Private
export const getMyEnrollments = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({ student: req.user._id }).populate('course');

  const withCourse = enrollments.filter((e) => e.course);
  res.json(await Promise.all(withCourse.map((e) => withProgress(e, e.course))));
});

// @desc    Get the current user's enrollment + progress for one course
// @route   GET /api/enrollments/course/:courseId
// @access  Private
export const getEnrollmentForCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  const enrollment = await Enrollment.findOne({ student: req.user._id, course: req.params.courseId });
  if (!enrollment) {
    res.status(404);
    throw new Error('Not enrolled in this course');
  }

  res.json(await withProgress(enrollment, course));
});

// Shared mutation: marks a lesson complete for a student's enrollment.
// Reused by the quiz controller so passing a quiz auto-completes its lesson.
export async function completeLessonForEnrollment(studentId, courseId, lessonId) {
  const course = await Course.findById(courseId);
  if (!course) {
    const err = new Error('Course not found');
    err.statusCode = 404;
    throw err;
  }

  const lessonExists = course.sections.some((section) =>
    section.lessons.some((lesson) => lesson._id.toString() === lessonId.toString())
  );
  if (!lessonExists) {
    const err = new Error('Lesson not found in this course');
    err.statusCode = 404;
    throw err;
  }

  const enrollment = await Enrollment.findOne({ student: studentId, course: courseId });
  if (!enrollment) {
    const err = new Error('Not enrolled in this course');
    err.statusCode = 404;
    throw err;
  }

  const wasCompleted = enrollment.completed;

  const alreadyCompleted = enrollment.completedLessons.some((id) => id.toString() === lessonId.toString());
  if (!alreadyCompleted) {
    enrollment.completedLessons.push(lessonId);
  }

  const totalLessons = course.getTotalLessons();
  enrollment.completed = enrollment.completedLessons.length >= totalLessons && totalLessons > 0;

  await enrollment.save();

  // Only fires here for courses with no final exam - lessons alone are the finish line.
  if (!wasCompleted && enrollment.completed && !course.finalExam) {
    sendCertificateEmail(studentId, course);
  }

  return { enrollment, course };
}

// @desc    Mark a lesson as complete within an enrolled course
// @route   PATCH /api/enrollments/:courseId/lessons/:lessonId/complete
// @access  Private
export const markLessonComplete = asyncHandler(async (req, res) => {
  const { courseId, lessonId } = req.params;
  const { enrollment, course } = await completeLessonForEnrollment(req.user._id, courseId, lessonId);
  res.json(await withProgress(enrollment, course));
});

async function buildCertificateData(enrollment, course) {
  const examRequired = !!course.finalExam;
  const examPassed = examRequired ? await hasPassedFinalExam(enrollment.student, course._id) : true;
  const eligible = enrollment.completed && examPassed;
  return { eligible, examRequired, examPassed };
}

// @desc    Get certificate data for a completed course
// @route   GET /api/enrollments/course/:courseId/certificate
// @access  Private
export const getCertificate = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId).populate('instructor', 'name');
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  const enrollment = await Enrollment.findOne({ student: req.user._id, course: req.params.courseId });
  if (!enrollment) {
    res.status(404);
    throw new Error('Not enrolled in this course');
  }

  const { eligible } = await buildCertificateData(enrollment, course);
  if (!eligible) {
    res.status(403);
    throw new Error('This course is not yet complete');
  }

  res.json({
    verificationId: enrollment._id,
    studentName: req.user.name,
    courseTitle: course.title,
    instructorName: course.instructor?.name || '',
    completedAt: enrollment.updatedAt,
  });
});

// @desc    Publicly verify a certificate by its enrollment id
// @route   GET /api/certificates/:enrollmentId/verify
// @access  Public
export const verifyCertificate = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findById(req.params.enrollmentId)
    .populate('student', 'name')
    .populate({ path: 'course', populate: { path: 'instructor', select: 'name' } });

  if (!enrollment || !enrollment.course) {
    res.status(404);
    throw new Error('Certificate not found');
  }

  const { eligible } = await buildCertificateData(enrollment, enrollment.course);
  if (!eligible) {
    res.status(404);
    throw new Error('Certificate not found');
  }

  res.json({
    verificationId: enrollment._id,
    studentName: enrollment.student.name,
    courseTitle: enrollment.course.title,
    instructorName: enrollment.course.instructor?.name || '',
    completedAt: enrollment.updatedAt,
  });
});
