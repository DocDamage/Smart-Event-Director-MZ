#!/usr/bin/env python3
"""Generate minimal SED JSON templates (scene or quest)."""
import argparse
from pathlib import Path
from sed_common import ensure_dir, write_json, resolve_path


SCENE_TEMPLATE = {
    "schema": "SED_SCENE_1",
    "canSkip": True,
    "steps": [
        {"type": "lockPlayer"},
        {"type": "dialogue", "speaker": "NPC", "text": "Welcome to the scene."},
        {"type": "unlockPlayer"},
    ],
}

QUEST_TEMPLATE = {
    "schema": "SED_QUEST_1",
    "description": "",
    "objectives": [],
}


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate a minimal SED JSON template.")
    parser.add_argument("type", choices=["scene", "quest"], help="Template type")
    parser.add_argument("id", help="Unique identifier")
    parser.add_argument("--title", default=None, help="Title")
    parser.add_argument("--out", default=None, help="Output directory")
    args = parser.parse_args()

    title = args.title or args.id.replace("_", " ").title()

    if args.type == "scene":
        data = {**SCENE_TEMPLATE, "sceneId": args.id, "title": title}
        out_dir = Path(args.out) if args.out else resolve_path("data/SmartEventDirector/scenes")
    else:
        data = {**QUEST_TEMPLATE, "questId": args.id, "title": title}
        out_dir = Path(args.out) if args.out else resolve_path("data/SmartEventDirector/quests")

    ensure_dir(out_dir)
    out_path = out_dir / f"{args.id}.json"
    write_json(out_path, data)
    print(out_path)


if __name__ == "__main__":
    raise SystemExit(main())
