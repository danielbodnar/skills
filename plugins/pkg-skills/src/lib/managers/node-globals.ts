/**
 * bun / npm / pnpm / yarn — globally installed JS packages.
 * All four share the same JSON/text list shapes, so one module covers them.
 */
import type { Manager, Package } from "#lib/schema.ts";
import { capture, commandExists } from "#lib/managers/run.ts";

const fromJsonDeps = (manager: Manager, json: string): Package[] => {
  try {
    const parsed = JSON.parse(json) as { dependencies?: Record<string, { version?: string }> };
    return Object.entries(parsed.dependencies ?? {}).map(([name, info]) => ({
      manager,
      name,
      version: info.version ?? "",
      description: "",
      homepage: "",
    }));
  } catch {
    return [];
  }
};

export const bunAvailable = (): boolean => commandExists("bun");
export const bunEnumerate = async (): Promise<Package[]> => {
  // `bun pm ls -g` text output: "├── prettier@3.3.0"
  const out = await capture(["bun", "pm", "ls", "-g"]);
  const packages: Package[] = [];
  for (const line of out.split("\n")) {
    const match = /[├└]──\s+(@?[^@\s]+(?:\/[^@\s]+)?)@(\S+)/.exec(line);
    if (match !== null) {
      packages.push({ manager: "bun", name: match[1] ?? "", version: match[2] ?? "", description: "", homepage: "" });
    }
  }
  return packages;
};

export const npmAvailable = (): boolean => commandExists("npm");
export const npmEnumerate = async (): Promise<Package[]> =>
  fromJsonDeps("npm", await capture(["npm", "ls", "-g", "--json", "--depth=0"]));

export const pnpmAvailable = (): boolean => commandExists("pnpm");
export const pnpmEnumerate = async (): Promise<Package[]> => {
  const out = await capture(["pnpm", "ls", "-g", "--json", "--depth=0"]);
  try {
    const parsed = JSON.parse(out) as Array<{ dependencies?: Record<string, { version?: string }> }>;
    return (parsed ?? []).flatMap((project) =>
      Object.entries(project.dependencies ?? {}).map(([name, info]) => ({
        manager: "pnpm" as const,
        name,
        version: info.version ?? "",
        description: "",
        homepage: "",
      })),
    );
  } catch {
    return [];
  }
};

export const yarnAvailable = (): boolean => commandExists("yarn");
export const yarnEnumerate = async (): Promise<Package[]> => {
  // `yarn global list` (classic): "info \"prettier@3.3.0\" has binaries:"
  const out = await capture(["yarn", "global", "list", "--depth=0"]);
  const packages: Package[] = [];
  for (const line of out.split("\n")) {
    const match = /info "(@?[^@"]+(?:\/[^@"]+)?)@([^"]+)"/.exec(line);
    if (match !== null) {
      packages.push({ manager: "yarn", name: match[1] ?? "", version: match[2] ?? "", description: "", homepage: "" });
    }
  }
  return packages;
};
