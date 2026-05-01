#!/usr/bin/env python3
"""SED Stress Test — generate and validate many random scenes."""

import json
import random
import string
import time
import sys
import os

STEP_TYPES = [
    "dialogue", "narration", "choice", "wait", "switch", "variable",
    "fadeOut", "fadeIn", "picture", "camera", "audio", "jump", "label",
    "condition", "moveOneTile", "moveTo", "moveRoute", "lockPlayer",
    "unlockPlayer", "startQuest", "relationship", "commonEvent",
    "selfSwitch", "callScene", "return", "checkpoint", "preload",
    "script", "comment", "loop", "endLoop", "titleCard", "transition",
    "weather", "bust", "qte", "timeline", "unlockAchievement"
]

DIALOGUE_LINES = [
    "Something is wrong with this place.",
    "I feel it too.",
    "You're imagining things.",
    "Then you understand.",
    "I wish I was.",
    "We need to keep moving.",
    "Wait—did you hear that?",
    "It's too quiet.",
]

SPEAKERS = ["Mira", "Kael", "Lira", "Unknown", "Narrator"]


def random_id(length=8):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))


def generate_scene(scene_id, step_count=20):
    steps = []
    labels = []

    for i in range(step_count):
        step_type = random.choice(STEP_TYPES)
        step = {"type": step_type}

        if step_type in ("dialogue", "narration"):
            step["text"] = random.choice(DIALOGUE_LINES)
            if step_type == "dialogue":
                step["speaker"] = random.choice(SPEAKERS)

        elif step_type == "choice":
            step["key"] = f"choice_{random_id(4)}"
            step["prompt"] = "What do you do?"
            options = []
            for _ in range(random.randint(2, 4)):
                opt = {"text": random.choice(DIALOGUE_LINES)[:20]}
                if labels and random.random() > 0.3:
                    opt["jump"] = random.choice(labels)
                options.append(opt)
            step["options"] = options

        elif step_type == "jump":
            if labels and random.random() > 0.2:
                step["label"] = random.choice(labels)
            else:
                step["label"] = f"label_{random_id(4)}"

        elif step_type == "label":
            name = f"label_{random_id(4)}"
            step["name"] = name
            labels.append(name)

        elif step_type == "wait":
            step["frames"] = random.randint(15, 120)

        elif step_type in ("fadeOut", "fadeIn"):
            step["duration"] = random.randint(15, 60)
            step["wait"] = random.choice([True, False])

        elif step_type == "switch":
            step["id"] = random.randint(1, 999)
            step["value"] = random.choice([True, False])

        elif step_type == "variable":
            step["id"] = random.randint(1, 999)
            step["operation"] = random.choice(["set", "add", "sub"])
            step["value"] = random.randint(0, 100)

        elif step_type in ("moveOneTile", "moveTo"):
            step["eventId"] = random.randint(-1, 20)
            if step_type == "moveTo":
                step["x"] = random.randint(0, 30)
                step["y"] = random.randint(0, 30)
            step["wait"] = random.choice([True, False])

        elif step_type == "camera":
            step["action"] = random.choice(["shake", "flash", "scroll", "focus"])
            step["duration"] = random.randint(15, 120)
            step["wait"] = random.choice([True, False])

        elif step_type == "audio":
            step["action"] = random.choice(["bgm", "bgs", "se", "stopBgm"])
            step["name"] = random.choice(["Battle1", "Town1", "Decision1", ""])

        elif step_type == "picture":
            step["action"] = random.choice(["show", "move", "erase"])
            step["id"] = random.randint(1, 10)

        elif step_type == "startQuest":
            step["questId"] = f"quest_{random_id(4)}"

        elif step_type == "relationship":
            step["target"] = random.choice(SPEAKERS)
            step["operation"] = random.choice(["add", "set"])
            step["value"] = random.randint(-10, 10)

        elif step_type == "callScene":
            step["sceneId"] = f"scene_{random_id(4)}"

        elif step_type == "checkpoint":
            step["id"] = f"cp_{random_id(4)}"

        elif step_type == "script":
            step["code"] = "// test script"
            step["wait"] = random.choice([True, False])

        elif step_type == "comment":
            step["text"] = "Test comment"

        elif step_type in ("loop", "endLoop"):
            if labels:
                step["label"] = random.choice(labels)
            else:
                step["label"] = f"loop_{random_id(4)}"

        steps.append(step)

    return {
        "schema": "SED_SCENE_1",
        "sceneId": scene_id,
        "title": f"Stress Test Scene {scene_id}",
        "canSkip": True,
        "timeoutFrames": 3600,
        "steps": steps
    }


