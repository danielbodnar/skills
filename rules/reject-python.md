# Rule: Reject Python

**Python is FORBIDDEN in this environment.**

## Rejected Commands

- `python`, `python3`, `python2`
- `pip`, `pip3`, `pip2`, `pipx`
- `conda`, `virtualenv`, `venv`
- `poetry`, `uv` (Python package managers)

## Rejected File Types

- `.py`, `.pyw`, `.pyi`, `.pyc`, `.pyd`
- `requirements.txt`, `setup.py`, `setup.cfg`, `pyproject.toml` (Python-specific)
- `Pipfile`, `Pipfile.lock`

## Required Alternatives

| Instead of | Use |
|------------|-----|
| `python script.py` | `bun run script.ts` |
| `pip install pkg` | `bun add pkg` |
| `.py` files | `.ts` files |
| Python scripts | TypeScript or Nushell scripts |
| `import pandas` | Nushell `polars` plugin or TypeScript |
| `jupyter notebook` | TypeScript with Bun |

## Enforcement

Running any Python command constitutes a task failure. Stop, remove the Python code, and reimplement in TypeScript or Nushell.
