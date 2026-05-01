#!/usr/bin/env python3
"""Set up SED Example Project in RPG Maker MZ."""

import json
import os
import sys

PROJECT_DIR = r"C:\Users\{}\Documents\RPGMakerMZ\SED_Example".format(os.environ["USERNAME"])
DATA_DIR = os.path.join(PROJECT_DIR, "data")


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def make_event(eid, name, x, y, character, commands, trigger=0, direction=2):
    """trigger: 0=action, 1=player touch, 2=event touch, 3=autorun, 4=parallel"""
    return {
        "id": eid,
        "name": name,
        "note": "",
        "pages": [{
            "conditions": {
                "actorId": 1, "actorValid": False,
                "itemId": 1, "itemValid": False,
                "selfSwitchCh": "A", "selfSwitchValid": False,
                "switch1Id": 1, "switch1Valid": False,
                "switch2Id": 1, "switch2Valid": False,
                "variableId": 1, "variableValid": False,
                "variableValue": 0
            },
            "directionFix": False,
            "image": {
                "characterIndex": 0,
                "characterName": character,
                "direction": direction,
                "pattern": 1,
                "tileId": 0
            },
            "list": commands + [{"code": 0, "indent": 0, "parameters": []}],
            "moveFrequency": 3,
            "moveRoute": {"list": [{"code": 0, "parameters": []}], "repeat": True, "skippable": False, "wait": False},
            "moveSpeed": 3,
            "moveType": 0,
            "priorityType": 1,
            "stepAnime": False,
            "through": False,
            "trigger": trigger,
            "walkAnime": True
        }],
        "x": x,
        "y": y
    }


def make_text_command(text, face="", face_index=0):
    return {"code": 101, "indent": 0, "parameters": [face, face_index, 0, 2]}


def make_text_continuation(text):
    return {"code": 401, "indent": 0, "parameters": [text]}


def make_plugin_command(cmd_string):
    return {"code": 356, "indent": 0, "parameters": [cmd_string]}


def setup_system():
    path = os.path.join(DATA_DIR, "System.json")
    data = load_json(path)
    data["gameTitle"] = "SED Example Project"
    data["partyMembers"] = [1]
    # Add SED plugin
    plugins = data.get("plugins", [])
    # Remove existing SED if present
    plugins = [p for p in plugins if p.get("name") != "SmartEventDirectorMZ"]
    plugins.append({
        "name": "SmartEventDirectorMZ",
        "status": True,
        "description": "v2.0 Smart Event Director MZ - modular cutscene/story runner.",
        "parameters": {}
    })
    data["plugins"] = plugins
    save_json(path, data)
    print("Updated System.json")


