import asyncHandler from 'express-async-handler';
import Classroom from '../models/Classroom.js';
import ClassroomBooking from '../models/ClassroomBooking.js';
import { sendEmail } from '../utils/sendEmail.js';
import { bookingDecisionEmail } from '../utils/emailTemplates.js';

// @desc    Request a classroom rental
// @route   POST /api/classroom-bookings
// @access  Private
export const createBooking = asyncHandler(async (req, res) => {
  const { classroomId, startTime, endTime, purpose, headcount } = req.body;

  const classroom = await Classroom.findById(classroomId);
  if (!classroom || !classroom.active) {
    res.status(404);
    throw new Error('Classroom not found');
  }

  const start = new Date(startTime);
  const end = new Date(endTime);
  if (!(start < end)) {
    res.status(400);
    throw new Error('End time must be after start time');
  }

  const hours = (end - start) / (1000 * 60 * 60);
  const estimatedPrice = Math.round(hours * classroom.pricePerHour * 100) / 100;

  const booking = await ClassroomBooking.create({
    classroom: classroomId,
    requester: req.user._id,
    startTime: start,
    endTime: end,
    purpose,
    headcount,
    estimatedPrice,
  });

  res.status(201).json(booking);
});

// @desc    List the current user's booking requests
// @route   GET /api/classroom-bookings/mine
// @access  Private
export const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await ClassroomBooking.find({ requester: req.user._id })
    .populate('classroom', 'name location')
    .sort({ createdAt: -1 });
  res.json(bookings);
});

// @desc    List all booking requests, optionally filtered by status
// @route   GET /api/classroom-bookings?status=
// @access  Private (admin)
export const getAllBookings = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const bookings = await ClassroomBooking.find(filter)
    .populate('classroom', 'name location pricePerHour')
    .populate('requester', 'name email')
    .sort({ createdAt: -1 });
  res.json(bookings);
});

// @desc    Approve or reject a booking request
// @route   PATCH /api/classroom-bookings/:id/status
// @access  Private (admin)
export const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status, adminNote } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    res.status(400);
    throw new Error("Status must be 'approved' or 'rejected'");
  }

  const booking = await ClassroomBooking.findById(req.params.id)
    .populate('requester', 'name email')
    .populate('classroom', 'name');
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  if (status === 'approved') {
    const overlapping = await ClassroomBooking.findOne({
      _id: { $ne: booking._id },
      classroom: booking.classroom._id,
      status: 'approved',
      startTime: { $lt: booking.endTime },
      endTime: { $gt: booking.startTime },
    });
    if (overlapping) {
      res.status(400);
      throw new Error('Another approved booking already overlaps this time slot');
    }
  }

  booking.status = status;
  if (adminNote !== undefined) booking.adminNote = adminNote;
  await booking.save();

  sendEmail({
    to: booking.requester.email,
    ...bookingDecisionEmail({
      requesterName: booking.requester.name,
      classroomName: booking.classroom.name,
      status,
      startTime: booking.startTime,
      endTime: booking.endTime,
      adminNote: booking.adminNote,
    }),
  });

  res.json(booking);
});
