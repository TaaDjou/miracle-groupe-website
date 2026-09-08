const YOUTUBE_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtube\.com\/shorts\/|youtu\.be\/)([\w-]{6,})/i,
];

const VIMEO_PATTERN = /vimeo\.com\/(?:video\/)?(\d+)/i;

// Converts a YouTube/Vimeo URL into an embeddable iframe src.
// Returns null if the URL isn't a recognized video host, so callers can fall back
// to treating it as a plain link.
export function getEmbedUrl(url) {
  if (!url) return null;

  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
  }

  const vimeoMatch = url.match(VIMEO_PATTERN);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  return null;
}
