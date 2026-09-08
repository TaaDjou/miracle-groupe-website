// TEMPORARY preview data — used only as a visual fallback on Classrooms when the API is
// unreachable (e.g. local dev without a database connection), so the new design can be
// previewed populated. Shaped to match what GET /api/classrooms returns. Thumbnails are
// original SVG illustrations matched to each room's purpose (see utils/courseCover.js) -
// not stock photography.
// Remove the fallback usage once the backend is reliably reachable.

import getCoverImage from '../utils/courseCover';

const sampleClassrooms = [
  {
    _id: 'sample-room-1',
    name: 'Salle 1 - Studio créatif',
    location: 'Rez-de-chaussée',
    capacity: 12,
    amenities: ['Projecteur', 'Tableau blanc', 'Wifi'],
    pricePerHour: 1500,
    description: 'Un studio lumineux idéal pour les ateliers de design, avec grandes tables modulables.',
    thumbnail: getCoverImage('design'),
    active: true,
  },
  {
    _id: 'sample-room-2',
    name: 'Salle 2 - Salle de conférence',
    location: '1er étage',
    capacity: 25,
    amenities: ['Vidéoprojecteur', 'Sonorisation', 'Climatisation'],
    pricePerHour: 2500,
    description: "Grande salle équipée pour vos formations, conférences et séminaires d'entreprise.",
    thumbnail: getCoverImage('classroom'),
    active: true,
  },
  {
    _id: 'sample-room-3',
    name: 'Salle 3 - Studio audio',
    location: '2ème étage',
    capacity: 6,
    amenities: ['Cabine insonorisée', 'Micros', 'Wifi'],
    pricePerHour: 1800,
    description: 'Studio insonorisé équipé pour l’enregistrement audio et les sessions de voix off.',
    thumbnail: getCoverImage('audio'),
    active: true,
  },
  {
    _id: 'sample-room-4',
    name: 'Salle 4 - Espace coworking',
    location: 'Rez-de-chaussée',
    capacity: 8,
    amenities: ['Wifi', 'Café', 'Imprimante'],
    pricePerHour: 1000,
    description: 'Espace convivial pour petits groupes, ateliers ou séances de mentorat.',
    thumbnail: getCoverImage('business'),
    active: true,
  },
];

export default sampleClassrooms;
