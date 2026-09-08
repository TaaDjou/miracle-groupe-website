import asyncHandler from 'express-async-handler';
import Contact from '../models/Contact.js';

// @desc    Create a contact message
// @route   POST /api/contact
// @access  Public
export const createContact = asyncHandler(async (req, res) => {
  const { name, email, message } = req.body;

  const contact = await Contact.create({ name, email, message });

  res.status(201).json(contact);
});

// @desc    List contact messages
// @route   GET /api/contact
// @access  Public (would be admin-only in a real deployment)
export const getContacts = asyncHandler(async (req, res) => {
  const contacts = await Contact.find().sort({ createdAt: -1 });

  res.json(contacts);
});
