import asyncHandler from 'express-async-handler';
import InstructorApplication from '../models/InstructorApplication.js';

// @desc    Submit an application to become an instructor
// @route   POST /api/instructor-applications
// @access  Public
export const createInstructorApplication = asyncHandler(async (req, res) => {
  const { name, email, expertise, message } = req.body;

  const application = await InstructorApplication.create({ name, email, expertise, message });

  res.status(201).json(application);
});

// @desc    List instructor applications, optionally filtered by status
// @route   GET /api/instructor-applications?status=
// @access  Private (admin)
export const getInstructorApplications = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const applications = await InstructorApplication.find(filter).sort({ createdAt: -1 });
  res.json(applications);
});

// @desc    Approve or reject an instructor application
// @route   PATCH /api/instructor-applications/:id/status
// @access  Private (admin)
export const updateInstructorApplicationStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    res.status(400);
    throw new Error("Status must be 'approved' or 'rejected'");
  }

  const application = await InstructorApplication.findById(req.params.id);
  if (!application) {
    res.status(404);
    throw new Error('Application not found');
  }

  application.status = status;
  await application.save();

  res.json(application);
});
