# Rule: Use Nushell

**This environment runs Nushell (v0.108.0+), not Bash/Zsh/Fish.**

All shell commands, scripts, and automation must use Nushell syntax.

## Key Syntax Differences

| Bash (WRONG) | Nushell (CORRECT) | Notes |
|--------------|-------------------|-------|
| `cmd1 && cmd2` | `cmd1; cmd2` | Sequential execution |
| `cmd1 \|\| cmd2` | `try { cmd1 } catch { cmd2 }` | Fallback on error |
| `export FOO=bar` | `$env.FOO = "bar"` | Environment variables |
| `echo $FOO` | `$env.FOO` | Read env var |
| `echo ${FOO:-default}` | `$env.FOO? \| default "val"` | Default value |
| `2>&1` | `o+e>\|` | Redirect stderr to stdout |
| `> /dev/null 2>&1` | `o+e>\| ignore` | Discard all output |
| `mkdir -p dir` | `mkdir dir` | Creates parents by default |
| `cat file` | `open --raw file` | Read file contents |
| `grep pattern` | `where $it =~ pattern` or `find pattern` | Filter/search |
| `cmd \| head -5` | `cmd \| first 5` | Limit output |
| `cmd \| tail -5` | `cmd \| last 5` | Last N items |
| `$(command)` | `(command)` | Command substitution |
| `for f in *.md; do` | `ls *.md \| each { $in.name }` | Iterate files |

## Script Headers

```nushell
#!/usr/bin/env nu
# Description of the script
```

## Error Handling

```nushell
# Correct error handling
try {
    risky-command
} catch { |e|
    print $"Error: ($e.msg)"
}

# NOT: risky-command || echo "failed"
```

## Data Pipeline Preference

Prefer structured data pipelines over imperative loops:

```nushell
# Preferred
ls **/*.ts | where size > 1kb | select name size

# Avoid
mut files = []
for f in (ls **/*.ts) {
    if $f.size > 1kb { $files = ($files | append $f) }
}
```
