/** `pkg-skills generate [--changed-only|--drain] [pkg…]` — build skills for opted-in packages. */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { loadConfig, readPackagesConf } from "#lib/config.ts";
import { ALPM_SPOOL } from "#lib/paths.ts";
import type { ConfEntry, Package } from "#lib/schema.ts";
import { generateSkill } from "#lib/generate.ts";
import { isUpToDate } from "#lib/state.ts";

const toPackage = (entry: ConfEntry): Package => ({
  manager: entry.manager,
  name: entry.name,
  version: entry.version,
  description: "",
  homepage: "",
});

/** Read + truncate the alpm spool; returns the package names it contained. */
const drainSpool = (): string[] => {
  if (!existsSync(ALPM_SPOOL)) return [];
  const names = readFileSync(ALPM_SPOOL, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
  writeFileSync(ALPM_SPOOL, "");
  return [...new Set(names)];
};

export const generate = async (args: string[]): Promise<void> => {
  const changedOnly = args.includes("--changed-only");
  const drain = args.includes("--drain");
  const explicit = args.filter((a) => !a.startsWith("--"));

  const config = loadConfig();
  const optedIn = readPackagesConf().filter((entry) => entry.enabled);

  let targets = optedIn;
  if (drain) {
    const spooled = new Set(drainSpool());
    targets = optedIn.filter((entry) => spooled.has(entry.name));
    if (targets.length === 0) {
      console.log("spool empty or no spooled package is opted in — nothing to do");
      return;
    }
  } else if (explicit.length > 0) {
    targets = optedIn.filter((entry) => explicit.includes(entry.name) || explicit.includes(entry.key));
    const missing = explicit.filter((name) => !targets.some((t) => t.name === name || t.key === name));
    for (const name of missing) console.error(`skip ${name}: not opted in (see pkg-skills select)`);
  }

  let generated = 0;
  let failed = 0;
  for (const entry of targets) {
    const pkg = toPackage(entry);
    if (changedOnly && isUpToDate(pkg)) continue;
    const result = await generateSkill(pkg, config);
    for (const finding of result.findings) console.error(`  ${result.skill}: ${finding}`);
    if (result.installed) {
      console.log(`ok ${result.skill} (${entry.key}) -> ${result.dir}`);
      generated += 1;
    } else {
      console.error(`FAILED ${result.skill} (${entry.key}) — not installed`);
      failed += 1;
    }
  }
  console.log(`generated ${generated}, failed ${failed}, skipped ${targets.length - generated - failed}`);
  if (failed > 0) process.exitCode = 1;
};
