---
name: format-check
description: Run formatting and linting checks on the current project
---

Run a full code quality check on this project using Biome and OxLint. Report all issues found without modifying any files.

## Step 1: Run OxLint

Run OxLint to check for lint errors across all TypeScript and JavaScript files:

```bash
bunx oxlint
```

If OxLint reports errors, list each file and the rule violated. Suggest fixes for each issue.

## Step 2: Run Biome Check

Run Biome in check mode (no auto-fix) to identify formatting and lint issues:

```bash
bunx @biomejs/biome check .
```

If Biome reports issues, list the files with formatting problems and the specific rules triggered.

## Step 3: Summarize Results

After running both tools, provide a summary:

- Total number of files checked
- Number of OxLint errors and warnings
- Number of Biome formatting issues and lint errors
- List of files that need attention, grouped by tool

If there are no issues, confirm the project passes all quality checks.

## Auto-Fix Mode

If the user requests fixes, run the tools with auto-fix enabled:

```bash
bunx oxlint --fix
```

```bash
bunx @biomejs/biome check --write .
```

Report what was fixed and whether any issues remain that require manual intervention.
