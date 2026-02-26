# Nushell Scripting Standards

## Script Structure

```nushell
#!/usr/bin/env nu

# Script description
#
# Usage: script-name [flags] <args>

def main [
    arg: string              # Positional argument description
    --verbose (-v)           # Enable verbose output
    --dry-run (-n)           # Preview without changes
] {
    # Implementation
}
```

## Naming Conventions

- `kebab-case` for script filenames: `sync-references.nu`
- `kebab-case` for custom commands: `def my-command`
- `snake_case` for variables: `let my_var = ...`
- `SCREAMING_SNAKE_CASE` for constants: `const MAX_RETRIES = 3`

## Data Pipeline Style

Prefer structured data pipelines over imperative loops:

```nushell
# Preferred
ls **/*.ts | where size > 1kb | select name size | sort-by size --reverse

# Avoid
mut files = []
for f in (ls **/*.ts) {
    if $f.size > 1kb { $files = ($files | append $f) }
}
```

## Error Handling

```nushell
try {
    risky-operation
} catch { |e|
    print -e $"error: ($e.msg)"
    exit 1
}
```

Never use `&&` or `||`. Use `try`/`catch` for fallback logic.

## String Interpolation

Always use `$"..."` with `()` for expressions:

```nushell
let name = "world"
print $"Hello, ($name)!"
```

## Closures

```nushell
# Correct
ls | each { |f| $f.name }

# Also correct
ls | each { $in.name }

# Wrong (bash-style)
ls | each { |f| echo $f.name }
```

## Environment Variables

```nushell
# Set
$env.MY_VAR = "value"

# Read with default
$env.MY_VAR? | default "fallback"

# Never: export MY_VAR=value
```

## File Operations

```nushell
# Read file
open --raw file.txt

# Check existence
"file.txt" | path exists

# Path operations
$path | path dirname
$path | path basename
$path | path type
```

## Parallel Execution

Use `par-each` for parallel iteration:

```nushell
ls **/*.rs | par-each { |f| wc -l $f.name }
```

## No Bash-isms

| Wrong | Right |
|-------|-------|
| `cmd1 && cmd2` | `cmd1; cmd2` |
| `cmd1 \|\| cmd2` | `try { cmd1 } catch { cmd2 }` |
| `$(cmd)` | `(cmd)` |
| `export FOO=bar` | `$env.FOO = "bar"` |
| `2>&1` | `o+e>\|` |
| `cat file` | `open --raw file` |
| `grep pattern` | `where $it =~ pattern` |
