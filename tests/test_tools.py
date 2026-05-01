import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TOOLS = ROOT / "tools"


def run_tool(*args):
    result = subprocess.run(
        [sys.executable, str(TOOLS / args[0]), *args[1:]],
        capture_output=True,
        text=True,
    )
    return result


def test_check_sed_lines():
    result = run_tool("check_sed_lines.py")
    assert result.returncode in (0, 1), "check_sed_lines should exit 0 or 1"
    assert "lines" in result.stdout.lower() or "FAIL" in result.stdout


def test_validate_sed_data():
    result = run_tool("validate_sed_data.py")
    assert result.returncode in (0, 1)


def test_generate_template_scene():
    result = run_tool("generate_template.py", "scene", "test_smoke_scene")
    assert result.returncode == 0, result.stderr
    out_path = ROOT / "data/SmartEventDirector/scenes/test_smoke_scene.json"
    assert out_path.exists()
    out_path.unlink()


def test_generate_template_quest():
    result = run_tool("generate_template.py", "quest", "test_smoke_quest")
    assert result.returncode == 0, result.stderr
    out_path = ROOT / "data/SmartEventDirector/quests/test_smoke_quest.json"
    assert out_path.exists()
    out_path.unlink()


def test_validate_catches_bad_json():
    bad_file = ROOT / "data/SmartEventDirector/scenes/test_bad.json"
    bad_file.write_text("not json")
    result = run_tool("validate_sed_data.py")
    bad_file.unlink()
    assert "invalid JSON" in result.stdout or result.returncode == 1
