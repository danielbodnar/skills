# ${PKG_BIN} command reference

Spec blocks in workflow-command style. `$ARGUMENTS` marks where user input goes;
`@FILENAME` marks a file argument. Derived from the raw help output below —
consult [references/cli-help.txt](references/cli-help.txt) when a flag is
ambiguous.

---

## Base invocation

**Command:** `${PKG_BIN} $ARGUMENTS`

**Purpose:** ${DESCRIPTION}

**Arguments:**
- `$ARGUMENTS` — flags and positional arguments; see the full option list below.

**Process:**
1. Confirm the binary is current: `${PKG_BIN} --version` (expect ${PKG_VERSION} or newer)
2. Compose flags from the option list below
3. Prefer long-form flags in scripts for readability

**Output:** command results on stdout; non-zero exit code on failure.

**Next Step:** for worked invocations see [examples/basic-usage.md](examples/basic-usage.md).

---

## Full option reference (raw `--help`)

```text
@cli-help.txt
```
