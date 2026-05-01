#!/usr/bin/env python3
"""Check line counts of SED plugin JS files.

For full validation (including JSON data), run: python tools/run_all_checks.py
"""

from pathlib import Path
from sed_common import resolve_path

ROOT = resolve_path("js/plugins/SmartEventDirectorMZ")
WARN_AT = 450
FAIL_AT = 525

failed = False

if not ROOT.is_dir():
    print(f"FAIL plugin directory not found: {ROOT}")
    raise SystemExit(1)

for path in sorted(ROOT.rglob("*.js")):
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except Exception as exc:
        print(f"FAIL cannot read {path}: {exc}")
        failed = True
        continue
    count = len(lines)

    if count >= FAIL_AT:
        print(f"FAIL {count:4} lines  {path}")
        failed = True
    elif count >= WARN_AT:
        print(f"WARN {count:4} lines  {path}")
    else:
        print(f"OK   {count:4} lines  {path}")

if failed:
    raise SystemExit(1)
