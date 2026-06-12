/** cargo — binaries installed via `cargo install` (`cargo install --list`). */
import type { Package } from "#lib/schema.ts";
import { capture, commandExists } from "#lib/managers/run.ts";

export const available = (): boolean => commandExists("cargo");

export const enumerate = async (): Promise<Package[]> => {
  const out = await capture(["cargo", "install", "--list"]);
  const packages: Package[] = [];
  // Top-level lines look like: "ripgrep v14.1.1:" (indented lines list binaries).
  for (const line of out.split("\n")) {
    const match = /^(\S+)\s+v(\S+?):?\s*(?:\(.*\))?:?$/.exec(line);
    if (match !== null && !line.startsWith(" ")) {
      packages.push({
        manager: "cargo",
        name: match[1] ?? "",
        version: match[2]?.replace(/:$/, "") ?? "",
        description: "",
        homepage: "",
      });
    }
  }
  return packages.filter((pkg) => pkg.name !== "");
};
