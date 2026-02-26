# Rule: Prevent Chained Shell Commands

**Do not use Bash-style command chaining operators in this environment.**

## Forbidden Operators

| Operator | What it does in Bash | Why it fails |
|----------|---------------------|--------------|
| `&&` | Run next if success | Not valid Nushell syntax |
| `\|\|` | Run next if failure | Not valid Nushell syntax |
| `&` | Background process | Use `job spawn { }` in Nushell |
| `;` after `&&` | Mixed chaining | Nushell uses `;` alone |

## Correct Patterns

### Sequential Commands (replace `&&`)

```nushell
# Run commands in sequence (both always run)
command1; command2; command3

# Run commands where later ones depend on success
# (Nushell stops on error by default in scripts)
command1
command2
command3
```

### Fallback on Error (replace `||`)

```nushell
try { command1 } catch { fallback-command }
```

### Background Processes (replace `&`)

```nushell
job spawn { long-running-command }
```

### Conditional Execution

```nushell
# Instead of: test -f file.txt && cat file.txt
if ("file.txt" | path exists) { open --raw file.txt }

# Instead of: command && echo "success" || echo "failed"
let result = (do { command } | complete)
if $result.exit_code == 0 { "success" } else { "failed" }
```

## Common Mistakes

```nushell
# WRONG: bun install && bun test
# RIGHT:
bun install; bun test

# WRONG: git add . && git commit -m "msg" && git push
# RIGHT:
git add .; git commit -m "msg"; git push

# WRONG: mkdir -p foo/bar && cp file.txt foo/bar/
# RIGHT:
mkdir foo/bar; cp file.txt foo/bar/
```
