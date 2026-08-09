/**
 * Headless interpreter for the templates/ directory.
 *
 * Templates are REAL files using two conventions (mirroring Claude Code):
 *   ${VAR}            — substituted from the vars map
 *   @relative/path    — on its own line: inlined from the package cache dir
 *                       (missing files render as an explanatory placeholder)
 * The /pkg-skills-scaffold slash command interprets the same directory with an
 * agent in the loop; this resolver is the no-agent equivalent so both paths
 * produce identical structure.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

export type Vars = Record<string, string>;

/** Substitute ${VAR}; unknown vars become empty strings (never leak braces). */
export const substitute = (text: string, vars: Vars): string =>
  text.replaceAll(/\$\{([A-Z0-9_]+)\}/g, (_whole, name: string) => vars[name] ?? "");

/** Inline @file references (whole-line form) from a base directory. */
export const inlineRefs = (text: string, baseDir: string): string =>
  text
    .split("\n")
    .map((line) => {
      const match = /^@([\w./-]+)\s*$/.exec(line.trim());
      if (match === null) return line;
      const ref = match[1] ?? "";
      if (ref.startsWith("/") || ref.split("/").includes("..")) return `_(invalid ref: ${ref})_`;
      const target = join(baseDir, ref);
      if (!existsSync(target)) return `_(not available: ${ref})_`;
      return readFileSync(target, "utf8").trimEnd();
    })
    .join("\n");

const walk = (dir: string): string[] => {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
};

/**
 * Render every file in templateDir into outDir, substituting vars and
 * inlining @refs from refsDir (the package's fetch cache).
 * Binary-ish files are copied verbatim.
 */
export const renderDir = (templateDir: string, outDir: string, vars: Vars, refsDir: string): string[] => {
  const written: string[] = [];
  for (const file of walk(templateDir)) {
    const rel = relative(templateDir, file);
    // VARIABLES.md documents the template language; it is not part of the output.
    if (rel === "VARIABLES.md") continue;
    const out = join(outDir, substitute(rel, vars));
    mkdirSync(dirname(out), { recursive: true });
    if (/\.(md|txt|json|sh|nu|toml|yaml|yml)$/.test(rel)) {
      const rendered = substitute(inlineRefs(readFileSync(file, "utf8"), refsDir), vars);
      writeFileSync(out, rendered);
    } else {
      cpSync(file, out);
    }
    written.push(out);
  }
  return written;
};
