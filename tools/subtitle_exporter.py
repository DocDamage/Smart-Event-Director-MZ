#!/usr/bin/env python3
"""Generate SRT subtitle files from SED scene JSON."""

import json
import sys
import argparse
from pathlib import Path


def format_srt_time(seconds):
    """Convert seconds to SRT time format HH:MM:SS,mmm."""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def extract_dialogue(scene, default_duration=3.0):
    """Extract dialogue steps with estimated timestamps."""
    entries = []
    elapsed = 0.0
    steps = scene.get("steps", [])
    nodes = scene.get("nodes", [])

    # Handle both linear and graph formats
    items = steps if steps else nodes

    for item in items:
        item_type = item.get("type", "")
        if item_type in ("dialogue", "narration"):
            text = item.get("text", "")
            speaker = item.get("speaker", "")
            # Estimate duration: ~0.08s per char + 1s buffer
            duration = max(1.5, len(text) * 0.08 + 1.0)
            entries.append({
                "start": elapsed,
                "end": elapsed + duration,
                "text": text,
                "speaker": speaker,
            })
            elapsed += duration
        elif item_type == "wait":
            elapsed += item.get("frames", 60) / 60.0
        elif item_type in ("fadeIn", "fadeOut"):
            elapsed += item.get("duration", 30) / 60.0
        elif item_type == "choice":
            elapsed += 4.0  # Estimate choice time
        elif item_type in ("qte", "timeline"):
            elapsed += item.get("timeLimit", 180) / 60.0
        else:
            elapsed += default_duration

    return entries


def generate_srt(entries):
    """Generate SRT content from dialogue entries."""
    lines = []
    for i, entry in enumerate(entries, 1):
        start = format_srt_time(entry["start"])
        end = format_srt_time(entry["end"])
        speaker = entry["speaker"]
        text = entry["text"]
        display = f"{speaker}: {text}" if speaker else text
        lines.append(str(i))
        lines.append(f"{start} --> {end}")
        lines.append(display)
        lines.append("")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Generate SRT subtitles from SED scene JSON")
    parser.add_argument("input", help="Path to scene JSON file")
    parser.add_argument("-o", "--output", help="Output SRT path (default: input name with .srt)")
    parser.add_argument("-d", "--duration", type=float, default=3.0, help="Default step duration in seconds")
    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"Error: File not found: {input_path}", file=sys.stderr)
        sys.exit(1)

    with open(input_path, "r", encoding="utf-8") as f:
        scene = json.load(f)

    entries = extract_dialogue(scene, args.duration)
    if not entries:
        print("No dialogue/narration steps found.", file=sys.stderr)
        sys.exit(0)

    srt_content = generate_srt(entries)

    output_path = Path(args.output) if args.output else input_path.with_suffix(".srt")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(srt_content)

    print(f"Generated {output_path} with {len(entries)} subtitle entries.")


if __name__ == "__main__":
    main()
