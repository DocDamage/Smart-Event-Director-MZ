"""Shared utilities for SED Python tooling."""
import json
import sys
from pathlib import Path


def project_root() -> Path:
    """Return the project root directory, derived from this file's location."""
    return Path(__file__).resolve().parent.parent


def resolve_path(relative: str) -> Path:
    """Resolve a path relative to the project root."""
    return project_root() / relative


def load_json(path: Path) -> tuple[bool, dict | None]:
    """Load JSON from path. Returns (ok, data)."""
    try:
        text = path.read_text(encoding="utf-8")
        # Strip BOM if present (RPG Maker MZ sometimes adds it)
        if text.startswith("\ufeff"):
            text = text[1:]
        data = json.loads(text)
    except json.JSONDecodeError as exc:
        print(f"FAIL {path} — invalid JSON: {exc}")
        return False, None
    except Exception as exc:
        print(f"FAIL {path} — cannot read file: {exc}")
        return False, None
    if not isinstance(data, dict):
        print(f"FAIL {path} — root must be a JSON object")
        return False, None
    return True, data


def ensure_dir(path: Path) -> None:
    """Ensure a directory exists, exiting gracefully on permission error."""
    try:
        path.mkdir(parents=True, exist_ok=True)
    except OSError as exc:
        print(f"FAIL cannot create directory {path}: {exc}", file=sys.stderr)
        raise SystemExit(1)


def write_json(path: Path, data: dict) -> None:
    """Write JSON data to path with consistent formatting."""
    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write("\n")
    except OSError as exc:
        print(f"FAIL cannot write {path}: {exc}", file=sys.stderr)
        raise SystemExit(1)
