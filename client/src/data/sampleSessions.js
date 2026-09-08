// TEMPORARY preview data — used only as a visual fallback on LiveSessions/InPersonSessions
// when the API is unreachable (e.g. local dev without a database connection), so the new
// design can be previewed populated. Shaped to match what GET /api/sessions returns.
// Thumbnails are original SVG illustrations matched to each session's topic (see
// utils/courseCover.js) - not stock photography.
// Remove the fallback usage once the backend is reliably reachable.

import getCoverImage from '../utils/courseCover';

function inDays(days, hour = 18) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export const sampleLiveSessions = [
  {
    _id: 'sample-live-1',
    type: 'live',
    title: 'UI/UX Design Q&A',
    description: 'Live walkthrough of a real design project, followed by an open Q&A over voice chat.',
    scheduledAt: inDays(2),
    durationMinutes: 60,
    capacity: 30,
    registeredCount: 12,
    thumbnail: getCoverImage('design'),
    instructor: { name: 'Sarah Belkacem' },
  },
  {
    _id: 'sample-live-2',
    type: 'live',
    title: 'React Performance Deep Dive',
    description: 'A hands-on session covering memoization, code-splitting, and profiling React apps.',
    scheduledAt: inDays(5),
    durationMinutes: 90,
    capacity: 25,
    registeredCount: 25,
    thumbnail: getCoverImage('development'),
    instructor: { name: 'Yacine Meziane' },
  },
  {
    _id: 'sample-live-3',
    type: 'live',
    title: 'Building Your First Marketing Funnel',
    description: 'Step-by-step live build of a content-to-conversion funnel for a small business.',
    scheduledAt: inDays(9),
    durationMinutes: 60,
    capacity: null,
    registeredCount: 8,
    thumbnail: getCoverImage('marketing'),
    instructor: { name: 'Lina Cherif' },
  },
];

export const sampleInPersonSessions = [
  {
    _id: 'sample-inperson-1',
    type: 'in_person',
    title: 'Voice Over Studio Bootcamp',
    description: 'A full-day, in-studio workshop covering mic technique, home setup, and a recorded demo reel.',
    scheduledAt: inDays(7, 9),
    durationMinutes: 240,
    capacity: 12,
    registeredCount: 5,
    location: 'Miracle Groupe Studio, Room A',
    thumbnail: getCoverImage('audio'),
    instructor: { name: 'Omar Haddad' },
  },
  {
    _id: 'sample-inperson-2',
    type: 'in_person',
    title: 'Freelance Portfolio Workshop',
    description: 'Bring your work in progress and leave with a portfolio ready to send to clients.',
    scheduledAt: inDays(12, 14),
    durationMinutes: 180,
    capacity: 15,
    registeredCount: 15,
    location: 'Miracle Groupe Studio, Room B',
    thumbnail: getCoverImage('business'),
    instructor: { name: 'Sarah Belkacem' },
  },
  {
    _id: 'sample-inperson-3',
    type: 'in_person',
    title: 'Motion Design Hands-On',
    description: 'Small-group in-person session animating a short explainer clip from scratch.',
    scheduledAt: inDays(16, 10),
    durationMinutes: 210,
    capacity: 10,
    registeredCount: 3,
    location: 'Miracle Groupe Studio, Room A',
    thumbnail: getCoverImage('design'),
    instructor: { name: 'Yacine Meziane' },
  },
];
