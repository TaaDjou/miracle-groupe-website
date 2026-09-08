import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Session from '../models/Session.js';
import SessionRegistration from '../models/SessionRegistration.js';
import ClassroomBooking from '../models/ClassroomBooking.js';

function sanitizeUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt };
}

function enrollmentProgress(enrollment) {
  const total = enrollment.course.getTotalLessons();
  return total === 0 ? 0 : Math.round((enrollment.completedLessons.length / total) * 100);
}

// @desc    Platform-wide KPIs
// @route   GET /api/admin/stats
// @access  Private (admin)
export const getStats = asyncHandler(async (req, res) => {
  const [totalUsers, students, instructors, admins] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'instructor' }),
    User.countDocuments({ role: 'admin' }),
  ]);

  const [totalCourses, publishedCourses] = await Promise.all([
    Course.countDocuments(),
    Course.countDocuments({ published: true }),
  ]);

  const enrollments = await Enrollment.find().populate('course');
  const validEnrollments = enrollments.filter((e) => e.course);
  const progresses = validEnrollments.map(enrollmentProgress);
  const avgProgress = progresses.length
    ? Math.round(progresses.reduce((a, b) => a + b, 0) / progresses.length)
    : 0;
  const completedEnrollments = validEnrollments.filter((e) => e.completed).length;

  const [totalAttempts, passedAttempts] = await Promise.all([
    QuizAttempt.countDocuments(),
    QuizAttempt.countDocuments({ passed: true }),
  ]);
  const quizPassRate = totalAttempts ? Math.round((passedAttempts / totalAttempts) * 100) : 0;

  const now = new Date();
  const [liveSessions, inPersonSessions, upcomingLive, upcomingInPerson, totalRegistrations] = await Promise.all([
    Session.countDocuments({ type: 'live' }),
    Session.countDocuments({ type: 'in_person' }),
    Session.countDocuments({ type: 'live', scheduledAt: { $gte: now } }),
    Session.countDocuments({ type: 'in_person', scheduledAt: { $gte: now } }),
    SessionRegistration.countDocuments(),
  ]);

  const [totalBookings, pendingBookings] = await Promise.all([
    ClassroomBooking.countDocuments(),
    ClassroomBooking.countDocuments({ status: 'pending' }),
  ]);

  const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5);

  res.json({
    users: { total: totalUsers, students, instructors, admins },
    courses: { total: totalCourses, published: publishedCourses, draft: totalCourses - publishedCourses },
    enrollments: { total: validEnrollments.length, avgProgress, completed: completedEnrollments },
    quizzes: { totalAttempts, passRate: quizPassRate },
    sessions: {
      live: liveSessions,
      inPerson: inPersonSessions,
      upcomingLive,
      upcomingInPerson,
      totalRegistrations,
    },
    classroomBookings: { total: totalBookings, pending: pendingBookings },
    recentUsers: recentUsers.map(sanitizeUser),
  });
});

// @desc    List every user with their enrollment count
// @route   GET /api/admin/users
// @access  Private (admin)
export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  const withCounts = await Promise.all(
    users.map(async (u) => {
      const enrollmentCount = await Enrollment.countDocuments({ student: u._id });
      return { ...sanitizeUser(u), enrollmentCount };
    })
  );
  res.json(withCounts);
});

// @desc    Get one user's profile, enrollments, and session registrations
// @route   GET /api/admin/users/:id
// @access  Private (admin)
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const enrollments = await Enrollment.find({ student: user._id }).populate('course', 'title sections');
  const enrollmentSummaries = enrollments
    .filter((e) => e.course)
    .map((e) => ({
      courseId: e.course._id,
      courseTitle: e.course.title,
      progress: enrollmentProgress(e),
      completed: e.completed,
    }));

  const registrations = await SessionRegistration.find({ student: user._id }).populate(
    'session',
    'title type scheduledAt'
  );
  const sessionSummaries = registrations
    .filter((r) => r.session)
    .map((r) => ({
      sessionId: r.session._id,
      title: r.session.title,
      type: r.session.type,
      scheduledAt: r.session.scheduledAt,
    }));

  res.json({
    ...sanitizeUser(user),
    enrollments: enrollmentSummaries,
    sessions: sessionSummaries,
  });
});

// @desc    List every course regardless of published state
// @route   GET /api/admin/courses
// @access  Private (admin)
export const getAllCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find().populate('instructor', 'name email').sort({ createdAt: -1 });
  res.json(courses);
});
