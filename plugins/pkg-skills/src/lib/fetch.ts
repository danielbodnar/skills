/**
 * Deterministic doc fetcher — populates $XDG_CACHE_HOME/pkg-skills/<key>/ with
 * everything a skill needs, so agent enrichment can run offline on local files.
 *
 * Artifacts: cli-help.txt, man.txt, tldr.md, readme.md, releases.md, links.md
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Package } from "#lib/schema.ts";
import { packageCacheDir } from "#lib/paths.ts";
import { capture, commandExists } from "#lib/managers/run.ts";
import { binaries as pacmanBinaries, detail as pacmanDetail } from "#lib/managers/pacman.ts";
import { fetchGithubDocs, deriveRepo } from "#lib/github.ts";

/**
 * Resolve the binary a package provides. Package name wins when it is on
 * PATH; otherwise pacman's file list disambiguates (ripgrep -> rg).
 */
export const resolveBin = async (pkg: Package): Promise<string> => {
  const candidate = pkg.bin !== undefined && pkg.bin !== "" ? pkg.bin : (pkg.name.split("/").pop() ?? pkg.name);
  if (commandExists(candidate)) return candidate;
  if (pkg.manager === "pacman") {
    const bins = await pacmanBinaries(pkg.name);
    const onPath = bins.find((bin) => commandExists(bin));
    if (onPath !== undefined) return onPath;
    if (bins[0] !== undefined) return bins[0];
  }
  return candidate;
};

export interface FetchedSource {
  kind: "cli-help" | "man" | "tldr" | "github-readme" | "github-releases" | "changelog" | "links";
  provenance: "fetched" | "inferred";
  path: string;
  fetchedAt: string;
}

const write = (dir: string, file: string, content: string): string => {
  const path = join(dir, file);
  writeFileSync(path, content);
  return path;
};

/** Try `<bin> --help`, falling back to `help` subcommand and `-h`. */
const cliHelp = async (bin: string): Promise<string> => {
  for (const args of [["--help"], ["help"], ["-h"]]) {
    const out = await capture([bin, ...args]);
    if (out.trim() !== "") return out;
  }
  return "";
};

const manPage = async (bin: string): Promise<string> => {
  if (!commandExists("man")) return "";
  // col -b strips overstrike formatting; MANWIDTH keeps lines readable in markdown.
  const proc = Bun.spawn(["man", bin], {
    stdout: "pipe",
    stderr: "ignore",
    env: { ...process.env, MANWIDTH: "100", MANPAGER: "cat", PAGER: "cat" },
  });
  const text = await new Response(proc.stdout).text();
  await proc.exited;
  return proc.exitCode === 0 ? text.replaceAll(/.\x08/g, "") : "";
};

const tldrPage = async (bin: string): Promise<string> => {
  if (!commandExists("tldr")) return "";
  return capture(["tldr", "--raw", bin]).then((out) => (out.trim() === "" ? capture(["tldr", bin]) : out));
};

/** Enrich a package with description/homepage from its manager when missing. */
export const hydrate = async (pkg: Package): Promise<Package> => {
  const bin = await resolveBin(pkg);
  pkg = { ...pkg, bin };
  if (pkg.manager === "pacman" && (pkg.description === "" || pkg.homepage === "")) {
    const info = await pacmanDetail(pkg.name);
    return { ...pkg, description: pkg.description || info.description, homepage: pkg.homepage || info.homepage };
  }
  if ((pkg.manager === "npm" || pkg.manager === "bun" || pkg.manager === "pnpm" || pkg.manager === "yarn") && commandExists("bun")) {
    const out = await capture(["bun", "info", pkg.name, "--json"]);
    try {
      const meta = JSON.parse(out) as { description?: string; homepage?: string; repository?: { url?: string } };
      return {
        ...pkg,
        description: pkg.description || (meta.description ?? ""),
        homepage: pkg.homepage || (meta.homepage ?? meta.repository?.url ?? ""),
      };
    } catch {
      return pkg;
    }
  }
  if (pkg.manager === "cargo" && pkg.homepage === "") {
    // crates.io convention: most cargo installs are hosted on the crate page.
    return { ...pkg, homepage: `https://crates.io/crates/${pkg.name}` };
  }
  return pkg;
};

/**
 * Fetch all artifacts for a package into its cache dir.
 * Network use is limited to GitHub (when enabled); everything else is local.
 */
export const fetchAll = async (pkg: Package, options: { github: boolean }): Promise<FetchedSource[]> => {
  const dir = packageCacheDir(pkg.manager, pkg.name);
  mkdirSync(dir, { recursive: true });
  const now = (): string => new Date().toISOString();
  const sources: FetchedSource[] = [];

  // Use the resolved binary (set by hydrate); fall back to the package name.
  const bin = pkg.bin !== undefined && pkg.bin !== "" ? pkg.bin : (pkg.name.split("/").pop() ?? pkg.name);

  const help = await cliHelp(bin);
  if (help !== "") sources.push({ kind: "cli-help", provenance: "fetched", path: write(dir, "cli-help.txt", help), fetchedAt: now() });

  const man = await manPage(bin);
  if (man !== "") sources.push({ kind: "man", provenance: "fetched", path: write(dir, "man.txt", man), fetchedAt: now() });

  const tldr = await tldrPage(bin);
  if (tldr !== "") sources.push({ kind: "tldr", provenance: "fetched", path: write(dir, "tldr.md", tldr), fetchedAt: now() });

  const repo = deriveRepo(pkg.homepage);
  const links = [
    `# Links — ${pkg.name}`,
    "",
    pkg.homepage === "" ? "" : `- Homepage: ${pkg.homepage}`,
    repo === null ? "" : `- Repository: https://github.com/${repo}`,
    repo === null ? "" : `- Issues: https://github.com/${repo}/issues`,
    repo === null ? "" : `- Releases: https://github.com/${repo}/releases`,
  ]
    .filter((line) => line !== "")
    .join("\n");
  sources.push({ kind: "links", provenance: "inferred", path: write(dir, "links.md", `${links}\n`), fetchedAt: now() });

  if (options.github && repo !== null) {
    const gh = await fetchGithubDocs(repo);
    if (gh.readme !== "") sources.push({ kind: "github-readme", provenance: "fetched", path: write(dir, "readme.md", gh.readme), fetchedAt: now() });
    if (gh.releases !== "") sources.push({ kind: "github-releases", provenance: "fetched", path: write(dir, "releases.md", gh.releases), fetchedAt: now() });
    if (gh.changelog !== "") sources.push({ kind: "changelog", provenance: "fetched", path: write(dir, "changelog.md", gh.changelog), fetchedAt: now() });
  }

  return sources;
};
