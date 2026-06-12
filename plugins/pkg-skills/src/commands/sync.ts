/** `pkg-skills sync` — refresh packages.conf from the live system (idempotent). */
import { existsSync, readFileSync } from "node:fs";
import { mergePackagesConf, writePackagesConf } from "#lib/config.ts";
import { packagesConf } from "#lib/paths.ts";
import { availableManagers, enumerateAll } from "#lib/managers/registry.ts";

export const sync = async (): Promise<void> => {
  const managers = availableManagers();
  console.log(`managers: ${managers.join(", ")}`);
  const found = await enumerateAll();
  const existing = existsSync(packagesConf()) ? readFileSync(packagesConf(), "utf8") : "";
  writePackagesConf(mergePackagesConf(existing, found));
  console.log(`synced ${found.length} packages -> ${packagesConf()}`);
  console.log("new packages are commented out; run `pkg-skills select` to opt in");
};
