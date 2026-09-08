import asyncHandler from 'express-async-handler';
import Review from '../models/Review.js';
import Enrollment from '../models/Enrollment.js';

// @desc    Submit or update a review for a course (one per student per course)
// @route   POST /api/reviews
// @access  Private (must be enrolled)
export const createOrUpdateReview = asyncHandler(async (req, res) => {
  const { courseId, rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    res.status(400);
    throw new Error('Rating must be between 1 and 5');
  }

  const enrollment = await Enrollment.findOne({ student: req.user._id, course: courseId });
  if (!enrollment) {
    res.status(403);
    throw new Error('You must be enrolled in this course to leave a review');
  }

  const review = await Review.findOneAndUpdate(
    { course: courseId, student: req.user._id },
    { rating, comment: comment || '' },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );

  res.status(201).json(review);
});

// @desc    List a handful of top-rated reviews across all courses, for homepage testimonials
// @route   GET /api/reviews/featured
// @access  Public
export const getFeaturedReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ rating: { $gte: 4 } })
    .populate('student', 'name')
    .populate('course', 'title')
    .sort({ rating: -1, createdAt: -1 })
    .limit(6);

  res.json(reviews.filter((r) => r.student && r.course));
});

// @desc    List reviews for a course, with the average rating
// @route   GET /api/reviews/course/:courseId
// @access  Public
export const getCourseReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ course: req.params.courseId })
    .populate('student', 'name')
    .sort({ createdAt: -1 });

  const averageRating = reviews.length
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
    : 0;

  res.json({ averageRating, count: reviews.length, reviews });
});

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private (owner or admin)
export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  if (review.student.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('You do not have permission to delete this review');
  }

  await review.deleteOne();
  res.json({ message: 'Review deleted' });
});
