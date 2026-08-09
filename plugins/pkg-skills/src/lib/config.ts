/**
 * Configuration loading and packages.conf parsing/merging.
 *
 * packages.conf format — one package per line, comments are opt-out state:
 *   # pacman:ripgrep  @14.1.1      <- known, NOT opted in (default for new packages)
 *   pacman:fd  @10.2.0             <- opted in: a skill is generated and kept current
 * Lines starting with "##" are headers/prose and never touched by the merger.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { ConfigSchema, ManagerSchema, packageKey } from "#lib/schema.ts";
import type { Config, ConfEntry, Package } from "#lib/schema.ts";
import { configDir, configFile, defaultOutputDir, packagesConf } from "#lib/paths.ts";

/** Minimal TOML subset parser: `key = value` lines, strings/bools only. */
const parseTomlish = (text: string): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (line === "" || line.startsWith("#") || line.startsWith("[")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    const comment = value.search(/\s#/);
    if (comment !== -1) value = value.slice(0, comment).trim();
    if (value === "true") out[key] = true;
    else if (value === "false") out[key] = false;
    else out[key] = value.replaceAll(/^["']|["']$/g, "");
  }
  return out;
};

/** Load config.toml (missing file = all defaults). */
export const loadConfig = (): Config => {
  const raw = existsSync(configFile()) ? parseTomlish(readFileSync(configFile(), "utf8")) : {};
  const config = ConfigSchema.parse(raw);
  if (config.output_dir === "") config.output_dir = defaultOutputDir();
  return config;
};

const ENTRY_RE = /^(#\s*)?([a-z]+):(\S+)(?:\s+@(\S+))?\s*$/;

/** Parse packages.conf into entries, preserving unknown lines untouched. */
export const parsePackagesConf = (text: string): { entries: ConfEntry[]; preamble: string[] } => {
  const entries: ConfEntry[] = [];
  const preamble: string[] = [];
  for (const line of text.split("\n")) {
    if (line.startsWith("##") || line.trim() === "") {
      preamble.push(line);
      continue;
    }
    const match = ENTRY_RE.exec(line.trim());
    if (match === null) continue;
    const managerParsed = ManagerSchema.safeParse(match[2]);
    if (!managerParsed.success) continue;
    const name = match[3] ?? "";
    entries.push({
      key: `${managerParsed.data}:${name}`,
      manager: managerParsed.data,
      name,
      version: match[4] ?? "",
      enabled: match[1] === undefined,
    });
  }
  return { entries, preamble };
};

const HEADER = [
  "## pkg-skills opt-in list — packages with skills generated for them.",
  "## Uncomment a line (remove leading '#') to opt a package IN, or run: pkg-skills select",
  "## Synced automatically; your comment/uncomment choices are always preserved.",
  "",
].join("\n");

const renderEntry = (entry: ConfEntry): string => {
  const version = entry.version === "" ? "" : `  @${entry.version}`;
  const line = `${entry.manager}:${entry.name}${version}`;
  return entry.enabled ? line : `# ${line}`;
};

/**
 * Merge freshly-enumerated packages into packages.conf.
 * New packages are appended commented-out (opt-out by default); existing
 * entries keep the user's enabled/disabled choice but refresh the version.
 * Packages that vanished from the system are dropped unless opted in.
 */
export const mergePackagesConf = (existing: string, found: Package[]): string => {
  const { entries } = parsePackagesConf(existing);
  const byKey = new Map(entries.map((entry) => [entry.key, entry]));
  const foundKeys = new Set(found.map(packageKey));

  const merged: ConfEntry[] = [];
  for (const pkg of found) {
    const key = packageKey(pkg);
    const prior = byKey.get(key);
    merged.push({
      key,
      manager: pkg.manager,
      name: pkg.name,
      version: pkg.version,
      enabled: prior?.enabled ?? false,
    });
  }
  // Keep opted-in entries whose package is gone (visible, so the user notices).
  for (const entry of entries) {
    if (!foundKeys.has(entry.key) && entry.enabled) merged.push(entry);
  }

  merged.sort((a, b) => a.key.localeCompare(b.key));
  return `${HEADER}${merged.map(renderEntry).join("\n")}\n`;
};

/** Read packages.conf entries (empty file if missing). */
export const readPackagesConf = (): ConfEntry[] => {
  if (!existsSync(packagesConf())) return [];
  return parsePackagesConf(readFileSync(packagesConf(), "utf8")).entries;
};

/** Write packages.conf, creating the config dir on first run. */
export const writePackagesConf = (content: string): void => {
  mkdirSync(configDir(), { recursive: true });
  writeFileSync(packagesConf(), content);
};
