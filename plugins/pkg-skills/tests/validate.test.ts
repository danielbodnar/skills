import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hasErrors, validateSkillDir } from "#lib/validate.ts";

const makeSkill = (frontmatter: string, body: string): string => {
  const dir = mkdtempSync(join(tmpdir(), "pkgskills-val-"));
  writeFileSync(join(dir, "SKILL.md"), `---\n${frontmatter}\n---\n${body}`);
  writeFileSync(join(dir, "meta.json"), "{}");
  return dir;
};

describe("skill validation", () => {
  test("a conforming skill passes", () => {
    const dir = makeSkill("name: pkg-fd\ndescription: Finds files fast. Use when searching the filesystem.", "# fd\n");
    expect(hasErrors(validateSkillDir(dir))).toBe(false);
  });

  test("reserved word in name fails closed", () => {
    const dir = makeSkill("name: pkg-claude-fd\ndescription: x", "# fd\n");
    const findings = validateSkillDir(dir);
    expect(findings.some((f) => f.rule === "name" && f.level === "error")).toBe(true);
  });

  test("body over 500 lines is an error", () => {
    const dir = makeSkill("name: pkg-fd\ndescription: x", "line\n".repeat(501));
    expect(validateSkillDir(dir).some((f) => f.rule === "body-length")).toBe(true);
  });

  test("links to missing bundled files are errors", () => {
    const dir = makeSkill("name: pkg-fd\ndescription: x", "see [ref](references/reference.md)\n");
    expect(validateSkillDir(dir).some((f) => f.rule === "refs-exist")).toBe(true);
  });

  test("long reference without TOC warns; ref->ref chains warn", () => {
    const dir = makeSkill("name: pkg-fd\ndescription: x", "# fd\n");
    mkdirSync(join(dir, "references"), { recursive: true });
    writeFileSync(join(dir, "references", "big.md"), "x\n".repeat(150));
    writeFileSync(join(dir, "references", "chain.md"), "[next](references/other.md)");
    const rules = validateSkillDir(dir).map((f) => f.rule);
    expect(rules).toContain("toc");
    expect(rules).toContain("one-level");
  });

  test("missing SKILL.md is a structural error", () => {
    const dir = mkdtempSync(join(tmpdir(), "pkgskills-val-"));
    expect(hasErrors(validateSkillDir(dir))).toBe(true);
  });
});
