# Smart Event Director MZ

**Smart Event Director MZ** is a modular RPG Maker MZ plugin for running JSON-driven cutscenes, branching dialogue, choice memory, state changes, safe event movement, and quest progression.

The core idea:

> Define a scene once, then let the plugin run it safely, remember choices, update state, and recover if something breaks.

## Current Status: v0.2

All v0.1 and v0.2 features are implemented and verified.

## Version History

### v0.2 — Cinematic & Condition Features

**New step handlers:**
- `commonEvent` — Call RPG Maker common events from scenes
- `condition` — Conditional branching (switchIs, variableIs, variableGte, variableLte, choiceIs, scenePlayed, sceneCompleted, hasItem, goldGte)
- `selfSwitch` — Set self-switches on events
- `audio` — Play/stop BGM, BGS, SE, ME with volume/pitch/pan control
- `picture` — Show, move, erase, tint pictures
- `camera` — Screen scroll, focus, reset, shake, flash, tint

**New runtime features:**
- **Scene queue** — Queue scenes while one is running (optional, off by default)
- **Scene skip** — Skip cutscenes with Escape key (respects `canSkip: false`)
- **Debug overlay** — Visual HUD showing scene/step/state/lock/timeout (toggle with plugin command)
- **Improved save API** — `getPlayed()` / `getCompleted()` for condition evaluation

**New plugin commands:**
- `SkipScene` — programmatic scene skip
- `ToggleDebug` — toggle debug overlay

**New example scenes:**
- `example_cinematic.json` — Audio, camera shake/flash, condition branching, self-switch
- `example_picture_demo.json` — Picture show/move/erase, fade transitions, camera tint
- `test_common_event.json` — Common event execution
- `test_condition_chain.json` — Chained conditional branching

### v0.1 — Core Engine

**Step handlers:**
- `label` / `jump` — Scene flow control
- `wait` — Frame-based delay
- `dialogue` / `narration` — Message window display
- `choice` — Branching choices with memory
- `switch` / `variable` — RPG Maker state changes
- `fadeOut` / `fadeIn` — Screen fades
- `moveOneTile` / `moveTo` — Safe event movement with timeout/stuck detection
- `lockPlayer` / `unlockPlayer` — Reference-counted player lock

**Core systems:**
- Frame-based scene runner with step registry pattern
- XHR-based JSON loading (browser-safe, no `fs` dependency)
- Scene validation (schema, labels, jump targets, step types)
- Save/load integration for choice memory and scene history
- Failsafe recovery (unlock player, fade in, force idle)
- Plugin commands: PlayScene, StopScene, RecoverScene
- Module loader boot sequence

## Architecture

The plugin is split into modular files:

```
js/plugins/
  SmartEventDirectorMZ.js              (254 lines — main loader, plugin commands)

  SmartEventDirectorMZ/
    core/
      SED_Namespace.js                 (27 lines — namespace, version, assert)
      SED_Params.js                    (38 lines — plugin parameters)
      SED_Logger.js                    (46 lines — console logging)
      SED_Util.js                      (60 lines — helpers)

    data/
      SED_DataLoader.js                (67 lines — XHR JSON loading)
      SED_SceneRegistry.js             (48 lines — scene storage)
      SED_SceneValidator.js            (92 lines — scene validation)

    runtime/
      SED_StepRegistry.js              (49 lines — handler registration)
      SED_StepQueue.js                 (56 lines — step iteration, labels, jumps)
      SED_StepContext.js               (39 lines — per-scene state)
      SED_Locks.js                     (43 lines — reference-counted player lock)
      SED_Save.js                      (81 lines — save/load integration)
      SED_Failsafe.js                  (31 lines — recovery)
      SED_DebugOverlay.js              (108 lines — visual debug HUD)
      SED_Runner.js                    (224 lines — frame-based scene runner)

    steps/
      SED_Step_LabelJump.js            (39 lines)
      SED_Step_Wait.js                 (26 lines)
      SED_Step_Dialogue.js             (51 lines)
      SED_Step_Choice.js               (92 lines)
      SED_Step_SwitchVariable.js       (68 lines)
      SED_Step_Fade.js                 (37 lines)
      SED_Step_Movement.js             (132 lines)
      SED_Step_Locks.js                (39 lines)
      SED_Step_CommonEvent.js          (76 lines)   [v0.2]
      SED_Step_Condition.js            (100 lines)  [v0.2]
      SED_Step_SelfSwitch.js           (39 lines)   [v0.2]
      SED_Step_Audio.js                (66 lines)   [v0.2]
      SED_Step_Picture.js              (89 lines)   [v0.2]
      SED_Step_Camera.js               (108 lines)  [v0.2]
```

