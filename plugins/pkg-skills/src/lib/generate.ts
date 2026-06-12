/**
 * Skill generation pipeline: hydrate → fetch → render templates → validate →
 * `skills add` → mirror to ~/.claude → record state.
 */
import { chmodSync, cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { Config, Package, SkillMeta } from "#lib/schema.ts";
import { packageKey } from "#lib/schema.ts";
import { packageCacheDir } from "#lib/paths.ts";
import { skillNameFor } from "#lib/naming.ts";
import { fetchAll, hydrate } from "#lib/fetch.ts";
import { renderDir } from "#lib/render.ts";
import { hasErrors, validateSkillDir } from "#lib/validate.ts";
import { markGenerated, packageHash } from "#lib/state.ts";
import { deriveRepo } from "#lib/github.ts";
import { commandExists } from "#lib/managers/run.ts";

/** templates/ ships inside the plugin, next to src/. */
export const templatesDir = (): string => join(import.meta.dir, "..", "..", "templates");

export interface GenerateResult {
  skill: string;
  dir: string;
  installed: boolean;
  findings: string[];
}

const buildVars = (pkg: Package, skill: string): Record<string, string> => {
  const repo = deriveRepo(pkg.homepage);
  const bin = pkg.bin !== undefined && pkg.bin !== "" ? pkg.bin : (pkg.name.split("/").pop() ?? pkg.name);
  return {
    SKILL_NAME: skill,
    PKG_NAME: pkg.name,
    PKG_BIN: bin,
    PKG_VERSION: pkg.version,
    PKG_HOMEPAGE: pkg.homepage,
    PKG_REPO: repo === null ? "" : `https://github.com/${repo}`,
    MANAGER: pkg.manager,
    DESCRIPTION: pkg.description,
    GENERATED_AT: new Date().toISOString(),
  };
};

const runSkillsAdd = async (dir: string, extraArgs: string): Promise<boolean> => {
  const cli = commandExists("skills") ? ["skills"] : commandExists("bunx") ? ["bunx", "skills"] : null;
  if (cli === null) return false;
  const args = extraArgs.split(" ").filter((a) => a !== "");
  const proc = Bun.spawn([...cli, "add", dir, ...args], { stdout: "ignore", stderr: "ignore" });
  await proc.exited;
  return proc.exitCode === 0;
};

const mirrorToClaude = (skillDir: string, pkg: Package): void => {
  const claude = join(homedir(), ".claude");
  const reference = join(skillDir, "references", "reference.md");
  if (existsSync(reference) && existsSync(join(claude, "references"))) {
    cpSync(reference, join(claude, "references", `${pkg.name.split("/").pop() ?? pkg.name}.md`));
  }
  const snippets = join(skillDir, "snippets");
  if (existsSync(snippets) && existsSync(join(claude, "snippets"))) {
    cpSync(snippets, join(claude, "snippets", pkg.name.split("/").pop() ?? pkg.name), { recursive: true });
  }
};

/** Generate (or regenerate) the skill for one package. */
export const generateSkill = async (raw: Package, config: Config): Promise<GenerateResult> => {
  const pkg = await hydrate(raw);
  const skill = skillNameFor(pkg.name, config.prefix);
  const outDir = join(config.output_dir, skill);

  const sources = await fetchAll(pkg, { github: config.github });

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const written = renderDir(templatesDir(), outDir, buildVars(pkg, skill), packageCacheDir(pkg.manager, pkg.name));
  for (const file of written) {
    if (file.endsWith(".sh") || file.endsWith(".nu")) chmodSync(file, 0o755);
  }

  const meta: SkillMeta = {
    skill,
    package: packageKey(pkg),
    manager: pkg.manager,
    version: pkg.version,
    generator: "pkg-skills",
    generatedAt: new Date().toISOString(),
    hash: packageHash(pkg),
    sources: sources.map((s) => ({ ...s, provenance: s.provenance })),
  };
  writeFileSync(join(outDir, "meta.json"), `${JSON.stringify(meta, null, 2)}\n`);

  const findings = validateSkillDir(outDir);
  if (hasErrors(findings)) {
    // Fail closed: an invalid skill is never installed by the autonomous path.
    return { skill, dir: outDir, installed: false, findings: findings.map((f) => `${f.level}: ${f.rule}: ${f.message}`) };
  }

  const installed = await runSkillsAdd(outDir, config.skills_add_args);
  if (config.mirror_claude_dirs) mirrorToClaude(outDir, pkg);
  markGenerated(pkg, skill);

  return { skill, dir: outDir, installed, findings: findings.map((f) => `${f.level}: ${f.rule}: ${f.message}`) };
};
