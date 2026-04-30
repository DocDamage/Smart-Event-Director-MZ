#!/usr/bin/env python3
"""Run all Smart Event Director MZ checks (line counts + JSON validation)."""

import subprocess
import sys
from pathlib import Path

TOOLS_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = TOOLS_DIR.parent


def run(script_name: str) -> int:
    script = TOOLS_DIR / script_name
    print(f"\n{'=' * 60}", flush=True)
    print(f"Running {script_name}", flush=True)
    print("=" * 60, flush=True)
    result = subprocess.run([sys.executable, str(script)], cwd=PROJECT_ROOT)
    return result.returncode


def main() -> int:
    line_check_rc = run("check_sed_lines.py")
    json_val_rc = run("validate_sed_data.py")

    print("\n" + "=" * 60)
    print("Combined Results")
    print("=" * 60)
    print(f"check_sed_lines.py   : {'PASS' if line_check_rc == 0 else 'FAIL'}")
    print(f"validate_sed_data.py : {'PASS' if json_val_rc == 0 else 'FAIL'}")

    return 1 if (line_check_rc != 0 or json_val_rc != 0) else 0


if __name__ == "__main__":
    raise SystemExit(main())
