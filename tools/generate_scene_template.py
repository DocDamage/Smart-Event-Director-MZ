#!/usr/bin/env python3
"""Generate a minimal SED scene JSON template."""

import argparse
import json
import os
import sys


def main():
    parser = argparse.ArgumentParser(
        description="Generate a minimal SED scene JSON template."
    )
    parser.add_argument("scene_id", help="Unique scene identifier")
    parser.add_argument("--title", default=None, help="Scene title")
    parser.add_argument(
        "--out",
        default="data/SmartEventDirector/scenes/",
        help="Output directory",
    )
    args = parser.parse_args()

    scene_id = args.scene_id
    title = args.title or scene_id.replace("_", " ").title()

    data = {
        "schema": "SED_SCENE_1",
        "sceneId": scene_id,
        "title": title,
        "canSkip": True,
        "steps": [
            {"type": "lockPlayer"},
            {
                "type": "dialogue",
                "speaker": "NPC",
                "text": "Welcome to the scene.",
            },
            {
                "type": "choice",
                "key": "example_choice",
                "prompt": "What will you do?",
                "options": [
                    {"text": "Agree", "jump": "agree_path"},
                    {"text": "Refuse", "jump": "refuse_path"},
                ],
                "cancel": "none",
            },
            {"type": "label", "name": "agree_path"},
            {"type": "dialogue", "speaker": "NPC", "text": "You agreed."},
            {"type": "jump", "label": "end"},
            {"type": "label", "name": "refuse_path"},
            {"type": "dialogue", "speaker": "NPC", "text": "You refused."},
            {"type": "label", "name": "end"},
            {"type": "unlockPlayer"},
        ],
    }

    out_dir = args.out
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, f"{scene_id}.json")

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(out_path)


if __name__ == "__main__":
    main()
