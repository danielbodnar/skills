/**
 * Generation state — remembers the version hash of each generated skill so
 * `generate --changed-only` and the systemd timer touch only what changed.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import type { Package } from "#lib/schema.ts";
import { packageKey } from "#lib/schema.ts";
import { stateDir, stateFile } from "#lib/paths.ts";

interface State {
  generated: Record<string, { hash: string; generatedAt: string; skill: string }>;
}

const load = (): State => {
  if (!existsSync(stateFile())) return { generated: {} };
  try {
    return JSON.parse(readFileSync(stateFile(), "utf8")) as State;
  } catch {
    return { generated: {} };
  }
};

/** Identity hash: a package regenerates when its version (or name) changes. */
export const packageHash = (pkg: Package): string =>
  Bun.hash(`${packageKey(pkg)}@${pkg.version}`).toString(16);

export const isUpToDate = (pkg: Package): boolean =>
  load().generated[packageKey(pkg)]?.hash === packageHash(pkg);

export const markGenerated = (pkg: Package, skill: string): void => {
  const state = load();
  state.generated[packageKey(pkg)] = {
    hash: packageHash(pkg),
    generatedAt: new Date().toISOString(),
    skill,
  };
  mkdirSync(stateDir(), { recursive: true });
  writeFileSync(stateFile(), `${JSON.stringify(state, null, 2)}\n`);
};
