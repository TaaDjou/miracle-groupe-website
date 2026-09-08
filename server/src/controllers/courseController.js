import asyncHandler from 'express-async-handler';
import Course from '../models/Course.js';

function isOwnerOrAdmin(course, user) {
  if (user.role === 'admin') return true;
  // course.instructor may be a raw ObjectId or a populated { _id, name, email } document
  const instructorId = course.instructor._id ? course.instructor._id : course.instructor;
  return instructorId.toString() === user._id.toString();
}

// @desc    List published courses (public catalog)
// @route   GET /api/courses
// @access  Public
export const getCourses = asyncHandler(async (req, res) => {
  const { category, level, search } = req.query;

  const filter = { published: true };
  if (category) filter.category = category;
  if (level) filter.level = level;
  if (search) filter.title = { $regex: search, $options: 'i' };

  const courses = await Course.find(filter)
    .populate('instructor', 'name email')
    .select('-sections.lessons.quiz.questions.correctOptionIndex -finalExam.questions.correctOptionIndex')
    .sort({ createdAt: -1 });

  res.json(courses);
});

// @desc    List the authenticated instructor's own courses (published + drafts)
// @route   GET /api/courses/mine
// @access  Private (instructor, admin)
export const getMyCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find({ instructor: req.user._id }).sort({ createdAt: -1 });
  res.json(courses);
});

// @desc    Get a single course by id
// @route   GET /api/courses/:id
// @access  Public for published courses; owner/admin can view drafts
export const getCourseById = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id).populate('instructor', 'name email');

  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  const isOwner = req.user && isOwnerOrAdmin(course, req.user);
  if (!course.published && !isOwner) {
    res.status(404);
    throw new Error('Course not found');
  }

  // Hide correct answers from anyone who isn't the owning instructor/admin
  const payload = course.toObject();
  if (!isOwner) {
    payload.sections = payload.sections.map((section) => ({
      ...section,
      lessons: section.lessons.map((lesson) => {
        if (lesson.quiz) {
          return {
            ...lesson,
            quiz: {
              ...lesson.quiz,
              questions: lesson.quiz.questions.map(({ correctOptionIndex, ...q }) => q),
            },
          };
        }
        return lesson;
      }),
    }));
    if (payload.finalExam) {
      payload.finalExam = {
        ...payload.finalExam,
        questions: payload.finalExam.questions.map(({ correctOptionIndex, ...q }) => q),
      };
    }
  }

  res.json(payload);
});

// @desc    Create a course
// @route   POST /api/courses
// @access  Private (instructor, admin)
export const createCourse = asyncHandler(async (req, res) => {
  const { title, description, thumbnail, category, level, sections, price, finalExam } = req.body;

  const course = await Course.create({
    title,
    description,
    thumbnail,
    category,
    level,
    sections: sections || [],
    price,
    finalExam,
    instructor: req.user._id,
  });

  res.status(201).json(course);
});

// @desc    Update a course (including its full sections/lessons tree)
// @route   PUT /api/courses/:id
// @access  Private (owning instructor, admin)
export const updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  if (!isOwnerOrAdmin(course, req.user)) {
    res.status(403);
    throw new Error('You do not have permission to modify this course');
  }

  const { title, description, thumbnail, category, level, sections, published, price, finalExam } = req.body;

  if (title !== undefined) course.title = title;
  if (description !== undefined) course.description = description;
  if (thumbnail !== undefined) course.thumbnail = thumbnail;
  if (category !== undefined) course.category = category;
  if (level !== undefined) course.level = level;
  if (sections !== undefined) course.sections = sections;
  if (published !== undefined) course.published = published;
  if (price !== undefined) course.price = price;
  if (finalExam !== undefined) course.finalExam = finalExam;

  const updated = await course.save();
  res.json(updated);
});

// @desc    Delete a course
// @route   DELETE /api/courses/:id
// @access  Private (owning instructor, admin)
export const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  if (!isOwnerOrAdmin(course, req.user)) {
    res.status(403);
    throw new Error('You do not have permission to delete this course');
  }

  await course.deleteOne();
  res.json({ message: 'Course deleted' });
});
