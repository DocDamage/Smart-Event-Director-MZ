from pathlib import Path

ROOT = Path("js/plugins/SmartEventDirectorMZ")
WARN_AT = 450
FAIL_AT = 525

failed = False

for path in sorted(ROOT.rglob("*.js")):
    lines = path.read_text(encoding="utf-8").splitlines()
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