def setup_map():
    path = os.path.join(DATA_DIR, "Map001.json")
    data = load_json(path)

    events = []

    # Event 1: Intro Scene (Action Button)
    events.append(make_event(1, "Intro Scene", 8, 6, "Actor1", [
        make_text_command("", 0),
        make_text_continuation("Press Action to play the Intro Scene."),
        make_plugin_command("SED PlayScene example_intro")
    ], trigger=0))

    # Event 2: Choice Demo
    events.append(make_event(2, "Choice Demo", 10, 6, "Actor2", [
        make_text_command("", 0),
        make_text_continuation("Press Action for the Choice Demo."),
        make_plugin_command("SED PlayScene example_choice")
    ], trigger=0))

    # Event 3: Cinematic Demo
    events.append(make_event(3, "Cinematic", 12, 6, "Actor3", [
        make_text_command("", 0),
        make_text_continuation("Press Action for the Cinematic Demo."),
        make_plugin_command("SED PlayScene example_cinematic")
    ], trigger=0))

    # Event 4: QTE Test
    events.append(make_event(4, "QTE Test", 8, 8, "People1", [
        make_text_command("", 0),
        make_text_continuation("Press Action for the QTE Test."),
        make_plugin_command("SED PlayScene example_qte")
    ], trigger=0))

    # Event 5: Quest Giver
    events.append(make_event(5, "Quest Giver", 10, 8, "People2", [
        make_text_command("", 0),
        make_text_continuation("Press Action for the Quest Scene."),
        make_plugin_command("SED PlayScene example_quest_scene")
    ], trigger=0))

    # Event 6: Complete Demo
    events.append(make_event(6, "Complete Demo", 12, 8, "People3", [
        make_text_command("", 0),
        make_text_continuation("Press Action for the Complete Demo."),
        make_plugin_command("SED PlayScene example_complete_demo")
    ], trigger=0))

    # Event 7: Auto-trigger intro on first visit (Autorun)
    events.append(make_event(7, "Auto Intro", 0, 0, "", [
        make_plugin_command("SED PlayScene example_intro"),
        {"code": 123, "indent": 0, "parameters": ["A", 0]}  # Self Switch A = ON
    ], trigger=3))

    # Event 8: Conditional choice demo
    events.append(make_event(8, "Conditional Choice", 14, 6, "People4", [
        make_text_command("", 0),
        make_text_continuation("Press Action for Conditional Choices."),
        make_plugin_command("SED PlayScene example_conditional_choice")
    ], trigger=0))

    # Event 9: Timed choice demo
    events.append(make_event(9, "Timed Choice", 14, 8, "People5", [
        make_text_command("", 0),
        make_text_continuation("Press Action for Timed Choices."),
        make_plugin_command("SED PlayScene example_timed_choice")
    ], trigger=0))

    # Event 10: Sub-scene demo
    events.append(make_event(10, "Sub-scene", 16, 6, "Actor1", [
        make_text_command("", 0),
        make_text_continuation("Press Action for Sub-scene Demo."),
        make_plugin_command("SED PlayScene example_sub_scene")
    ], trigger=0))

    # Event 11: Checkpoint demo
    events.append(make_event(11, "Checkpoint", 16, 8, "Actor2", [
        make_text_command("", 0),
        make_text_continuation("Press Action for Checkpoint Demo."),
        make_plugin_command("SED PlayScene example_checkpoint")
    ], trigger=0))

    # Event 12: Bust & Voice demo
    events.append(make_event(12, "Bust Voice", 8, 10, "Actor3", [
        make_text_command("", 0),
        make_text_continuation("Press Action for Bust & Voice Demo."),
        make_plugin_command("SED PlayScene example_bust_voice")
    ], trigger=0))

    # Event 13: Achievement unlock demo
    events.append(make_event(13, "Achievement", 10, 10, "People1", [
        make_text_command("", 0),
        make_text_continuation("Press Action for Achievement Demo."),
        make_plugin_command("SED PlayScene example_achievement_unlock")
    ], trigger=0))

    # Event 14: Locale demo
    events.append(make_event(14, "Locale", 12, 10, "People2", [
        make_text_command("", 0),
        make_text_continuation("Press Action for Locale Demo."),
        make_plugin_command("SED PlayScene example_locale")
    ], trigger=0))

    # Event 15: Timeline/Camera demo
    events.append(make_event(15, "Timeline", 14, 10, "People3", [
        make_text_command("", 0),
        make_text_continuation("Press Action for Camera Timeline Demo."),
        make_plugin_command("SED PlayScene example_timeline")
    ], trigger=0))

    data["events"] = events
    save_json(path, data)
    print("Updated Map001.json with {} events".format(len(events)))


def create_project_file():
    path = os.path.join(PROJECT_DIR, "Game.rmmzproject")
    with open(path, "w", encoding="utf-8") as f:
        f.write("RPGMZ 1.6.0\n")
    print("Created Game.rmmzproject")


def update_mapinfos():
    path = os.path.join(DATA_DIR, "MapInfos.json")
    data = load_json(path)
    for entry in data:
        if entry and entry.get("id") == 1:
            entry["name"] = "SED Demo Map"
            entry["displayName"] = "SED Demo Map"
    save_json(path, data)
    print("Updated MapInfos.json")


def main():
    print("Setting up SED Example Project...")
    print("Project dir:", PROJECT_DIR)
    setup_system()
    setup_map()
    update_mapinfos()
    create_project_file()
    print("\nDone! Open RPG Maker MZ and load:")
    print("  " + PROJECT_DIR)
    return 0


if __name__ == "__main__":
    sys.exit(main())
