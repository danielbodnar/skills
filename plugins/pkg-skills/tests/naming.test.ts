import { describe, expect, test } from "bun:test";
import { isValidSkillName, skillNameFor } from "#lib/naming.ts";

describe("skill naming", () => {
  test("plain package names get the pkg- prefix", () => {
    expect(skillNameFor("fd")).toBe("pkg-fd");
    expect(skillNameFor("ripgrep")).toBe("pkg-ripgrep");
  });

  test("scoped/odd names are slugified", () => {
    expect(skillNameFor("@biomejs/biome")).toBe("pkg-biomejs-biome");
    expect(skillNameFor("github.com/junegunn/fzf")).toBe("pkg-github-com-junegunn-fzf");
  });

  test("reserved words are stripped (Anthropic rule)", () => {
    expect(skillNameFor("claude-code")).toBe("pkg-code");
    expect(skillNameFor("anthropic-sdk")).toBe("pkg-sdk");
    expect(isValidSkillName(skillNameFor("claude-code"))).toBe(true);
  });

  test("fully-reserved names fall back instead of emptying", () => {
    expect(skillNameFor("claude")).toBe("pkg-tool");
  });

  test("names are capped at 64 chars and stay valid", () => {
    const long = skillNameFor("x".repeat(100));
    expect(long.length).toBeLessThanOrEqual(64);
    expect(isValidSkillName(long)).toBe(true);
  });

  test("validator rejects reserved words and bad charset", () => {
    expect(isValidSkillName("pkg-claude-code")).toBe(false);
    expect(isValidSkillName("Pkg-Fd")).toBe(false);
    expect(isValidSkillName("pkg-fd")).toBe(true);
  });
});
