/** pacman — explicitly installed packages (`pacman -Qqe` + versions via -Qe). */
import type { Package } from "#lib/schema.ts";
import { capture, commandExists } from "#lib/managers/run.ts";

export const available = (): boolean => commandExists("pacman");

export const enumerate = async (): Promise<Package[]> => {
  const out = await capture(["pacman", "-Qe"]);
  return out
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const [name = "", version = ""] = line.split(" ");
      return { manager: "pacman" as const, name, version, description: "", homepage: "" };
    })
    .filter((pkg) => pkg.name !== "");
};

/** Detail lookup for a single package (description + URL) used at generate time. */
export const detail = async (name: string): Promise<{ description: string; homepage: string }> => {
  const out = await capture(["pacman", "-Qi", name]);
  const field = (label: string): string => {
    const match = new RegExp(`^${label}\\s*:\\s*(.+)$`, "m").exec(out);
    return match?.[1]?.trim() ?? "";
  };
  return { description: field("Description"), homepage: field("URL") };
};

/** Executables a package installs (basenames under bin dirs), e.g. ripgrep -> [rg]. */
export const binaries = async (name: string): Promise<string[]> => {
  const out = await capture(["pacman", "-Qlq", name]);
  return out
    .split("\n")
    .filter((path) => /\/s?bin\/[^/]+$/.test(path))
    .map((path) => path.split("/").pop() ?? "")
    .filter((bin) => bin !== "");
};
