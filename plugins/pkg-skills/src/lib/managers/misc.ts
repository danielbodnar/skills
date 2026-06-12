/**
 * mise / go / pipx / deno / uv — remaining enumerators.
 * Each returns explicitly-installed tools only, [] when unavailable.
 */
import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import type { Package } from "#lib/schema.ts";
import { capture, commandExists } from "#lib/managers/run.ts";

export const miseAvailable = (): boolean => commandExists("mise");
export const miseEnumerate = async (): Promise<Package[]> => {
  const out = await capture(["mise", "ls", "--json"]);
  try {
    const parsed = JSON.parse(out) as Record<string, Array<{ version?: string; installed?: boolean }>>;
    return Object.entries(parsed).map(([name, versions]) => ({
      manager: "mise" as const,
      name,
      version: versions.find((v) => v.installed !== false)?.version ?? versions[0]?.version ?? "",
      description: "",
      homepage: "",
    }));
  } catch {
    return [];
  }
};

export const goAvailable = (): boolean => commandExists("go");
export const goEnumerate = async (): Promise<Package[]> => {
  // Binaries land in $GOBIN (or $GOPATH/bin). Versions come from `go version -m`.
  const gobin = process.env.GOBIN ?? join(process.env.GOPATH ?? join(homedir(), "go"), "bin");
  if (!existsSync(gobin)) return [];
  const packages: Package[] = [];
  for (const entry of readdirSync(gobin)) {
    const out = await capture(["go", "version", "-m", join(gobin, entry)]);
    const path = /^\s+path\s+(\S+)$/m.exec(out)?.[1] ?? "";
    const version = /^\s+mod\s+\S+\s+(\S+)/m.exec(out)?.[1] ?? "";
    packages.push({ manager: "go", name: path === "" ? entry : path, version, description: "", homepage: "" });
  }
  return packages;
};

export const pipxAvailable = (): boolean => commandExists("pipx");
export const pipxEnumerate = async (): Promise<Package[]> => {
  const out = await capture(["pipx", "list", "--json"]);
  try {
    const parsed = JSON.parse(out) as {
      venvs?: Record<string, { metadata?: { main_package?: { package_version?: string } } }>;
    };
    return Object.entries(parsed.venvs ?? {}).map(([name, venv]) => ({
      manager: "pipx" as const,
      name,
      version: venv.metadata?.main_package?.package_version ?? "",
      description: "",
      homepage: "",
    }));
  } catch {
    return [];
  }
};

export const denoAvailable = (): boolean => commandExists("deno");
export const denoEnumerate = async (): Promise<Package[]> => {
  // Installed scripts live in ~/.deno/bin (no version metadata on disk).
  const bin = join(process.env.DENO_INSTALL_ROOT ?? join(homedir(), ".deno"), "bin");
  if (!existsSync(bin)) return [];
  return readdirSync(bin)
    .filter((entry) => entry !== "deno")
    .map((entry) => ({ manager: "deno" as const, name: entry, version: "", description: "", homepage: "" }));
};

export const uvAvailable = (): boolean => commandExists("uv");
export const uvEnumerate = async (): Promise<Package[]> => {
  // `uv tool list` text: "ruff v0.6.2" then indented "- ruff" binary lines.
  const out = await capture(["uv", "tool", "list"]);
  const packages: Package[] = [];
  for (const line of out.split("\n")) {
    const match = /^(\S+)\s+v(\S+)/.exec(line);
    if (match !== null) {
      packages.push({ manager: "uv", name: match[1] ?? "", version: match[2] ?? "", description: "", homepage: "" });
    }
  }
  return packages;
};
