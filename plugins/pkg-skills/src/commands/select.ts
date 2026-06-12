/** `pkg-skills select` — interactive space-to-toggle opt-in over packages.conf. */
import { readPackagesConf, writePackagesConf } from "#lib/config.ts";
import { packagesConf } from "#lib/paths.ts";
import { selectEntries } from "#lib/tui.ts";

export const select = async (): Promise<void> => {
  const entries = readPackagesConf();
  if (entries.length === 0) {
    console.error(`no entries in ${packagesConf()} — run \`pkg-skills sync\` first`);
    process.exitCode = 1;
    return;
  }
  const updated = await selectEntries(entries);
  if (updated === null) {
    console.log("aborted, no changes written");
    return;
  }
  const lines = updated.map((entry) => {
    const version = entry.version === "" ? "" : `  @${entry.version}`;
    const line = `${entry.manager}:${entry.name}${version}`;
    return entry.enabled ? line : `# ${line}`;
  });
  const header = [
    "## pkg-skills opt-in list — packages with skills generated for them.",
    "## Uncomment a line (remove leading '#') to opt a package IN, or run: pkg-skills select",
    "## Synced automatically; your comment/uncomment choices are always preserved.",
    "",
  ].join("\n");
  writePackagesConf(`${header}${lines.join("\n")}\n`);
  console.log(`saved ${updated.filter((e) => e.enabled).length} opt-ins -> ${packagesConf()}`);
};
