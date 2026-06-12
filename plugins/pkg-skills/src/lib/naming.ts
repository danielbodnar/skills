/**
 * Skill-name sanitizer enforcing Anthropic naming rules:
 * lowercase letters, digits, hyphens; max 64 chars; no reserved words
 * ("claude", "anthropic") anywhere in the name.
 */

const RESERVED = ["claude", "anthropic"] as const;
// Anthropic frontmatter cap for `name`.
const MAX_NAME_LENGTH = 64;

/** Lowercase, replace invalid runs with "-", trim stray hyphens. */
const slugify = (input: string): string =>
  input
    .toLowerCase()
    .replaceAll(/[^a-z0-9-]+/g, "-")
    .replaceAll(/-{2,}/g, "-")
    .replaceAll(/^-|-$/g, "");

/** Remove reserved words wholesale, then re-normalize hyphen runs. */
const stripReserved = (slug: string): string => {
  let out = slug;
  for (const word of RESERVED) {
    out = out.replaceAll(word, "");
  }
  return out.replaceAll(/-{2,}/g, "-").replaceAll(/^-|-$/g, "");
};

/**
 * Derive a valid skill name for a package: `<prefix><sanitized-package>`.
 * A package literally named "claude-code" becomes e.g. "pkg-code".
 * Falls back to "pkg-tool" if sanitization empties the name entirely.
 */
export const skillNameFor = (packageName: string, prefix = "pkg-"): string => {
  const base = stripReserved(slugify(packageName));
  const fallback = base === "" ? "tool" : base;
  return `${prefix}${fallback}`.slice(0, MAX_NAME_LENGTH).replace(/-$/, "");
};

/** Validate a final name against the frontmatter rules. */
export const isValidSkillName = (name: string): boolean =>
  name.length > 0 &&
  name.length <= MAX_NAME_LENGTH &&
  /^[a-z0-9-]+$/.test(name) &&
  RESERVED.every((word) => !name.includes(word));
