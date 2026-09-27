const SLUG_UNSAFE_PATTERN = /[^a-z0-9]+/g;

/** Turn a human-readable name into a URL-friendly slug. */
export const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(SLUG_UNSAFE_PATTERN, '-')
    .replace(/^-+|-+$/g, '');