**30 files total — largest file is 254 lines** (well under the 450-line warning threshold).

## Core Design Principle

```js
// The runner does NOT use switch/case on step types:
const handler = SED.StepRegistry.get(step.type);
handler.start(step, context, runtime);
handler.update(step, context, runtime);
```

This keeps the engine modular. Adding a new step type means creating one new file and registering it — no changes to the runner.

## Usage

### Plugin parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| Debug Mode | boolean | true | Enable console logging |
| Data Index Path | string | data/SmartEventDirector/index.json | Path to scene index |
| Default Scene Timeout | number | 3600 | Max frames before scene times out |
| Enable Scene Skip | boolean | true | Allow Escape key to skip scenes |
| Scene Skip Key | number | 27 | Key code for scene skip |
| Enable Debug Overlay | boolean | false | Show debug HUD |
| Allow Scene Queue | boolean | false | Queue scenes when busy |
| Default Can Skip | boolean | true | Default scene canSkip value |

### Plugin commands

| Command | Args | Description |
|---|---|---|
| PlayScene | sceneId, wait | Start a scene |
| StopScene | — | Stop current scene |
| SkipScene | — | Skip current scene |
| RecoverScene | — | Force failsafe recovery |
| ToggleDebug | — | Toggle debug overlay |

### Scene format

```json
{
  "schema": "SED_SCENE_1",
  "sceneId": "example_intro",
  "title": "Example Intro",
  "canSkip": true,
  "timeoutFrames": 3600,
  "steps": [
    { "type": "lockPlayer" },
    { "type": "fadeOut", "duration": 30, "wait": true },
    { "type": "dialogue", "speaker": "Mira", "text": "Hello." },
    { "type": "choice",
      "key": "response",
      "prompt": "How do you respond?",
      "options": [
        { "text": "Hi.", "jump": "friendly" },
        { "text": "Who are you?", "jump": "suspicious" }
      ],
      "cancel": "none"
    },
    { "type": "label", "name": "friendly" },
    { "type": "dialogue", "text": "You're friendly!" },
    { "type": "jump", "label": "end" },
    { "type": "label", "name": "suspicious" },
    { "type": "dialogue", "text": "You're suspicious." },
    { "type": "label", "name": "end" },
    { "type": "unlockPlayer" }
  ]
}
```

### v0.2 scene features

**Condition branching:**
```json
{
  "type": "condition",
  "operator": "switchIs",
  "switchId": 1,
  "value": true,
  "jumpTrue": "already_done",
  "jumpFalse": "do_it"
}
```

**Audio playback:**
```json
{
  "type": "audio",
  "action": "bgm",
  "name": "Theme1",
  "volume": 90,
  "pitch": 100
}
```

**Camera effects:**
```json
{
  "type": "camera",
  "action": "shake",
  "power": 5,
  "speed": 5,
  "duration": 30,
  "wait": true
}
```

## Installation

1. Copy `js/plugins/SmartEventDirectorMZ.js` and the `js/plugins/SmartEventDirectorMZ/` folder to your RPG Maker MZ project's `js/plugins/` directory
2. Copy the `data/SmartEventDirector/` folder to your project's `data/` directory
3. Enable the plugin in the RPG Maker MZ plugin manager
4. Add scene files to `data/SmartEventDirector/scenes/` and list them in `data/SmartEventDirector/index.json`

## File-size rules

```
Main plugin file: 250-450 lines
Module files:     under 450 lines (warning), under 525 (hard limit)
```

## Development

Use `tools/check_sed_lines.py` to verify line counts:

```
python tools/check_sed_lines.py
```

## v0.3 Roadmap

Features planned for future versions:

- Quest registry and state tracking
- Objective progression
- Quest toast notifications
- Quest tracker window
- Quest reward step
- Relationship point step
- Conditional branching by quest/relationship state
- Common event waiting improvements
- Better move route support

## Detailed plan

See [docs/SMART_EVENT_DIRECTOR_MZ_PLAN.md](docs/SMART_EVENT_DIRECTOR_MZ_PLAN.md) for the full architecture plan.
