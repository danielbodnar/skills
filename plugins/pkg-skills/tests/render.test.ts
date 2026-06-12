import { describe, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { inlineRefs, renderDir, substitute } from "#lib/render.ts";

describe("template rendering", () => {
  test("substitutes ${VAR} and blanks unknown vars", () => {
    expect(substitute("hello ${PKG_NAME} v${PKG_VERSION} ${NOPE}", { PKG_NAME: "fd", PKG_VERSION: "10" })).toBe(
      "hello fd v10 ",
    );
  });

  test("inlines whole-line @refs from the cache dir", () => {
    const dir = mkdtempSync(join(tmpdir(), "pkgskills-refs-"));
    writeFileSync(join(dir, "cli-help.txt"), "USAGE: fd [pattern]");
    const out = inlineRefs("before\n@cli-help.txt\nafter", dir);
    expect(out).toBe("before\nUSAGE: fd [pattern]\nafter");
  });

  test("missing @refs render an explanatory placeholder", () => {
    const dir = mkdtempSync(join(tmpdir(), "pkgskills-refs-"));
    expect(inlineRefs("@missing.txt", dir)).toBe("_(not available: missing.txt)_");
  });

  test("renderDir renders a tree, skipping VARIABLES.md", () => {
    const templates = mkdtempSync(join(tmpdir(), "pkgskills-tpl-"));
    const cache = mkdtempSync(join(tmpdir(), "pkgskills-cache-"));
    const out = mkdtempSync(join(tmpdir(), "pkgskills-out-"));
    mkdirSync(join(templates, "references"), { recursive: true });
    writeFileSync(join(templates, "VARIABLES.md"), "legend");
    writeFileSync(join(templates, "SKILL.md"), "# ${PKG_NAME}");
    writeFileSync(join(templates, "references", "reference.md"), "@help.txt");
    writeFileSync(join(cache, "help.txt"), "HELP BODY");

    const written = renderDir(templates, out, { PKG_NAME: "fd" }, cache);
    expect(written.some((f) => f.endsWith("VARIABLES.md"))).toBe(false);
    expect(readFileSync(join(out, "SKILL.md"), "utf8")).toBe("# fd");
    expect(readFileSync(join(out, "references", "reference.md"), "utf8")).toBe("HELP BODY");
  });
});
