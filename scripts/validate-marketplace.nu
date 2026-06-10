#!/usr/bin/env nu
# Validates marketplace.json — checks local plugin source paths, manifests,
# and required fields on remote (github/url/git-subdir/npm) sources
# Exit code 1 if any errors found

def main [] {
  let root = ($env.FILE_PWD | path dirname)
  let marketplace_path = ($root | path join ".claude-plugin" "marketplace.json")

  print "\nValidating marketplace...\n"

  if not ($marketplace_path | path exists) {
    print "  [err]  marketplace.json not found"
    exit 1
  }

  let marketplace = (open $marketplace_path)
  let plugin_count = ($marketplace.plugins | length)

  print $"  [ok]   marketplace.json \(($plugin_count) plugins\)"

  # Duplicate plugin names are errors (mirrors src/commands/validate.ts)
  let dup_results = ($marketplace.plugins
    | get name
    | uniq --count
    | where count > 1
    | each { |dup|
      print $"  [err]  ($dup.value): duplicate plugin name"
      {name: $dup.value, status: "error"}
    })

  let results = ($marketplace.plugins | each { |plugin|
    let source = $plugin.source

    if ($source | describe | str starts-with "string") {
      # Local relative-path source
      let source_path = ($root | path join $source)
      let manifest_path = ($source_path | path join ".claude-plugin" "plugin.json")

      if not ($source | str starts-with "./") {
        print $"  [err]  ($plugin.name): local source must start with ./"
        { name: $plugin.name, status: "error" }
      } else if not ($source_path | path exists) {
        print $"  [err]  ($plugin.name): source not found \(($source)\)"
        { name: $plugin.name, status: "error" }
      } else if not ($manifest_path | path exists) {
        print $"  [warn] ($plugin.name): no plugin.json manifest"
        { name: $plugin.name, status: "warning" }
      } else {
        { name: $plugin.name, status: "ok" }
      }
    } else {
      # Remote source object — check required fields per source type
      let kind = $source.source?
      let valid = match $kind {
        "github" => (($source.repo? | default "") != ""),
        "url" => (($source.url? | default "") != ""),
        "git-subdir" => ((($source.url? | default "") != "") and (($source.path? | default "") != "")),
        "npm" => (($source.package? | default "") != ""),
        _ => false,
      }
      if $valid {
        { name: $plugin.name, status: "ok" }
      } else {
        print $"  [err]  ($plugin.name): remote source missing required fields \(type: ($kind | default 'unknown')\)"
        { name: $plugin.name, status: "error" }
      }
    }
  })

  # marketplace.json itself counts as 1 ok
  let all_results = ($results | append $dup_results)
  let ok_count = 1 + ($all_results | where status == "ok" | length)
  let warn_count = ($all_results | where status == "warning" | length)
  let err_count = ($all_results | where status == "error" | length)

  print ""
  print $"Results: ($ok_count) ok, ($warn_count) warning\(s\), ($err_count) error\(s\)"
  print ""

  if $err_count > 0 {
    exit 1
  }
}
