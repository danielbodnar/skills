import { describe, expect, test } from "bun:test"
import { Schema } from "effect"
import {
  MarketplaceSchema,
  PluginEntrySchema,
  formatSource,
  isLocalSource,
  isPinned,
} from "./schema.ts"

const decodeEntry = Schema.decodeUnknownSync(PluginEntrySchema)

describe("PluginEntrySchema", () => {
  test("accepts a local relative-path source", () => {
    const entry = decodeEntry({
      name: "code-quality",
      description: "linting",
      source: "./plugins/code-quality",
    })
    expect(entry.source).toBe("./plugins/code-quality")
  })

  test("accepts a github source", () => {
    const entry = decodeEntry({
      name: "superpowers",
      description: "workflows",
      source: { source: "github", repo: "obra/superpowers" },
    })
    expect(isLocalSource(entry.source)).toBe(false)
  })

  test("accepts a url source", () => {
    const entry = decodeEntry({
      name: "sentry",
      description: "monitoring",
      source: { source: "url", url: "https://github.com/getsentry/sentry-for-claude.git" },
    })
    expect(formatSource(entry.source)).toBe("git:https://github.com/getsentry/sentry-for-claude.git")
  })

  test("accepts a git-subdir source", () => {
    const entry = decodeEntry({
      name: "hookify",
      description: "hooks",
      source: {
        source: "git-subdir",
        url: "https://github.com/anthropics/claude-plugins-official.git",
        path: "plugins/hookify",
      },
    })
    expect(formatSource(entry.source)).toBe(
      "git:https://github.com/anthropics/claude-plugins-official.git#plugins/hookify"
    )
  })

  test("rejects a git-subdir source missing path", () => {
    expect(() =>
      decodeEntry({
        name: "broken",
        description: "x",
        source: { source: "git-subdir", url: "https://example.com/repo.git" },
      })
    ).toThrow()
  })

  test("preserves author, homepage, strict, and lspServers on round-trip", () => {
    const raw = {
      name: "typescript-lsp",
      description: "lsp",
      author: { name: "Anthropic", email: "support@anthropic.com" },
      homepage: "https://example.com",
      strict: false,
      lspServers: { typescript: { command: "typescript-language-server" } },
      source: {
        source: "git-subdir",
        url: "https://github.com/anthropics/claude-plugins-official.git",
        path: "plugins/typescript-lsp",
      },
    }
    const entry = decodeEntry(raw)
    expect(entry.author?.name).toBe("Anthropic")
    expect(entry.homepage).toBe("https://example.com")
    expect(entry.strict).toBe(false)
    expect(entry.lspServers).toEqual(raw.lspServers)
  })
})

describe("isPinned", () => {
  test("local sources are never pinned", () => {
    expect(isPinned("./plugins/code-quality")).toBe(false)
  })

  test("remote source without ref/sha tracks upstream", () => {
    expect(isPinned({ source: "github", repo: "obra/superpowers" })).toBe(false)
  })

  test("remote source with ref is pinned", () => {
    expect(isPinned({ source: "github", repo: "obra/superpowers", ref: "v4.3.1" })).toBe(true)
  })

  test("remote source with sha is pinned", () => {
    expect(isPinned({ source: "url", url: "https://x.git", sha: "abc123" })).toBe(true)
  })

  test("npm source with version is pinned", () => {
    expect(isPinned({ source: "npm", package: "foo" })).toBe(false)
    expect(isPinned({ source: "npm", package: "foo", version: "1.0.0" })).toBe(true)
  })
})

describe("formatSource", () => {
  test("unpinned sources format without a pin suffix", () => {
    expect(formatSource("./plugins/code-quality")).toBe("./plugins/code-quality")
    expect(formatSource({ source: "github", repo: "obra/superpowers" })).toBe(
      "github:obra/superpowers"
    )
    expect(formatSource({ source: "url", url: "https://x.git" })).toBe("git:https://x.git")
    expect(
      formatSource({ source: "git-subdir", url: "https://x.git", path: "plugins/hookify" })
    ).toBe("git:https://x.git#plugins/hookify")
    expect(formatSource({ source: "npm", package: "foo" })).toBe("npm:foo")
  })

  test("github source pinned to a ref includes the ref", () => {
    expect(formatSource({ source: "github", repo: "obra/superpowers", ref: "v4.3.1" })).toBe(
      "github:obra/superpowers@v4.3.1"
    )
  })

  test("sha wins over ref when both are set", () => {
    expect(
      formatSource({ source: "github", repo: "obra/superpowers", ref: "v4.3.1", sha: "abc123" })
    ).toBe("github:obra/superpowers@abc123")
  })

  test("url source pinned to a sha includes the sha", () => {
    expect(formatSource({ source: "url", url: "https://x.git", sha: "abc123" })).toBe(
      "git:https://x.git@abc123"
    )
  })

  test("git-subdir source appends the pin after the path", () => {
    expect(
      formatSource({
        source: "git-subdir",
        url: "https://x.git",
        path: "plugins/hookify",
        ref: "main",
      })
    ).toBe("git:https://x.git#plugins/hookify@main")
  })

  test("npm source with version includes the version", () => {
    expect(formatSource({ source: "npm", package: "foo", version: "1.0.0" })).toBe("npm:foo@1.0.0")
  })
})

describe("marketplace.json", () => {
  test("the repo manifest decodes against the schema", async () => {
    const raw = await Bun.file(
      new URL("../../.claude-plugin/marketplace.json", import.meta.url)
    ).json()
    const marketplace = Schema.decodeUnknownSync(MarketplaceSchema)(raw)
    expect(marketplace.plugins.length).toBeGreaterThanOrEqual(13)
    const names = marketplace.plugins.map((p) => p.name)
    expect(new Set(names).size).toBe(names.length)
  })
})
