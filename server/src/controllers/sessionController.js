import asyncHandler from 'express-async-handler';
import Session from '../models/Session.js';
import SessionRegistration from '../models/SessionRegistration.js';
import { sendEmail } from '../utils/sendEmail.js';
import { sessionRegistrationEmail } from '../utils/emailTemplates.js';

function isOwnerOrAdmin(session, user) {
  if (user.role === 'admin') return true;
  const instructorId = session.instructor._id ? session.instructor._id : session.instructor;
  return instructorId.toString() === user._id.toString();
}

function redactIfNotAllowed(session, canSeeInvite) {
  const plain = typeof session.toObject === 'function' ? session.toObject() : session;
  if (plain.type === 'live' && !canSeeInvite) {
    return { ...plain, discordInviteUrl: null };
  }
  return plain;
}

// @desc    List sessions (public catalog), optionally filtered by type
// @route   GET /api/sessions?type=live|in_person
// @access  Public
export const getSessions = asyncHandler(async (req, res) => {
  const { type } = req.query;
  const filter = {};
  if (type) filter.type = type;

  const sessions = await Session.find(filter)
    .populate('instructor', 'name email')
    .select('-discordInviteUrl')
    .sort({ scheduledAt: 1 });

  const withCounts = await Promise.all(
    sessions.map(async (s) => {
      const registeredCount = await SessionRegistration.countDocuments({ session: s._id });
      return { ...s.toObject(), registeredCount };
    })
  );

  res.json(withCounts);
});

// @desc    List the authenticated instructor's own sessions
// @route   GET /api/sessions/mine?type=
// @access  Private (instructor, admin)
export const getMySessions = asyncHandler(async (req, res) => {
  const { type } = req.query;
  const filter = { instructor: req.user._id };
  if (type) filter.type = type;

  const sessions = await Session.find(filter).sort({ scheduledAt: 1 });

  const withCounts = await Promise.all(
    sessions.map(async (s) => {
      const registeredCount = await SessionRegistration.countDocuments({ session: s._id });
      return { ...s.toObject(), registeredCount };
    })
  );

  res.json(withCounts);
});

// @desc    List the sessions the current user is registered for
// @route   GET /api/sessions/mine/registrations?type=
// @access  Private
export const getMyRegistrations = asyncHandler(async (req, res) => {
  const { type } = req.query;

  const registrations = await SessionRegistration.find({ student: req.user._id }).populate({
    path: 'session',
    populate: { path: 'instructor', select: 'name email' },
  });

  const withSession = registrations
    .filter((r) => r.session && (!type || r.session.type === type))
    .map((r) => ({
      _id: r._id,
      registeredAt: r.createdAt,
      session: r.session,
    }));

  res.json(withSession);
});

// @desc    Get a single session, with an isRegistered flag and Discord link redaction
// @route   GET /api/sessions/:id
// @access  Public (Discord link hidden unless registered/owner/admin)
export const getSessionById = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id).populate('instructor', 'name email');

  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }

  const registeredCount = await SessionRegistration.countDocuments({ session: session._id });

  let isRegistered = false;
  let canSeeInvite = false;

  if (req.user) {
    canSeeInvite = isOwnerOrAdmin(session, req.user);
    if (!canSeeInvite) {
      const registration = await SessionRegistration.findOne({ session: session._id, student: req.user._id });
      isRegistered = !!registration;
      canSeeInvite = isRegistered;
    } else {
      isRegistered = true;
    }
  }

  res.json({ ...redactIfNotAllowed(session, canSeeInvite), registeredCount, isRegistered });
});

// @desc    Create a session
// @route   POST /api/sessions
// @access  Private (instructor, admin)
export const createSession = asyncHandler(async (req, res) => {
  const { type, title, description, thumbnail, scheduledAt, durationMinutes, capacity, discordInviteUrl, location } =
    req.body;

  const session = await Session.create({
    type,
    title,
    description,
    thumbnail,
    scheduledAt,
    durationMinutes,
    capacity: capacity || null,
    discordInviteUrl: type === 'live' ? discordInviteUrl : '',
    location: type === 'in_person' ? location : '',
    instructor: req.user._id,
  });

  res.status(201).json(session);
});

// @desc    Update a session
// @route   PUT /api/sessions/:id
// @access  Private (owner instructor, admin)
export const updateSession = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);

  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }

  if (!isOwnerOrAdmin(session, req.user)) {
    res.status(403);
    throw new Error('You do not have permission to modify this session');
  }

  const { title, description, thumbnail, scheduledAt, durationMinutes, capacity, discordInviteUrl, location } =
    req.body;

  if (title !== undefined) session.title = title;
  if (description !== undefined) session.description = description;
  if (thumbnail !== undefined) session.thumbnail = thumbnail;
  if (scheduledAt !== undefined) session.scheduledAt = scheduledAt;
  if (durationMinutes !== undefined) session.durationMinutes = durationMinutes;
  if (capacity !== undefined) session.capacity = capacity || null;
  if (session.type === 'live' && discordInviteUrl !== undefined) session.discordInviteUrl = discordInviteUrl;
  if (session.type === 'in_person' && location !== undefined) session.location = location;

  const updated = await session.save();
  res.json(updated);
});

// @desc    Delete a session
// @route   DELETE /api/sessions/:id
// @access  Private (owner instructor, admin)
export const deleteSession = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);

  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }

  if (!isOwnerOrAdmin(session, req.user)) {
    res.status(403);
    throw new Error('You do not have permission to delete this session');
  }

  await SessionRegistration.deleteMany({ session: session._id });
  await session.deleteOne();
  res.json({ message: 'Session deleted' });
});

// @desc    Register (subscribe) for a session
// @route   POST /api/sessions/:id/register
// @access  Private
export const registerForSession = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }

  const existing = await SessionRegistration.findOne({ session: session._id, student: req.user._id });
  if (existing) {
    res.status(400);
    throw new Error('Already registered for this session');
  }

  if (session.capacity) {
    const registeredCount = await SessionRegistration.countDocuments({ session: session._id });
    if (registeredCount >= session.capacity) {
      res.status(400);
      throw new Error('This session is full');
    }
  }

  await SessionRegistration.create({ session: session._id, student: req.user._id });

  sendEmail({
    to: req.user.email,
    ...sessionRegistrationEmail({
      studentName: req.user.name,
      sessionTitle: session.title,
      scheduledAt: session.scheduledAt,
      type: session.type,
      discordInviteUrl: session.discordInviteUrl,
      location: session.location,
    }),
  });

  res.status(201).json({ message: 'Registered' });
});

// @desc    Unregister (unsubscribe) from a session
// @route   DELETE /api/sessions/:id/register
// @access  Private
export const unregisterFromSession = asyncHandler(async (req, res) => {
  const result = await SessionRegistration.findOneAndDelete({ session: req.params.id, student: req.user._id });
  if (!result) {
    res.status(404);
    throw new Error('You are not registered for this session');
  }
  res.json({ message: 'Unregistered' });
});
