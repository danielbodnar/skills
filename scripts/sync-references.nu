#!/usr/bin/env nu
# Syncs references, snippets, rules, styleguides, and standards to ~/.claude/
# Creates symlinks from repo entries into the corresponding ~/.claude/ directories

# Check if a path is a symlink by listing its parent directory
def is-symlink [target_path: string] {
  let parent = ($target_path | path dirname)
  let basename = ($target_path | path basename)
  let matches = (ls -la $parent | where { |row| ($row.name | path basename) == $basename })
  if ($matches | is-empty) {
    false
  } else {
    ($matches | get 0 | get type) == "symlink"
  }
}

def sync-directory [root: string, claude_home: string, source_name: string, dry_run: bool] {
  let source_dir = ($root | path join $source_name)
  let target_dir = ($claude_home | path join $source_name)

  if not ($source_dir | path exists) {
    print $"    [skip] ($source_name)/: source not found"
    return { created: 0, skipped: 1, errors: 0 }
  }

  # Ensure target directory exists
  if not ($target_dir | path exists) {
    if not $dry_run {
      mkdir $target_dir
    }
  }

  let entries = (ls $source_dir)

  if ($entries | is-empty) {
    print $"    [skip] ($source_name)/: empty directory"
    return { created: 0, skipped: 1, errors: 0 }
  }

  let results = ($entries | each { |entry|
    let entry_name = ($entry.name | path basename)
    let source_path = $entry.name
    let target_path = ($target_dir | path join $entry_name)

    if ($target_path | path exists) {
      if (is-symlink $target_path) {
        { status: "skipped", msg: $"($source_name)/($entry_name) \(already linked\)" }
      } else {
        { status: "skipped", msg: $"($source_name)/($entry_name) \(exists, not a symlink\)" }
      }
    } else if $dry_run {
      print $"    [dry]  ($source_path) -> ($target_path)"
      { status: "created", msg: $"($source_name)/($entry_name)" }
    } else {
      try {
        ^ln -s $source_path $target_path
        print $"    [ok]   ($source_name)/($entry_name) -> linked"
        { status: "created", msg: $"($source_name)/($entry_name)" }
      } catch {
        print $"    [err]  ($source_name)/($entry_name): symlink failed"
        { status: "error", msg: $"($source_name)/($entry_name)" }
      }
    }
  })

  let created = ($results | where status == "created" | length)
  let skipped = ($results | where status == "skipped" | length)
  let errors = ($results | where status == "error" | length)

  { created: $created, skipped: $skipped, errors: $errors }
}

def main [
  --dry-run  # Preview changes without creating symlinks
] {
  let root = ($env.FILE_PWD | path dirname)
  let claude_home = ($env.HOME | path join ".claude")
  let sync_dirs = ["references" "snippets" "rules" "styleguides" "standards"]

  let mode = if $dry_run { "Previewing" } else { "Syncing" }
  print $"\n($mode) to ($claude_home)/...\n"

  let results = ($sync_dirs | each { |dir|
    print $"  ($dir)/"
    sync-directory $root $claude_home $dir $dry_run
  })

  let total_created = ($results | get created | math sum)
  let total_skipped = ($results | get skipped | math sum)
  let total_errors = ($results | get errors | math sum)

  print ""
  print $"Results: ($total_created) created, ($total_skipped) skipped, ($total_errors) error\(s\)"
  if $dry_run {
    print "(dry run -- no changes made)"
  }
  print ""
}
