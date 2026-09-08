// Generates a small, original SVG "cover" illustration matched to a course's category
// (or a session/classroom's kind), instead of a random stock photo. Fully hand-drawn
// shapes - no external assets, no license concerns - and always on-brand since it's
// built from the same design tokens as the rest of the UI.

const PALETTES = {
  design: ['#793df4', '#a78bfa'],
  development: ['#6529e0', '#793df4'],
  marketing: ['#f59e0b', '#fbbf24'],
  audio: ['#0ea5e9', '#38bdf8'],
  business: ['#16a34a', '#4ade80'],
  live: ['#793df4', '#c4b5fd'],
  in_person: ['#16a34a', '#86efac'],
  classroom: ['#f59e0b', '#fcd34d'],
  default: ['#793df4', '#a78bfa'],
};

const ICONS = {
  // Screen/wireframe mockup, for design & UI/UX courses
  design: `
    <rect x="230" y="90" width="180" height="130" rx="14" fill="#ffffff" opacity="0.95"/>
    <rect x="248" y="108" width="144" height="16" rx="4" fill="#793df4" opacity="0.35"/>
    <rect x="248" y="134" width="90" height="10" rx="3" fill="#793df4" opacity="0.25"/>
    <rect x="248" y="152" width="144" height="50" rx="6" fill="#793df4" opacity="0.15"/>
  `,
  // Code brackets, for development courses
  development: `
    <path d="M270 100 L225 155 L270 210" stroke="#ffffff" stroke-width="14" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.95"/>
    <path d="M370 100 L415 155 L370 210" stroke="#ffffff" stroke-width="14" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.95"/>
    <line x1="335" y1="90" x2="305" y2="220" stroke="#ffffff" stroke-width="10" stroke-linecap="round" opacity="0.75"/>
  `,
  // Ascending bar chart, for marketing courses
  marketing: `
    <rect x="235" y="170" width="34" height="55" rx="6" fill="#ffffff" opacity="0.85"/>
    <rect x="285" y="145" width="34" height="80" rx="6" fill="#ffffff" opacity="0.92"/>
    <rect x="335" y="115" width="34" height="110" rx="6" fill="#ffffff" opacity="0.98"/>
    <path d="M232 140 L290 105 L335 125 L400 80" stroke="#ffffff" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M400 80 L400 100 M400 80 L380 82" stroke="#ffffff" stroke-width="8" fill="none" stroke-linecap="round"/>
  `,
  // Microphone, for audio/voice-over courses
  audio: `
    <rect x="298" y="90" width="44" height="80" rx="22" fill="#ffffff" opacity="0.95"/>
    <path d="M270 150 a50 50 0 0 0 100 0" stroke="#ffffff" stroke-width="10" fill="none" stroke-linecap="round" opacity="0.8"/>
    <line x1="320" y1="200" x2="320" y2="225" stroke="#ffffff" stroke-width="10" stroke-linecap="round" opacity="0.8"/>
    <line x1="292" y1="225" x2="348" y2="225" stroke="#ffffff" stroke-width="10" stroke-linecap="round" opacity="0.8"/>
  `,
  // Briefcase, for business/freelance courses
  business: `
    <rect x="255" y="130" width="130" height="90" rx="12" fill="#ffffff" opacity="0.95"/>
    <path d="M295 130 v-18 a12 12 0 0 1 12 -12 h26 a12 12 0 0 1 12 12 v18" stroke="#ffffff" stroke-width="10" fill="none" opacity="0.8"/>
    <line x1="255" y1="168" x2="385" y2="168" stroke-width="6" stroke="#16a34a" opacity="0.5"/>
  `,
  // Broadcast/live dot, for live sessions
  live: `
    <circle cx="320" cy="155" r="16" fill="#ffffff"/>
    <path d="M285 120 a55 55 0 0 0 0 70" stroke="#ffffff" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.7"/>
    <path d="M355 120 a55 55 0 0 1 0 70" stroke="#ffffff" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.7"/>
    <path d="M258 95 a90 90 0 0 0 0 120" stroke="#ffffff" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.4"/>
    <path d="M382 95 a90 90 0 0 1 0 120" stroke="#ffffff" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.4"/>
  `,
  // Location pin, for in-person sessions
  in_person: `
    <path d="M320 90 c35 0 55 27 55 55 c0 40 -55 85 -55 85 s-55 -45 -55 -85 c0 -28 20 -55 55 -55 z" fill="#ffffff" opacity="0.95"/>
    <circle cx="320" cy="148" r="20" fill="#16a34a"/>
  `,
  // Simple room/door, for classrooms
  classroom: `
    <rect x="260" y="90" width="120" height="135" rx="8" fill="#ffffff" opacity="0.95"/>
    <rect x="285" y="115" width="30" height="30" rx="4" fill="#f59e0b" opacity="0.6"/>
    <rect x="325" y="115" width="30" height="30" rx="4" fill="#f59e0b" opacity="0.6"/>
    <rect x="300" y="165" width="40" height="60" rx="4" fill="#f59e0b" opacity="0.5"/>
  `,
  // Graduation cap, generic fallback
  default: `
    <path d="M320 100 L400 130 L320 160 L240 130 Z" fill="#ffffff" opacity="0.95"/>
    <path d="M280 143 v30 c0 12 18 22 40 22 s40 -10 40 -22 v-30" stroke="#ffffff" stroke-width="8" fill="none" opacity="0.8"/>
    <line x1="400" y1="130" x2="400" y2="175" stroke="#ffffff" stroke-width="6" stroke-linecap="round" opacity="0.7"/>
  `,
};

// Maps a free-text category or session/classroom "kind" to one of the known palettes/icons.
function resolveKey(input) {
  const key = (input || '').toLowerCase();
  if (ICONS[key]) return key;
  if (/design|motion|graphic|ui|ux/.test(key)) return 'design';
  if (/dev|code|react|program/.test(key)) return 'development';
  if (/market/.test(key)) return 'marketing';
  if (/audio|voice|sound/.test(key)) return 'audio';
  if (/business|freelance|career/.test(key)) return 'business';
  return 'default';
}

export function getCoverImage(input) {
  const key = resolveKey(input);
  const [from, to] = PALETTES[key];
  const icon = ICONS[key];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${from}"/>
        <stop offset="1" stop-color="${to}"/>
      </linearGradient>
    </defs>
    <rect width="640" height="360" fill="url(#g)"/>
    ${icon}
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export default getCoverImage;
