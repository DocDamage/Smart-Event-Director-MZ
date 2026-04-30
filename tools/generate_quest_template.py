#!/usr/bin/env python3
"""Generate a minimal SED quest JSON template."""

import argparse
import json
import os
import sys


def main():
    parser = argparse.ArgumentParser(
        description="Generate a minimal SED quest JSON template."
    )
    parser.add_argument("quest_id", help="Unique quest identifier")
    parser.add_argument("--title", default=None, help="Quest title")
    parser.add_argument(
        "--out",
        default="data/SmartEventDirector/quests/",
        help="Output directory",
    )
    args = parser.parse_args()

    quest_id = args.quest_id
    title = args.title or quest_id.replace("_", " ").title()

    data = {
        "schema": "SED_QUEST_1",
        "questId": quest_id,
        "title": title,
        "description": f"A new quest: {title}.",
        "objectives": [
            {"id": "talk_to_npc", "text": "Talk to the quest giver"},
            {"id": "collect_items", "text": "Collect required items"},
            {"id": "complete_task", "text": "Return and complete the quest"},
        ],
    }

    out_dir = args.out
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, f"{quest_id}.json")

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(out_path)


if __name__ == "__main__":
    main()
