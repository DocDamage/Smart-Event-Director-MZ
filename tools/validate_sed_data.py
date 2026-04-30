#!/usr/bin/env python3
"""Validate Smart Event Director MZ scene and quest JSON files."""

import json
import sys
from pathlib import Path

DATA_DIR = Path("data/SmartEventDirector")
SCENES_DIR = DATA_DIR / "scenes"
QUESTS_DIR = DATA_DIR / "quests"
INDEX_FILE = DATA_DIR / "index.json"

KNOWN_STEP_TYPES = frozenset(
    [
        "dialogue",
        "narration",
        "choice",
        "wait",
        "switch",
        "variable",
        "fade",
        "fadeIn",
        "fadeOut",
        "moveOneTile",
        "moveTo",
        "moveRoute",
        "lockPlayer",
        "unlockPlayer",
        "label",
        "jump",
        "commonEvent",
        "condition",
        "selfSwitch",
        "audio",
        "picture",
        "camera",
        "script",
        "comment",
        "loop",
        "endLoop",
        "titleCard",
        "startQuest",
        "updateObjective",
        "completeQuest",
        "failQuest",
        "questReward",
        "relationship",
        "transition",
        "weather",
    ]
)

errors_total = 0
warnings_total = 0
files_checked = 0


def log(path: Path, status: str, message: str = "") -> None:
    global errors_total, warnings_total, files_checked
    files_checked += 1
    if status == "FAIL":
        errors_total += 1
    elif status == "WARN":
        warnings_total += 1
    if message:
        print(f"{status:<4} {path} — {message}")
    else:
        print(f"{status:<4} {path}")


def load_json(path: Path) -> tuple[bool, dict | None]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        log(path, "FAIL", f"invalid JSON: {exc}")
        return False, None
    except Exception as exc:
        log(path, "FAIL", f"cannot read file: {exc}")
        return False, None
    if not isinstance(data, dict):
        log(path, "FAIL", "root must be a JSON object")
        return False, None
    return True, data


def validate_index() -> tuple[list[str], list[str]]:
    """Return (scene_files, quest_files) from index, or ([], []) on failure."""
    ok, data = load_json(INDEX_FILE)
    if not ok:
        return [], []

    issues = []
    schema = data.get("schema")
    if schema != "SED_INDEX_1":
        issues.append(f"schema should be 'SED_INDEX_1', got {schema!r}")

    scenes = data.get("scenes")
    quests = data.get("quests")
    if not isinstance(scenes, list):
        issues.append("'scenes' must be an array")
        scenes = []
    if not isinstance(quests, list):
        issues.append("'quests' must be an array")
        quests = []

    for name in scenes:
        if not isinstance(name, str):
            issues.append(f"invalid scene filename in index: {name!r}")
            continue
        if not (SCENES_DIR / name).is_file():
            issues.append(f"indexed scene not found on disk: {name}")

    for name in quests:
        if not isinstance(name, str):
            issues.append(f"invalid quest filename in index: {name!r}")
            continue
        if not (QUESTS_DIR / name).is_file():
            issues.append(f"indexed quest not found on disk: {name}")

    if issues:
        log(INDEX_FILE, "FAIL", "; ".join(issues))
    else:
        log(INDEX_FILE, "OK")

    return scenes, quests


