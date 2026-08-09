# ${PKG_BIN} — parameterized examples

Substitute `$ARGUMENTS` with the user's input and `@FILENAME` with a real path
before running. Verify destructive flags against
[references/man.txt](../references/man.txt) first.

---

## Example 1 — default invocation

**Command:** `${PKG_BIN} $ARGUMENTS`

**Purpose:** run ${PKG_BIN} with user-supplied arguments.

**Process:**
1. `${PKG_BIN} --version` — confirm availability (installed via ${MANAGER})
2. `${PKG_BIN} $ARGUMENTS`
3. Inspect the exit code; on failure, re-run with `--help` and compare flags

**Output:** results on stdout.

---

## Example 2 — operate on a file

**Command:** `${PKG_BIN} $ARGUMENTS @FILENAME`

**Purpose:** apply ${PKG_BIN} to a specific file the user names.

**Process:**
1. Confirm `@FILENAME` exists before invoking
2. `${PKG_BIN} $ARGUMENTS @FILENAME`

**Output:** file-scoped results; non-zero exit code if `@FILENAME` is missing.

**Next Step:** chain into scripts using the patterns in [snippets/](../snippets/).
