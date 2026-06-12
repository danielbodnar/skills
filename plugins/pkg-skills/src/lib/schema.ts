/**
 * Zod schemas for packages, configuration, and generated-skill metadata.
 */
import { z } from "zod";

/** Package managers pkg-skills knows how to enumerate. */
export const ManagerSchema = z.enum([
  "pacman",
  "cargo",
  "bun",
  "npm",
  "pnpm",
  "yarn",
  "mise",
  "go",
  "pipx",
  "deno",
  "uv",
  "path",
]);
export type Manager = z.infer<typeof ManagerSchema>;

/** One installed package as reported by a manager enumerator. */
export const PackageSchema = z.object({
  manager: ManagerSchema,
  name: z.string().min(1),
  version: z.string().default(""),
  description: z.string().default(""),
  homepage: z.string().default(""),
});
export type Package = z.infer<typeof PackageSchema>;

/** Stable identity for a package across runs: "manager:name". */
export const packageKey = (pkg: Pick<Package, "manager" | "name">): string =>
  `${pkg.manager}:${pkg.name}`;

/** An entry in packages.conf — a package plus its opt-in state. */
export interface ConfEntry {
  key: string;
  manager: Manager;
  name: string;
  version: string;
  enabled: boolean;
}

/** config.toml shape (flat on purpose — mirrors the EnvironmentFile). */
export const ConfigSchema = z.object({
  /** Where generated skill dirs are staged before `skills add`. */
  output_dir: z.string().default(""),
  /** "off" = deterministic only; "headless" = run `claude -p` after generating. */
  enrich: z.enum(["off", "headless"]).default("off"),
  /** GitHub fetches are skipped entirely when false (offline mode). */
  github: z.boolean().default(true),
  /** Skill name prefix; "pkg-" namespaces generated skills away from hand-authored ones. */
  prefix: z.string().default("pkg-"),
  /** Extra args passed to `skills add` (e.g. "-g"). */
  skills_add_args: z.string().default("-g -y"),
  /** Mirror references/snippets into ~/.claude/{references,snippets}. */
  mirror_claude_dirs: z.boolean().default(true),
});
export type Config = z.infer<typeof ConfigSchema>;

/** meta.json written into every generated skill (machine-readable index). */
export const SkillMetaSchema = z.object({
  skill: z.string(),
  package: z.string(),
  manager: ManagerSchema,
  version: z.string(),
  generator: z.literal("pkg-skills"),
  generatedAt: z.string(),
  hash: z.string(),
  sources: z.array(
    z.object({
      kind: z.enum(["cli-help", "man", "tldr", "github-readme", "github-releases", "changelog", "links"]),
      provenance: z.enum(["stated", "inferred", "assumed", "fetched"]),
      path: z.string(),
      fetchedAt: z.string(),
    }),
  ),
});
export type SkillMeta = z.infer<typeof SkillMetaSchema>;
