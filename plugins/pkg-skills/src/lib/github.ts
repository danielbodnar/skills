/**
 * GitHub doc fetching — README, recent releases, CHANGELOG.
 * Uses `gh` when authenticated (higher rate limits), raw HTTPS otherwise.
 */
import { capture, commandExists } from "#lib/managers/run.ts";

/** Extract "owner/repo" from a homepage/repository URL, or null. */
export const deriveRepo = (url: string): string | null => {
  const match = /github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:[/#?].*)?$/.exec(url);
  if (match === null) return null;
  return `${match[1]}/${match[2]}`;
};

const httpGet = async (url: string): Promise<string> => {
  try {
    // 15s guards against hung connections on flaky networks; GitHub responds in <2s normally.
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    return res.ok ? await res.text() : "";
  } catch {
    return "";
  }
};

const ghApi = async (path: string): Promise<string> => {
  if (!commandExists("gh")) return "";
  return capture(["gh", "api", path, "-H", "Accept: application/vnd.github.raw+json"]);
};

const fetchReadme = async (repo: string): Promise<string> => {
  const viaGh = await ghApi(`repos/${repo}/readme`);
  if (viaGh !== "") return viaGh;
  for (const branch of ["HEAD", "main", "master"]) {
    for (const file of ["README.md", "readme.md", "README.rst"]) {
      const text = await httpGet(`https://raw.githubusercontent.com/${repo}/${branch}/${file}`);
      if (text !== "") return text;
    }
  }
  return "";
};

const fetchChangelog = async (repo: string): Promise<string> => {
  for (const file of ["CHANGELOG.md", "CHANGES.md", "HISTORY.md"]) {
    const text = await httpGet(`https://raw.githubusercontent.com/${repo}/HEAD/${file}`);
    if (text !== "") return text;
  }
  return "";
};

const fetchReleases = async (repo: string): Promise<string> => {
  if (commandExists("gh")) {
    const out = await capture([
      "gh", "release", "list", "--repo", repo, "--limit", "10",
      "--json", "tagName,name,publishedAt",
    ]);
    try {
      const releases = JSON.parse(out) as Array<{ tagName: string; name: string; publishedAt: string }>;
      if (releases.length > 0) {
        const lines = releases.map((r) => `- **${r.tagName}** ${r.name} (${r.publishedAt.slice(0, 10)})`);
        return `# Recent releases — ${repo}\n\n${lines.join("\n")}\n`;
      }
    } catch {
      // fall through to atom feed
    }
  }
  const atom = await httpGet(`https://github.com/${repo}/releases.atom`);
  if (atom === "") return "";
  const titles = [...atom.matchAll(/<title>([^<]+)<\/title>/g)].slice(1, 11).map((m) => `- ${m[1]}`);
  return titles.length === 0 ? "" : `# Recent releases — ${repo}\n\n${titles.join("\n")}\n`;
};

export interface GithubDocs {
  readme: string;
  releases: string;
  changelog: string;
}

export const fetchGithubDocs = async (repo: string): Promise<GithubDocs> => {
  const [readme, releases, changelog] = await Promise.all([
    fetchReadme(repo),
    fetchReleases(repo),
    fetchChangelog(repo),
  ]);
  return { readme, releases, changelog };
};
