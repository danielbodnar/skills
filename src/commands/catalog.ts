import { Effect } from "effect"
import { readMarketplace } from "#lib/marketplace.ts"
import { resolve } from "node:path"
import { readdirSync, existsSync } from "node:fs"

interface CatalogOptions {
  output?: string
}

const ROOT = process.cwd()

const countItems = (dir: string): number => {
  if (!existsSync(dir)) return 0
  return readdirSync(dir, { withFileTypes: true }).length
}

export const catalogCommand = (options: CatalogOptions): Effect.Effect<void, Error> =>
  Effect.gen(function* () {
    const marketplace = yield* readMarketplace()

    const lines: string[] = [
      `# ${marketplace.name} Catalog`,
      "",
      marketplace.metadata.description,
      "",
      "## Plugins",
      "",
      `| Name | Category | Source | Description |`,
      `|------|----------|--------|-------------|`,
    ]

    for (const plugin of marketplace.plugins) {
      const category = plugin.category ?? "general"
      lines.push(`| ${plugin.name} | ${category} | \`${plugin.source}\` | ${plugin.description} |`)
    }

    lines.push("")
    lines.push("## References")
    lines.push("")

    const refsDir = resolve(ROOT, "references")
    if (existsSync(refsDir)) {
      const refs = readdirSync(refsDir).filter((f: string) => f.endsWith(".md")).sort()
      for (const ref of refs) {
        lines.push(`- ${ref.replace(".md", "")}`)
      }
    }

    lines.push("")
    lines.push("## Snippets")
    lines.push("")

    const snippetsDir = resolve(ROOT, "snippets")
    if (existsSync(snippetsDir)) {
      const snippets = readdirSync(snippetsDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .sort((a, b) => a.name.localeCompare(b.name))
      for (const dir of snippets) {
        const count = countItems(resolve(snippetsDir, dir.name))
        lines.push(`- **${dir.name}** (${count} items)`)
      }
    }

    lines.push("")
    lines.push("## Configs")
    lines.push("")

    const configsDir = resolve(ROOT, "configs")
    if (existsSync(configsDir)) {
      const categories = readdirSync(configsDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .sort((a, b) => a.name.localeCompare(b.name))
      for (const cat of categories) {
        const count = countItems(resolve(configsDir, cat.name))
        lines.push(`- **${cat.name}** (${count} items)`)
      }
    }

    lines.push("")

    const catalogPath = resolve(ROOT, options.output ?? "CATALOG.md")
    yield* Effect.tryPromise({
      try: () => Bun.write(catalogPath, lines.join("\n") + "\n"),
      catch: () => new Error(`Failed to write catalog to ${catalogPath}`),
    })

    console.log(`\nCatalog generated: ${catalogPath}\n`)
  })
