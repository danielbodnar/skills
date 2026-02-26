#!/usr/bin/env nu
# Generates CATALOG.md from marketplace plugins, references, snippets, and configs

def main [
  --output (-o): string  # Output file path (default: CATALOG.md)
] {
  let root = ($env.FILE_PWD | path dirname)
  let marketplace_path = ($root | path join ".claude-plugin" "marketplace.json")
  let output_path = ($output | default ($root | path join "CATALOG.md"))

  let marketplace = (open $marketplace_path)

  # Build plugins table
  let plugin_rows = ($marketplace.plugins | each { |plugin|
    let category = ($plugin.category? | default "general")
    $"| ($plugin.name) | ($category) | `($plugin.source)` | ($plugin.description) |"
  } | str join "\n")

  # Scan references/*.md
  let refs_dir = ($root | path join "references")
  let refs_section = if ($refs_dir | path exists) {
    let refs = (ls $refs_dir
      | where name =~ '\.md$'
      | get name
      | each { |f| $f | path basename | str replace ".md" "" }
      | sort
      | each { |r| $"- ($r)" }
      | str join "\n")
    $refs
  } else {
    "*No references found.*"
  }

  # Scan snippets/ directories
  let snippets_dir = ($root | path join "snippets")
  let snippets_section = if ($snippets_dir | path exists) {
    let snippets = (ls $snippets_dir
      | where type == dir
      | each { |d|
        let count = (ls $d.name | length)
        let name = ($d.name | path basename)
        $"- **($name)** \(($count) items\)"
      }
      | sort
      | str join "\n")
    $snippets
  } else {
    "*No snippets found.*"
  }

  # Scan configs/ directories
  let configs_dir = ($root | path join "configs")
  let configs_section = if ($configs_dir | path exists) {
    let configs = (ls $configs_dir
      | where type == dir
      | each { |d|
        let count = (ls $d.name | length)
        let name = ($d.name | path basename)
        $"- **($name)** \(($count) items\)"
      }
      | sort
      | str join "\n")
    $configs
  } else {
    "*No configs found.*"
  }

  let catalog = ([
    $"# ($marketplace.name) Catalog"
    ""
    $marketplace.metadata.description
    ""
    "## Plugins"
    ""
    "| Name | Category | Source | Description |"
    "|------|----------|--------|-------------|"
    $plugin_rows
    ""
    "## References"
    ""
    $refs_section
    ""
    "## Snippets"
    ""
    $snippets_section
    ""
    "## Configs"
    ""
    $configs_section
    ""
  ] | str join "\n")

  $catalog | save -f $output_path

  print $"\nCatalog generated: ($output_path)\n"
}
