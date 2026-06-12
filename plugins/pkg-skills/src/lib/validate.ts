/**
 * Best-practices linter for generated skills, mirroring Anthropic's checklist:
 * frontmatter limits, reserved words, body length, one-level refs, TOC rule.
 * The autonomous path fails closed when a generated skill does not pass.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { isValidSkillName } from "#lib/naming.ts";

export interface Finding {
  level: "error" | "warning";
  rule: string;
  message: string;
}

// Anthropic caps: description ≤1024 chars (API), SKILL.md body <500 lines,
// reference files >100 lines need a table of contents.
const MAX_DESCRIPTION = 1024;
const MAX_BODY_LINES = 500;
const TOC_THRESHOLD_LINES = 100;

const parseFrontmatter = (text: string): { fm: Record<string, string>; body: string } => {
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(text);
  if (match === null) return { fm: {}, body: text };
  const fm: Record<string, string> = {};
  for (const line of (match[1] ?? "").split("\n")) {
    const colon = line.indexOf(":");
    if (colon > 0) fm[line.slice(0, colon).trim()] = line.slice(colon + 1).trim();
  }
  return { fm, body: match[2] ?? "" };
};

export const validateSkillDir = (dir: string): Finding[] => {
  const findings: Finding[] = [];
  const skillPath = join(dir, "SKILL.md");
  if (!existsSync(skillPath)) {
    return [{ level: "error", rule: "structure", message: "SKILL.md is missing" }];
  }
  const { fm, body } = parseFrontmatter(readFileSync(skillPath, "utf8"));

  const name = fm.name ?? "";
  if (name === "") findings.push({ level: "error", rule: "name", message: "frontmatter `name` is missing" });
  else if (!isValidSkillName(name))
    findings.push({ level: "error", rule: "name", message: `invalid name "${name}" (charset/length/reserved words)` });

  const description = fm.description ?? "";
  if (description === "")
    findings.push({ level: "error", rule: "description", message: "frontmatter `description` is missing" });
  if (description.length > MAX_DESCRIPTION)
    findings.push({ level: "error", rule: "description", message: `description exceeds ${MAX_DESCRIPTION} chars` });
  if (/<[a-z]+>/i.test(description))
    findings.push({ level: "error", rule: "description", message: "description contains XML-like tags" });

  const bodyLines = body.split("\n").length;
  if (bodyLines >= MAX_BODY_LINES)
    findings.push({ level: "error", rule: "body-length", message: `SKILL.md body has ${bodyLines} lines (max ${MAX_BODY_LINES})` });

  // One-level refs: files referenced from SKILL.md must exist; reference files
  // must not chain further @refs or relative md links into other reference files.
  const linked = [...body.matchAll(/\]\(((?:references|examples|snippets|scripts)\/[^)]+)\)/g)].map((m) => m[1] ?? "");
  for (const rel of linked) {
    if (!existsSync(join(dir, rel)))
      findings.push({ level: "error", rule: "refs-exist", message: `SKILL.md links to missing file: ${rel}` });
  }

  const refsDir = join(dir, "references");
  if (existsSync(refsDir)) {
    for (const entry of readdirSync(refsDir)) {
      const full = join(refsDir, entry);
      if (!statSync(full).isFile() || !entry.endsWith(".md")) continue;
      const text = readFileSync(full, "utf8");
      const lines = text.split("\n").length;
      if (lines > TOC_THRESHOLD_LINES && !/^##? Contents$/im.test(text))
        findings.push({ level: "warning", rule: "toc", message: `references/${entry} is ${lines} lines but has no "## Contents" TOC` });
      if (/\]\(references\//.test(text))
        findings.push({ level: "warning", rule: "one-level", message: `references/${entry} links to another reference file (refs must be one level deep)` });
    }
  }

  if (!existsSync(join(dir, "meta.json")))
    findings.push({ level: "warning", rule: "meta", message: "meta.json (machine-readable index) is missing" });

  return findings;
};

export const hasErrors = (findings: Finding[]): boolean => findings.some((f) => f.level === "error");
