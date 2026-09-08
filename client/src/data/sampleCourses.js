// TEMPORARY preview data — used only as a visual fallback on Home/CourseCatalog when
// the API is unreachable (e.g. local dev without a database connection), so the new
// design can be previewed with populated cards. Shaped to match what GET /api/courses
// returns. Thumbnails are original SVG illustrations matched to each course's category
// (see utils/courseCover.js) - not stock photography.
// Remove the fallback usage once the backend is reliably reachable.

import getCoverImage from '../utils/courseCover';

function lessons(count) {
  return [{ _id: 'sample-section', title: 'Section 1', lessons: Array.from({ length: count }, (_, i) => ({ _id: `l${i}` })) }];
}

const sampleCourses = [
  {
    _id: 'sample-1',
    title: 'UI/UX Design Fundamentals',
    description: 'Learn the core principles of user interface and user experience design, from wireframes to polished prototypes.',
    category: 'Design',
    level: 'beginner',
    price: 0,
    published: true,
    thumbnail: getCoverImage('Design'),
    instructor: { name: 'Sarah Belkacem' },
    sections: lessons(8),
  },
  {
    _id: 'sample-2',
    title: 'Advanced React Patterns',
    description: 'Deep-dive into hooks, context, performance optimization, and scalable component architecture.',
    category: 'Development',
    level: 'advanced',
    price: 45,
    published: true,
    thumbnail: getCoverImage('Development'),
    instructor: { name: 'Yacine Meziane' },
    sections: lessons(12),
  },
  {
    _id: 'sample-3',
    title: 'Digital Marketing Essentials',
    description: 'Build a complete marketing funnel: content strategy, SEO basics, and social media campaigns.',
    category: 'Marketing',
    level: 'beginner',
    price: 25,
    published: true,
    thumbnail: getCoverImage('Marketing'),
    instructor: { name: 'Lina Cherif' },
    sections: lessons(6),
  },
  {
    _id: 'sample-4',
    title: 'Voice Over for Beginners',
    description: 'Get started with voice acting: breathing technique, home recording setup, and your first demo reel.',
    category: 'Audio',
    level: 'beginner',
    price: 0,
    published: true,
    thumbnail: getCoverImage('Audio'),
    instructor: { name: 'Omar Haddad' },
    sections: lessons(5),
  },
  {
    _id: 'sample-5',
    title: 'Freelancing as a Creative',
    description: 'Turn your skills into a business: pricing, client contracts, and building a portfolio that sells.',
    category: 'Business',
    level: 'intermediate',
    price: 30,
    published: true,
    thumbnail: getCoverImage('Business'),
    instructor: { name: 'Sarah Belkacem' },
    sections: lessons(7),
  },
  {
    _id: 'sample-6',
    title: 'Motion Graphics with After Effects',
    description: 'Animate logos, transitions, and short explainer videos using industry-standard motion design tools.',
    category: 'Design',
    level: 'intermediate',
    price: 40,
    published: true,
    thumbnail: getCoverImage('Design'),
    instructor: { name: 'Yacine Meziane' },
    sections: lessons(10),
  },
];

export default sampleCourses;
