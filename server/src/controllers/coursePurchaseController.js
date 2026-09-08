import asyncHandler from 'express-async-handler';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import CoursePurchase from '../models/CoursePurchase.js';
import { createEnrollmentIfMissing } from './enrollmentController.js';
import { sendEmail } from '../utils/sendEmail.js';
import { purchaseDecisionEmail } from '../utils/emailTemplates.js';

// @desc    Request to purchase a paid course
// @route   POST /api/course-purchases
// @access  Private
export const createPurchase = asyncHandler(async (req, res) => {
  const { courseId } = req.body;

  const course = await Course.findById(courseId);
  if (!course || !course.published) {
    res.status(404);
    throw new Error('Course not found');
  }

  if (!course.isPaid()) {
    res.status(400);
    throw new Error('This course is free - enroll directly instead of requesting a purchase');
  }

  const alreadyEnrolled = await Enrollment.findOne({ student: req.user._id, course: courseId });
  if (alreadyEnrolled) {
    res.status(400);
    throw new Error('Already enrolled in this course');
  }

  const existingRequest = await CoursePurchase.findOne({
    student: req.user._id,
    course: courseId,
    status: { $in: ['pending', 'paid'] },
  });
  if (existingRequest) {
    res.status(400);
    throw new Error(`You already have a ${existingRequest.status} purchase request for this course`);
  }

  const purchase = await CoursePurchase.create({
    course: courseId,
    student: req.user._id,
    amount: course.price,
  });

  res.status(201).json(purchase);
});

// @desc    List the current user's purchase requests
// @route   GET /api/course-purchases/mine
// @access  Private
export const getMyPurchases = asyncHandler(async (req, res) => {
  const purchases = await CoursePurchase.find({ student: req.user._id })
    .populate('course', 'title thumbnail')
    .sort({ createdAt: -1 });
  res.json(purchases);
});

// @desc    List all purchase requests, optionally filtered by status
// @route   GET /api/course-purchases?status=
// @access  Private (admin)
export const getAllPurchases = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const purchases = await CoursePurchase.find(filter)
    .populate('course', 'title')
    .populate('student', 'name email')
    .sort({ createdAt: -1 });
  res.json(purchases);
});

// @desc    Approve or reject a purchase request
// @route   PATCH /api/course-purchases/:id/status
// @access  Private (admin)
export const updatePurchaseStatus = asyncHandler(async (req, res) => {
  const { status, adminNote } = req.body;

  if (!['paid', 'rejected'].includes(status)) {
    res.status(400);
    throw new Error("Status must be 'paid' or 'rejected'");
  }

  const purchase = await CoursePurchase.findById(req.params.id)
    .populate('student', 'name email')
    .populate('course', 'title');
  if (!purchase) {
    res.status(404);
    throw new Error('Purchase request not found');
  }

  purchase.status = status;
  if (adminNote !== undefined) purchase.adminNote = adminNote;
  await purchase.save();

  if (status === 'paid') {
    await createEnrollmentIfMissing(purchase.student._id, purchase.course._id);
  }

  sendEmail({
    to: purchase.student.email,
    ...purchaseDecisionEmail({
      studentName: purchase.student.name,
      courseTitle: purchase.course.title,
      status,
      adminNote: purchase.adminNote,
    }),
  });

  res.json(purchase);
});
