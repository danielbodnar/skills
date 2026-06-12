import { describe, expect, test } from "bun:test";
import { mergePackagesConf, parsePackagesConf } from "#lib/config.ts";
import type { Package } from "#lib/schema.ts";

const pkg = (manager: Package["manager"], name: string, version = "1.0.0"): Package => ({
  manager,
  name,
  version,
  description: "",
  homepage: "",
});

describe("packages.conf merge", () => {
  test("new packages arrive commented out", () => {
    const out = mergePackagesConf("", [pkg("pacman", "fd", "10.2.0")]);
    expect(out).toContain("# pacman:fd  @10.2.0");
  });

  test("merge is idempotent", () => {
    const found = [pkg("pacman", "fd"), pkg("cargo", "ripgrep")];
    const once = mergePackagesConf("", found);
    const twice = mergePackagesConf(once, found);
    expect(twice).toBe(once);
  });

  test("user opt-in survives re-sync and version bumps", () => {
    const first = mergePackagesConf("", [pkg("pacman", "fd", "10.0.0")]);
    const optedIn = first.replace("# pacman:fd", "pacman:fd");
    const resynced = mergePackagesConf(optedIn, [pkg("pacman", "fd", "10.2.0")]);
    const { entries } = parsePackagesConf(resynced);
    expect(entries).toEqual([{ key: "pacman:fd", manager: "pacman", name: "fd", version: "10.2.0", enabled: true }]);
  });

  test("vanished packages are dropped unless opted in", () => {
    const conf = ["# pacman:gone  @1.0.0", "pacman:kept  @1.0.0"].join("\n");
    const merged = mergePackagesConf(conf, []);
    expect(merged).not.toContain("gone");
    expect(merged).toContain("pacman:kept");
  });

  test("parse round-trips enabled and disabled entries", () => {
    const { entries } = parsePackagesConf("# npm:typescript  @5.6.0\nbun:oxlint  @0.9.0\n");
    expect(entries.map((e) => [e.key, e.enabled])).toEqual([
      ["npm:typescript", false],
      ["bun:oxlint", true],
    ]);
  });
});
