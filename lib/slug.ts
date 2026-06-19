// Readable slug generator + validation. Pure functions — safe on client & server.

const ADJECTIVES = [
  "sunset", "amber", "quiet", "folded", "paper", "crimson", "velvet", "willow",
  "misty", "golden", "azure", "hidden", "drifting", "lantern", "maple", "ivory",
  "scarlet", "cobalt", "gentle", "wandering", "silent", "coral", "dusky", "verdant",
];

const NOUNS = [
  "falcon", "harbor", "meadow", "comet", "river", "lantern", "ember", "thicket",
  "orchard", "summit", "willow", "cipher", "beacon", "marsh", "canyon", "petal",
  "raven", "otter", "heron", "fox", "crane", "moth", "wren", "koi",
];

export function generateSlug(): string {
  const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const n = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 90) + 10; // 10–99
  return `${a}-${n}-${num}`;
}

export const SLUG_MIN = 3;
export const SLUG_MAX = 48;

/** Normalize user input toward a valid slug (lowercase, dashes). */
export function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX);
}

/** Returns an error string if invalid, or null if the slug is well-formed. */
export function validateSlug(slug: string): string | null {
  if (slug.length < SLUG_MIN) return `Use at least ${SLUG_MIN} characters`;
  if (slug.length > SLUG_MAX) return `Keep it under ${SLUG_MAX} characters`;
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slug)) {
    return "Only lowercase letters, numbers and dashes";
  }
  const reserved = ["api", "_next", "favicon", "robots", "sitemap"];
  if (reserved.includes(slug)) return "That name is reserved";
  return null;
}
