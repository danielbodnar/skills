/**
 * Read-only commands: list, status, fetch (cache refresh), meta (vars JSON
 * for the /pkg-skills-scaffold slash command), validate.
 */
import { existsSync } from "node:fs";
import { loadConfig, readPackagesConf } from "#lib/config.ts";
import { cacheDir, configFile, packagesConf, packageCacheDir, stateFile } from "#lib/paths.ts";
import type { ConfEntry, Package } from "#lib/schema.ts";
import { availableManagers } from "#lib/managers/registry.ts";
import { fetchAll, hydrate } from "#lib/fetch.ts";
import { skillNameFor } from "#lib/naming.ts";
import { deriveRepo } from "#lib/github.ts";
import { validateSkillDir, hasErrors } from "#lib/validate.ts";

const findEntry = (name: string): ConfEntry | undefined =>
  readPackagesConf().find((entry) => entry.name === name || entry.key === name);

const toPackage = (entry: ConfEntry): Package => ({
  manager: entry.manager,
  name: entry.name,
  version: entry.version,
  description: "",
  homepage: "",
});

export const list = (): void => {
  const entries = readPackagesConf();
  for (const entry of entries) {
    console.log(`${entry.enabled ? "[x]" : "[ ]"} ${entry.key}${entry.version === "" ? "" : ` @${entry.version}`}`);
  }
  console.log(`${entries.filter((e) => e.enabled).length}/${entries.length} opted in`);
};

export const status = (): void => {
  const config = loadConfig();
  console.log(`config:        ${configFile()}${existsSync(configFile()) ? "" : " (defaults)"}`);
  console.log(`packages.conf: ${packagesConf()}${existsSync(packagesConf()) ? "" : " (missing — run sync)"}`);
  console.log(`cache:         ${cacheDir()}`);
  console.log(`state:         ${stateFile()}`);
  console.log(`output:        ${config.output_dir}`);
  console.log(`enrich:        ${config.enrich}`);
  console.log(`managers:      ${availableManagers().join(", ")}`);
  const entries = readPackagesConf();
  console.log(`packages:      ${entries.filter((e) => e.enabled).length}/${entries.length} opted in`);
};

export const fetchCmd = async (name: string | undefined): Promise<void> => {
  if (name === undefined) {
    console.error("usage: pkg-skills fetch <package>");
    process.exitCode = 1;
    return;
  }
  const entry = findEntry(name);
  if (entry === undefined) {
    console.error(`unknown package "${name}" — run \`pkg-skills sync\` first`);
    process.exitCode = 1;
    return;
  }
  const config = loadConfig();
  const pkg = await hydrate(toPackage(entry));
  const sources = await fetchAll(pkg, { github: config.github });
  console.log(`cached ${sources.length} artifacts -> ${packageCacheDir(pkg.manager, pkg.name)}`);
  for (const source of sources) console.log(`  ${source.kind}: ${source.path}`);
};

/** Emit the template variable map as JSON (consumed by /pkg-skills-scaffold). */
export const meta = async (name: string | undefined): Promise<void> => {
  if (name === undefined) {
    console.error("usage: pkg-skills meta <package>");
    process.exitCode = 1;
    return;
  }
  const entry = findEntry(name);
  if (entry === undefined) {
    console.error(`unknown package "${name}" — run \`pkg-skills sync\` first`);
    process.exitCode = 1;
    return;
  }
  const config = loadConfig();
  const pkg = await hydrate(toPackage(entry));
  const repo = deriveRepo(pkg.homepage);
  console.log(
    JSON.stringify(
      {
        SKILL_NAME: skillNameFor(pkg.name, config.prefix),
        PKG_NAME: pkg.name,
        PKG_BIN: pkg.bin !== undefined && pkg.bin !== "" ? pkg.bin : (pkg.name.split("/").pop() ?? pkg.name),
        PKG_VERSION: pkg.version,
        PKG_HOMEPAGE: pkg.homepage,
        PKG_REPO: repo === null ? "" : `https://github.com/${repo}`,
        MANAGER: pkg.manager,
        DESCRIPTION: pkg.description,
        GENERATED_AT: new Date().toISOString(),
        CACHE_DIR: packageCacheDir(pkg.manager, pkg.name),
        OUTPUT_DIR: config.output_dir,
      },
      null,
      2,
    ),
  );
};

export const validateCmd = (dir: string | undefined): void => {
  if (dir === undefined) {
    console.error("usage: pkg-skills validate <skill-dir>");
    process.exitCode = 1;
    return;
  }
  const findings = validateSkillDir(dir);
  for (const finding of findings) console.log(`${finding.level}: ${finding.rule}: ${finding.message}`);
  if (findings.length === 0) console.log("ok: all checks passed");
  if (hasErrors(findings)) process.exitCode = 1;
};
