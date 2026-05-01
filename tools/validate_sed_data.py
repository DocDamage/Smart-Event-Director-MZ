#!/usr/bin/env python3
"""Validate Smart Event Director MZ scene, quest, and achievement JSON files."""

import sys
from pathlib import Path
from sed_common import resolve_path, load_json

DATA_DIR = resolve_path("data/SmartEventDirector")
SCENES_DIR = DATA_DIR / "scenes"
QUESTS_DIR = DATA_DIR / "quests"
ACHIEVEMENTS_DIR = DATA_DIR / "achievements"
INDEX_FILE = DATA_DIR / "index.json"

KNOWN_STEP_TYPES = frozenset(
    [
        "dialogue",
        "narration",
        "choice",
        "wait",
        "switch",
        "variable",
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
        "unlockAchievement",
        "transition",
        "weather",
        "callScene",
        "return",
        "preload",
        "checkpoint",
        "bust",
        "qte",
        "timeline",
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


def validate_index() -> tuple[list[str], list[str], list[str]]:
    """Return (scene_files, quest_files, achievement_files) from index, or ([], [], []) on failure."""
    ok, data = load_json(INDEX_FILE)
    if not ok:
        return [], [], []

    issues = []
    schema = data.get("schema")
    if schema != "SED_INDEX_1":
        issues.append(f"schema should be 'SED_INDEX_1', got {schema!r}")

    scenes = data.get("scenes")
    quests = data.get("quests")
    achievements = data.get("achievements")
    if not isinstance(scenes, list):
        issues.append("'scenes' must be an array")
        scenes = []
    if not isinstance(quests, list):
        issues.append("'quests' must be an array")
        quests = []
    if achievements is not None and not isinstance(achievements, list):
        issues.append("'achievements' must be an array")
        achievements = []
    if achievements is None:
        achievements = []

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

    for name in achievements:
        if not isinstance(name, str):
            issues.append(f"invalid achievement filename in index: {name!r}")
            continue
        if not (ACHIEVEMENTS_DIR / name).is_file():
            issues.append(f"indexed achievement not found on disk: {name}")

    if issues:
        log(INDEX_FILE, "FAIL", "; ".join(issues))
    else:
        log(INDEX_FILE, "OK")

    return scenes, quests, achievements


def validate_scene(path: Path, known_labels: dict[str, int], scene_ids: dict[str, Path], known_quests: set[str], known_achievements: set[str]) -> None:
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
            # Cross-reference checks
            if step_type in ("startQuest", "updateObjective", "completeQuest", "failQuest", "questReward"):
                qid = step.get("questId")
                if qid and known_quests and qid not in known_quests:
                    warnings.append(f"step {idx} references unknown questId '{qid}'")
            if step_type == "unlockAchievement":
                aid = step.get("achievementId")
                if aid and known_achievements and aid not in known_achievements:
                    warnings.append(f"step {idx} references unknown achievementId '{aid}'")
            if step_type == "callScene":
                cid = step.get("sceneId")
                if cid and scene_ids and cid not in scene_ids:
                    warnings.append(f"step {idx} references unknown sceneId '{cid}'")

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


def validate_achievement(path: Path, achievement_ids: dict[str, Path]) -> None:
    ok, data = load_json(path)
    if not ok:
        return

    issues = []

    schema = data.get("schema")
    if not isinstance(schema, str) or not schema.startswith("SED_ACHIEVEMENT_"):
        issues.append(f"schema should be 'SED_ACHIEVEMENT_*', got {schema!r}")

    achievement_id = data.get("achievementId")
    if not isinstance(achievement_id, str) or not achievement_id.strip():
        issues.append("missing or empty 'achievementId'")
    else:
        if achievement_id in achievement_ids:
            issues.append(f"duplicate achievementId '{achievement_id}' (also in {achievement_ids[achievement_id]})")
        else:
            achievement_ids[achievement_id] = path

    title = data.get("title")
    if not isinstance(title, str) or not title.strip():
        issues.append("missing or empty 'title'")

    if issues:
        log(path, "FAIL", "; ".join(issues))
    else:
        log(path, "OK")


def main() -> int:
    if not DATA_DIR.is_dir():
        print(f"FAIL data directory not found: {DATA_DIR}")
        return 1

    scene_files, quest_files, achievement_files = validate_index()

    scene_ids: dict[str, Path] = {}
    known_labels: dict[str, dict[str, int]] = {}

    # First pass: collect all IDs for cross-referencing
    quest_ids: dict[str, Path] = {}
    for path in sorted(QUESTS_DIR.glob("*.json")) if QUESTS_DIR.is_dir() else []:
        ok, data = load_json(path)
        if ok:
            qid = data.get("questId")
            if isinstance(qid, str) and qid:
                quest_ids[qid] = path

    achievement_ids: dict[str, Path] = {}
    for path in sorted(ACHIEVEMENTS_DIR.glob("*.json")) if ACHIEVEMENTS_DIR.is_dir() else []:
        ok, data = load_json(path)
        if ok:
            aid = data.get("achievementId")
            if isinstance(aid, str) and aid:
                achievement_ids[aid] = path

    for path in sorted(SCENES_DIR.glob("*.json")) if SCENES_DIR.is_dir() else []:
        validate_scene(path, known_labels, scene_ids, set(quest_ids), set(achievement_ids))

    # Validate quests and achievements, detecting duplicates across files
    quest_ids_validate: dict[str, Path] = {}
    for path in sorted(QUESTS_DIR.glob("*.json")) if QUESTS_DIR.is_dir() else []:
        validate_quest(path, quest_ids_validate)

    achievement_ids_validate: dict[str, Path] = {}
    for path in sorted(ACHIEVEMENTS_DIR.glob("*.json")) if ACHIEVEMENTS_DIR.is_dir() else []:
        validate_achievement(path, achievement_ids_validate)

    print()
    print(f"Summary: {files_checked} files checked, {warnings_total} warnings, {errors_total} errors")

    return 1 if errors_total > 0 else 0


if __name__ == "__main__":
    raise SystemExit(main())
