#!/usr/bin/env python3
"""Generate ASCII flowcharts and Graphviz DOT files from SED scene JSON files."""
import argparse
import subprocess
import sys
from pathlib import Path
from sed_common import load_json


def _label(step, ascii_fmt=True):
    t = step.get("type", "unknown")
    s = step.get
    if t == "dialogue":
        sp, tx = s("speaker"), s("text", "")
        return f'dialogue: {sp}: "{tx}"' if (ascii_fmt and sp) else (f"{sp}\\n{tx}" if sp else tx)
    if t == "narration":
        return f'narration: "{s("text", "")}"' if ascii_fmt else s("text", "")
    if t == "choice":
        return f'choice: "{s("prompt", "")}"' if ascii_fmt else s("prompt", "")
    if t == "label":
        return f'label: "{s("name", "")}"' if ascii_fmt else s("name", "")
    if t == "jump":
        return "jump" if ascii_fmt else f"jump\\n{s('label', '')}"
    if t == "condition":
        return f'condition: {s("operator", "")}' if ascii_fmt else s("operator", "")
    if t == "audio":
        a, n = s("action", ""), s("name", "")
        return f'audio: {a} "{n}"' if (ascii_fmt and n) else (f"{a}\\n{n}" if n else a)
    if t == "camera":
        return f'camera: {s("action", "")}' if ascii_fmt else s("action", "")
    if t == "weather":
        return f'weather: {s("action", "")}' if ascii_fmt else s("action", "")
    if t == "moveRoute":
        return "moveRoute"
    if t == "startQuest":
        return f'quest: {s("questId", "")}' if ascii_fmt else s("questId", "")
    if t == "titleCard":
        return f'titleCard: "{s("title", "")}"' if ascii_fmt else s("title", "")
    if t == "transition":
        return f'transition: {s("effect", "")}' if ascii_fmt else s("effect", "")
    if t == "relationship":
        return f'relationship: {s("target", "")}' if ascii_fmt else f"{s('target', '')}\\n{s('action', '')}"
    return t


def _color(step):
    colors = {
        "dialogue": "lightblue", "narration": "lightblue", "choice": "lightgreen",
        "jump": "lightyellow", "label": "lightyellow", "condition": "lightsalmon",
        "camera": "lightcyan", "audio": "lightcyan", "weather": "lightcyan",
        "fadeOut": "lightcyan", "fadeIn": "lightcyan", "wait": "lightcyan",
        "titleCard": "lightcyan", "transition": "lightcyan", "startQuest": "lightpink",
        "moveRoute": "lightgray", "lockPlayer": "lightgray", "unlockPlayer": "lightgray"
    }
    return colors.get(step.get("type", ""), "white")


def _label_map(steps):
    return {step["name"]: i for i, step in enumerate(steps) if step.get("type") == "label"}


def _esc(s):
    return s.replace("\\", "\\\\").replace('"', '\\"')


def generate_ascii(steps):
    labels = _label_map(steps)
    n = len(steps)
    lines = []
    for i, step in enumerate(steps):
        line = f"[{i}] {_label(step)}"
        t = step.get("type")
        if t == "jump":
            target = labels.get(step.get("label"))
            if target is not None:
                line += f" ---> [{target}] {_label(steps[target])}"
        lines.append(line)
        branches = []
        if t == "choice":
            for opt in step.get("options", []):
                target = labels.get(opt.get("jump"))
                if target is not None:
                    branches.append(f'---> [{target}] {_label(steps[target])} ("{opt.get("text", "")}")')
            cancel = step.get("cancel")
            if cancel and cancel != "none":
                target = labels.get(cancel)
                if target is not None:
                    branches.append(f"---> [{target}] {_label(steps[target])} (cancel)")
        elif t == "condition":
            for key, name in (("jumpTrue", "true"), ("jumpFalse", "false")):
                target = labels.get(step.get(key))
                if target is not None:
                    branches.append(f"---> [{target}] {_label(steps[target])} ({name})")
        for b in branches:
            lines.append(f" |{b}")
        if i < n - 1:
            lines.append(" |")
    return "\n".join(lines)


def generate_dot(steps):
    labels = _label_map(steps)
    lines = ["digraph scene {", "  rankdir=TB;"]
    n = len(steps)
    for i, step in enumerate(steps):
        lbl = _esc(_label(step, ascii_fmt=False))
        lines.append(f'  node{i} [label="{lbl}", shape=box, fillcolor={_color(step)}, style=filled];')
    for i, step in enumerate(steps):
        if i + 1 < n:
            lines.append(f"  node{i} -> node{i + 1};")
        t = step.get("type")
        if t == "jump":
            target = labels.get(step.get("label"))
            if target is not None:
                lines.append(f"  node{i} -> node{target} [style=dashed];")
        elif t == "choice":
            for opt in step.get("options", []):
                target = labels.get(opt.get("jump"))
                if target is not None:
                    lines.append(f'  node{i} -> node{target} [label="{_esc(opt.get("text", ""))}"];')
            cancel = step.get("cancel")
            if cancel and cancel != "none":
                target = labels.get(cancel)
                if target is not None:
                    lines.append(f'  node{i} -> node{target} [label="cancel"];')
        elif t == "condition":
            for k, nm in (("jumpTrue", "true"), ("jumpFalse", "false")):
                target = labels.get(step.get(k))
                if target is not None:
                    lines.append(f'  node{i} -> node{target} [label="{nm}"];')
    lines.append("}")
    return "\n".join(lines)


def main():
    p = argparse.ArgumentParser(description="Generate flowcharts from SED scene JSON files.")
    p.add_argument("input_file", help="Path to the scene JSON file")
    p.add_argument("--dot", action="store_true", help="Output Graphviz DOT format")
    p.add_argument("--png", metavar="OUTPUT", help="Generate PNG using Graphviz dot command")
    a = p.parse_args()
    path = Path(a.input_file)
    if not path.exists():
        print(f"Error: File not found: {a.input_file}", file=sys.stderr)
        sys.exit(1)

    ok, data = load_json(path)
    if not ok:
        sys.exit(1)

    steps = data.get("steps", [])
    if not isinstance(steps, list):
        print("Error: 'steps' must be an array.", file=sys.stderr)
        sys.exit(1)
    if not steps:
        print("Warning: No steps found in scene file.", file=sys.stderr)

    if a.png:
        try:
            subprocess.run(
                ["dot", "-Tpng", "-o", a.png],
                input=generate_dot(steps),
                text=True,
                capture_output=True,
                check=True,
            )
        except FileNotFoundError:
            print(
                "Error: Graphviz 'dot' command not found. Install the system package "
                "(https://graphviz.org/download/) or ensure it is on PATH.",
                file=sys.stderr,
            )
            sys.exit(1)
        except subprocess.CalledProcessError as e:
            print(f"Error: Graphviz failed: {e.stderr}", file=sys.stderr)
            sys.exit(1)
        print(f"PNG saved to: {a.png}")
    elif a.dot:
        print(generate_dot(steps))
    else:
        print(generate_ascii(steps))


if __name__ == "__main__":
    main()
