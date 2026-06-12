/**
 * Manager registry — detects which managers exist on this system and
 * fans out enumeration across them.
 */
import type { Manager, Package } from "#lib/schema.ts";
import * as pacman from "#lib/managers/pacman.ts";
import * as cargo from "#lib/managers/cargo.ts";
import {
  bunAvailable,
  bunEnumerate,
  npmAvailable,
  npmEnumerate,
  pnpmAvailable,
  pnpmEnumerate,
  yarnAvailable,
  yarnEnumerate,
} from "#lib/managers/node-globals.ts";
import {
  denoAvailable,
  denoEnumerate,
  goAvailable,
  goEnumerate,
  miseAvailable,
  miseEnumerate,
  pipxAvailable,
  pipxEnumerate,
  uvAvailable,
  uvEnumerate,
} from "#lib/managers/misc.ts";

interface Enumerator {
  available: () => boolean;
  enumerate: () => Promise<Package[]>;
}

export const REGISTRY: Record<Exclude<Manager, "path">, Enumerator> = {
  pacman: { available: pacman.available, enumerate: pacman.enumerate },
  cargo: { available: cargo.available, enumerate: cargo.enumerate },
  bun: { available: bunAvailable, enumerate: bunEnumerate },
  npm: { available: npmAvailable, enumerate: npmEnumerate },
  pnpm: { available: pnpmAvailable, enumerate: pnpmEnumerate },
  yarn: { available: yarnAvailable, enumerate: yarnEnumerate },
  mise: { available: miseAvailable, enumerate: miseEnumerate },
  go: { available: goAvailable, enumerate: goEnumerate },
  pipx: { available: pipxAvailable, enumerate: pipxEnumerate },
  deno: { available: denoAvailable, enumerate: denoEnumerate },
  uv: { available: uvAvailable, enumerate: uvEnumerate },
};

const entries = (): Array<[keyof typeof REGISTRY, Enumerator]> =>
  Object.entries(REGISTRY) as Array<[keyof typeof REGISTRY, Enumerator]>;

export const availableManagers = (): Array<keyof typeof REGISTRY> =>
  entries()
    .filter(([, enumerator]) => enumerator.available())
    .map(([key]) => key);

/** Enumerate every available manager concurrently; failures degrade to []. */
export const enumerateAll = async (): Promise<Package[]> => {
  const results = await Promise.all(
    entries()
      .filter(([, enumerator]) => enumerator.available())
      .map(([, enumerator]) => enumerator.enumerate()),
  );
  return results.flat();
};