def validate_scene(path: Path, known_labels: dict[str, int], scene_ids: dict[str, Path]) -> None:
    ok, data = load_json(path)
    if not ok:
        return

    issues = []
    warnings = []

    schema = data.get("schema")
    if schema != "SED_SCENE_1":
        issues.append(f"schema should be 'SED_SCENE_1', got {schema!r}")

    scene_id = data.get("sceneId")
    if not isinstance(scene_id, str) or not scene_id.strip():
        issues.append("missing or empty 'sceneId'")
    else:
        if scene_id in scene_ids:
            issues.append(f"duplicate sceneId '{scene_id}' (also in {scene_ids[scene_id]})")
        else:
            scene_ids[scene_id] = path

    steps = data.get("steps")
    if not isinstance(steps, list):
        issues.append("'steps' must be an array")
    else:
        label_map: dict[str, int] = {}
        for idx, step in enumerate(steps):
            if not isinstance(step, dict):
                issues.append(f"step {idx} is not an object")
                continue
            step_type = step.get("type")
            if not isinstance(step_type, str):
                issues.append(f"step {idx} missing 'type'")
                continue
            if step_type not in KNOWN_STEP_TYPES:
                warnings.append(f"step {idx} unknown type '{step_type}'")
            if step_type == "label":
                name = step.get("name")
                if isinstance(name, str) and name:
                    if name in label_map:
                        warnings.append(f"duplicate label '{name}' at step {idx}")
                    label_map[name] = idx
                else:
                    issues.append(f"step {idx} label missing 'name'")

        known_labels[path.name] = label_map

        for idx, step in enumerate(steps):
            if not isinstance(step, dict):
                continue
            step_type = step.get("type")
            if step_type == "jump":
                label = step.get("label")
                if not isinstance(label, str) or not label:
                    issues.append(f"step {idx} jump missing 'label'")
                elif label not in label_map:
                    issues.append(f"step {idx} jump to unknown label '{label}'")
                elif label_map[label] <= idx:
                    warnings.append(f"step {idx} backward jump to label '{label}' (step {label_map[label]})")
            elif step_type == "choice":
                options = step.get("options")
                if isinstance(options, list):
                    for opt_idx, opt in enumerate(options):
                        if not isinstance(opt, dict):
                            continue
                        jump = opt.get("jump")
                        if isinstance(jump, str) and jump:
                            if jump not in label_map:
                                issues.append(f"step {idx} option {opt_idx} jump to unknown label '{jump}'")
                            elif label_map[jump] <= idx:
                                warnings.append(
                                    f"step {idx} option {opt_idx} backward jump to label '{jump}' (step {label_map[jump]})"
                                )
            elif step_type == "condition":
                for key in ("jumpTrue", "jumpFalse", "elseJump"):
                    target = step.get(key)
                    if target is None:
                        continue
                    if not isinstance(target, str) or not target:
                        issues.append(f"step {idx} condition missing value for '{key}'")
                    elif target not in label_map:
                        issues.append(f"step {idx} condition '{key}' to unknown label '{target}'")
                    elif label_map[target] <= idx:
                        warnings.append(
                            f"step {idx} condition '{key}' backward jump to label '{target}' (step {label_map[target]})"
                        )
            elif step_type in ("loop", "endLoop"):
                label = step.get("label")
                if label is not None:
                    if not isinstance(label, str) or not label:
                        issues.append(f"step {idx} {step_type} missing value for 'label'")
                    elif label not in label_map:
                        issues.append(f"step {idx} {step_type} to unknown label '{label}'")
                    elif label_map[label] <= idx:
                        warnings.append(
                            f"step {idx} {step_type} backward jump to label '{label}' (step {label_map[label]})"
                        )

    if issues:
        log(path, "FAIL", "; ".join(issues))
    elif warnings:
        log(path, "WARN", "; ".join(warnings))
    else:
        log(path, "OK")


def validate_quest(path: Path, quest_ids: dict[str, Path]) -> None:
    ok, data = load_json(path)
    if not ok:
        return

    issues = []

    schema = data.get("schema")
    if not isinstance(schema, str) or not schema.startswith("SED_QUEST_"):
        issues.append(f"schema should be 'SED_QUEST_*', got {schema!r}")

    quest_id = data.get("questId")
    if not isinstance(quest_id, str) or not quest_id.strip():
        issues.append("missing or empty 'questId'")
    else:
        if quest_id in quest_ids:
            issues.append(f"duplicate questId '{quest_id}' (also in {quest_ids[quest_id]})")
        else:
            quest_ids[quest_id] = path

    title = data.get("title")
    if not isinstance(title, str) or not title.strip():
        issues.append("missing or empty 'title'")

    objectives = data.get("objectives")
    if objectives is not None and not isinstance(objectives, list):
        issues.append("'objectives' must be an array")

    if issues:
        log(path, "FAIL", "; ".join(issues))
    else:
        log(path, "OK")


def main() -> int:
    if not DATA_DIR.is_dir():
        print(f"FAIL data directory not found: {DATA_DIR}")
        return 1

    validate_index()

    scene_files = sorted(SCENES_DIR.glob("*.json")) if SCENES_DIR.is_dir() else []
    quest_files = sorted(QUESTS_DIR.glob("*.json")) if QUESTS_DIR.is_dir() else []

    scene_ids: dict[str, Path] = {}
    known_labels: dict[str, dict[str, int]] = {}

    for path in scene_files:
        validate_scene(path, known_labels, scene_ids)

    quest_ids: dict[str, Path] = {}
    for path in quest_files:
        validate_quest(path, quest_ids)

    print()
    print(f"Summary: {files_checked} files checked, {warnings_total} warnings, {errors_total} errors")

    return 1 if errors_total > 0 else 0


if __name__ == "__main__":
    raise SystemExit(main())