def validate_scene(scene):
    """Basic validation matching SED_SceneValidator logic."""
    errors = []
    if scene.get("schema") not in ("SED_SCENE_1", "SED_SCENE_2"):
        errors.append("Invalid schema")
    if not scene.get("sceneId"):
        errors.append("Missing sceneId")
    if not isinstance(scene.get("steps"), list):
        errors.append("Missing steps array")
        return errors

    labels = {}
    for i, step in enumerate(scene["steps"]):
        if not isinstance(step, dict):
            errors.append(f"steps[{i}] not an object")
            continue
        if not step.get("type"):
            errors.append(f"steps[{i}] missing type")
            continue
        if step["type"] == "label" and step.get("name"):
            if step["name"] in labels:
                errors.append(f"Duplicate label: {step['name']}")
            labels[step["name"]] = i
        if step["type"] == "jump" and step.get("label") and step["label"] not in labels:
            errors.append(f"Jump to missing label: {step['label']}")

    # Circular jump detection
    jump_graph = {}
    for i, step in enumerate(scene["steps"]):
        if step.get("type") == "jump" and step.get("label") in labels:
            jump_graph[i] = labels[step["label"]]

    visited = {}
    stack = []
    def detect_cycle(index):
        if visited.get(index) == "visiting":
            cycle_start = stack.index(index)
            cycle_nodes = stack[cycle_start:] + [index]
            cycle_labels = []
            for idx in cycle_nodes:
                s = scene["steps"][idx]
                if s["type"] == "jump":
                    cycle_labels.append(f"jump '{s['label']}'")
                elif s["type"] == "label":
                    cycle_labels.append(f"label '{s['name']}'")
                else:
                    cycle_labels.append(f"step {idx}")
            errors.append("Circular jump detected: " + " → ".join(cycle_labels))
            return
        if visited.get(index) == "done":
            return
        visited[index] = "visiting"
        stack.append(index)
        if index in jump_graph:
            detect_cycle(jump_graph[index])
        stack.pop()
        visited[index] = "done"

    for i, step in enumerate(scene["steps"]):
        if step.get("type") == "jump" and i not in visited:
            detect_cycle(i)

    return errors


def main():
    count = int(sys.argv[1]) if len(sys.argv) > 1 else 50
    step_count = int(sys.argv[2]) if len(sys.argv) > 2 else 20

    print(f"SED Stress Test: generating {count} scenes with ~{step_count} steps each...")
    start = time.time()

    total_errors = 0
    for i in range(count):
        scene_id = f"stress_{i:04d}"
        scene = generate_scene(scene_id, step_count)
        errors = validate_scene(scene)
        if errors:
            total_errors += len(errors)
            print(f"  {scene_id}: {len(errors)} errors")
            for err in errors[:3]:
                print(f"    - {err}")

    elapsed = time.time() - start
    print(f"\nDone in {elapsed:.3f}s")
    print(f"Scenes: {count}, Total validation errors: {total_errors}")
    print(f"Avg time per scene: {elapsed/count*1000:.2f}ms")

    # Optionally write a few to disk for inspection
    sample_dir = "data/SmartEventDirector/scenes/stress"
    os.makedirs(sample_dir, exist_ok=True)
    for i in range(min(5, count)):
        scene_id = f"stress_{i:04d}"
        scene = generate_scene(scene_id, step_count)
        with open(f"{sample_dir}/{scene_id}.json", "w") as f:
            json.dump(scene, f, indent=2)
    print(f"Wrote 5 sample scenes to {sample_dir}/")

    return 0 if total_errors == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
