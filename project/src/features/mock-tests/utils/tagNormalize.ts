// Normalizes a chapter display/id to a consistent key (doc id friendly)
export function normalizeChapterId(input: string): string {
  // Your Chapter doc ids look like "Rotation", "Thermodynamics", etc.
  // We normalize by trimming and collapsing whitespace only.
  return (input || '').toString().trim();
}

// Normalizes a skill tag slug/label into the canonical slug-like key.
export function normalizeTag(input: string): string {
  return (input || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-')       // spaces/underscores -> hyphen
    .replace(/[^a-z0-9-]/g, '')    // drop punctuation
    .replace(/-+/g, '-');          // collapse hyphens
}

// Nice label for chips from slug
export function labelFromSlug(slug: string): string {
  const s = slug.replace(/-/g, ' ').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}
