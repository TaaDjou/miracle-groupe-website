import asyncHandler from 'express-async-handler';
import Classroom from '../models/Classroom.js';

// @desc    List classrooms (public sees only active ones, admin sees all)
// @route   GET /api/classrooms
// @access  Public
export const getClassrooms = asyncHandler(async (req, res) => {
  const filter = req.user?.role === 'admin' ? {} : { active: true };
  const classrooms = await Classroom.find(filter).sort({ name: 1 });
  res.json(classrooms);
});

// @desc    Get a single classroom
// @route   GET /api/classrooms/:id
// @access  Public
export const getClassroomById = asyncHandler(async (req, res) => {
  const classroom = await Classroom.findById(req.params.id);
  if (!classroom || (!classroom.active && req.user?.role !== 'admin')) {
    res.status(404);
    throw new Error('Classroom not found');
  }
  res.json(classroom);
});

// @desc    Create a classroom
// @route   POST /api/classrooms
// @access  Private (admin)
export const createClassroom = asyncHandler(async (req, res) => {
  const { name, thumbnail, location, capacity, amenities, pricePerHour, description } = req.body;
  const classroom = await Classroom.create({
    name,
    thumbnail,
    location,
    capacity,
    amenities,
    pricePerHour,
    description,
  });
  res.status(201).json(classroom);
});

// @desc    Update a classroom
// @route   PUT /api/classrooms/:id
// @access  Private (admin)
export const updateClassroom = asyncHandler(async (req, res) => {
  const classroom = await Classroom.findById(req.params.id);
  if (!classroom) {
    res.status(404);
    throw new Error('Classroom not found');
  }

  const { name, thumbnail, location, capacity, amenities, pricePerHour, description, active } = req.body;
  if (name !== undefined) classroom.name = name;
  if (thumbnail !== undefined) classroom.thumbnail = thumbnail;
  if (location !== undefined) classroom.location = location;
  if (capacity !== undefined) classroom.capacity = capacity;
  if (amenities !== undefined) classroom.amenities = amenities;
  if (pricePerHour !== undefined) classroom.pricePerHour = pricePerHour;
  if (description !== undefined) classroom.description = description;
  if (active !== undefined) classroom.active = active;

  const updated = await classroom.save();
  res.json(updated);
});

// @desc    Delete a classroom
// @route   DELETE /api/classrooms/:id
// @access  Private (admin)
export const deleteClassroom = asyncHandler(async (req, res) => {
  const classroom = await Classroom.findById(req.params.id);
  if (!classroom) {
    res.status(404);
    throw new Error('Classroom not found');
  }
  await classroom.deleteOne();
  res.json({ message: 'Classroom deleted' });
});
