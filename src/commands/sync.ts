import { Effect } from "effect"
import { resolve } from "node:path"
import { existsSync, readdirSync, symlinkSync, lstatSync } from "node:fs"

interface SyncOptions {
  dryRun?: boolean
  verbose?: boolean
}

const ROOT = resolve(import.meta.dir, "../..")
const CLAUDE_HOME = resolve(process.env.HOME ?? "~", ".claude")

const syncDirectory = (
  sourceName: string,
  options: SyncOptions
): { created: number; skipped: number; errors: number } => {
  const sourceDir = resolve(ROOT, sourceName)
  const targetDir = resolve(CLAUDE_HOME, sourceName)
  let created = 0
  let skipped = 0
  let errors = 0

  if (!existsSync(sourceDir)) {
    console.log(`  [skip] ${sourceName}/: source not found`)
    return { created: 0, skipped: 1, errors: 0 }
  }

  const entries = readdirSync(sourceDir, { withFileTypes: true })
  for (const entry of entries) {
    const sourcePath = resolve(sourceDir, entry.name)
    const targetPath = resolve(targetDir, entry.name)

    if (existsSync(targetPath)) {
      try {
        const stat = lstatSync(targetPath)
        if (stat.isSymbolicLink()) {
          if (options.verbose) console.log(`  [ok]   ${sourceName}/${entry.name} (already linked)`)
          skipped++
          continue
        }
      } catch {
        // stat failed, try to create anyway
      }

      if (options.verbose) console.log(`  [skip] ${sourceName}/${entry.name} (exists, not a symlink)`)
      skipped++
      continue
    }

    if (options.dryRun) {
      console.log(`  [dry]  ${sourcePath} -> ${targetPath}`)
      created++
      continue
    }

    try {
      symlinkSync(sourcePath, targetPath)
      if (options.verbose) console.log(`  [ok]   ${sourceName}/${entry.name} -> linked`)
      created++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`  [err]  ${sourceName}/${entry.name}: ${msg}`)
      errors++
    }
  }

  return { created, skipped, errors }
}

export const syncCommand = (options: SyncOptions): Effect.Effect<void, Error> =>
  Effect.gen(function* () {
    console.log(`\n${options.dryRun ? "Previewing" : "Syncing"} to ${CLAUDE_HOME}/...\n`)

    const dirs = ["references", "snippets", "rules", "styleguides", "standards"]
    let totalCreated = 0
    let totalSkipped = 0
    let totalErrors = 0

    for (const dir of dirs) {
      console.log(`  ${dir}/`)
      const result = syncDirectory(dir, options)
      totalCreated += result.created
      totalSkipped += result.skipped
      totalErrors += result.errors
    }

    console.log("")
    console.log(`Results: ${totalCreated} created, ${totalSkipped} skipped, ${totalErrors} error(s)`)
    if (options.dryRun) console.log(`(dry run — no changes made)`)
    console.log("")
  })
