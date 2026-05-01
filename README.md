# Smart Event Director MZ

[![Version](https://img.shields.io/badge/version-v2.0-blue)](https://github.com/yourusername/SmartEventDirectorMZ)
[![RPG Maker MZ](https://img.shields.io/badge/RPG%20Maker-MZ-green)](https://www.rpgmakerweb.com/products/rpg-maker-mz)
[![License](https://img.shields.io/badge/license-MIT-yellow)](LICENSE)

> **Modular cutscene, dialogue, and quest system for RPG Maker MZ**

**Smart Event Director MZ** is a modular RPG Maker MZ plugin for running JSON-driven cutscenes, branching dialogue, choice memory, state changes, safe event movement, quest progression, and relationship tracking.

The core idea:

> Define a scene once, then let the plugin run it safely, remember choices, update state, and recover if something breaks.

---

## Features

- **Modular frame-based scene runner** — Scenes execute step-by-step on every frame with a clean registry pattern
- **JSON-driven scene definitions** — Write scenes in plain JSON; no JavaScript knowledge required
- **40+ step types** — dialogue, narration, choice, movement, camera, audio, pictures, weather, transitions, sub-scenes, checkpoints, preloading, bust portraits, QTE, timeline, achievements, and more
- **Quest system** — Define quests with objectives, track progress, grant rewards, and show toast notifications
- **Relationship system** — Point-based relationship tracking for named characters with a built-in viewer
- **Choice memory and scene history** — Remember player choices across saves; conditionally branch based on past decisions
- **Save/load support** — Quest state, relationship points, choice memory, and scene history persist with regular saves; mid-scene resume is supported
- **Cross-map scene support** — Scenes can span multiple maps without breaking
- **Conditional choices** — Hide or disable individual options based on game state
- **Timed choices** — Choices with countdown timers and configurable timeout behavior
- **Sub-scenes / scene calls** — Call reusable scene subroutines with automatic return
- **Checkpoint / retry system** — Save mid-scene checkpoints and retry from them
- **Localization** — String table support with `\t[key]` interpolation
- **Asset preloading** — Preload images and audio to prevent frame hitches
- **Battle scene support** — Run cutscenes during combat
- **Dialogue history with state snapshots** — Review past dialogue with world state context
- **Character bust / portrait system** — Half-body portraits with emotions, positions, and focus dimming
- **Voice acting per line** — Play voice clips with auto-ducking BGM
- **Screen effects suite** — Camera shake with decay, zoom tweening, effect foundations
- **Auto-start scene triggers** — Start scenes on map enter, proximity, switch changes
- **Achievement system** — Track and display achievements with toasts and viewer
- **Quick-time events (QTE)** — Press, mash, and sequence mini-games
- **Cinematic camera timelines** — Keyframe-based camera animation with easing
- **Parallel scene layers** — Run background and overlay scenes simultaneously
- **Visual scripting editor** — Separate React-based node editor for scenes
- **Debug overlay and hot-reload** — Visual HUD shows scene/step/state/lock/timeout; reload data without restarting the game (dev mode)
- **Dialogue log** — Scrollable text history of all dialogue and narration, accessible with a keybind
- **Text effects** — Per-message typing speed control and auto-advance
- **Resource cleanup** — Automatic snapshot and restore of BGM, BGS, ME, and pictures when scenes end
- **Event safety** — Handles erased events, event page changes, and stuck movement with timeout/recovery
- **CLI validation tools** — Python scripts to validate JSON schemas, check line-count limits, and generate templates

---

## Installation

1. **Copy plugin files**
   - Copy `js/plugins/SmartEventDirectorMZ.js` into your project's `js/plugins/` directory
   - Copy the `js/plugins/SmartEventDirectorMZ/` folder into your project's `js/plugins/` directory

2. **Copy data files**
   - Copy the `data/SmartEventDirector/` folder into your project's `data/` directory

3. **Enable the plugin**
   - Open the Plugin Manager in RPG Maker MZ
   - Add **SmartEventDirectorMZ** to your plugin list
   - Configure parameters as needed (see [Plugin Parameters](#plugin-parameters))

---

## Quick Start

### 1. Create the scene index

Open or create `data/SmartEventDirector/index.json`:

```json
{
  "schema": "SED_INDEX_1",
  "scenes": [
    "my_first_scene.json"
  ],
  "quests": []
}
```

### 2. Create a scene file

Create `data/SmartEventDirector/scenes/my_first_scene.json`:

```json
{
  "schema": "SED_SCENE_1",
  "sceneId": "my_first_scene",
  "title": "My First Scene",
  "canSkip": true,
  "steps": [
    { "type": "lockPlayer" },
    { "type": "dialogue", "speaker": "Mira", "text": "Welcome to Smart Event Director!" },
    { "type": "unlockPlayer" }
  ]
}
```

### 3. Play the scene

In any RPG Maker event, add a **Plugin Command**:

```
PlayScene my_first_scene
```

Enable **Wait for Completion** so the event waits until the scene finishes.

---

## Folder Structure

```
data/SmartEventDirector/
  index.json                 # Master index listing all scenes, quests, and locales
  scenes/
    my_first_scene.json      # Scene definition files
    example_intro.json
    ...
  quests/
    my_first_quest.json      # Quest definition files
    example_tutorial_quest.json
    ...
  lang/
    en.json                  # Locale string tables
    es.json
    ...

js/plugins/
  SmartEventDirectorMZ.js              # Main loader and plugin commands
  SmartEventDirectorMZ/
    core/
      SED_Namespace.js                 # Namespace, version, assert
      SED_Params.js                    # Plugin parameters
      SED_Logger.js                    # Console logging
      SED_Util.js                      # Helpers
    data/
      SED_DataLoader.js                # XHR JSON loading
      SED_SceneRegistry.js             # Scene storage
      SED_SceneValidator.js            # Scene validation
      SED_QuestRegistry.js             # Quest data definitions
    core/
      SED_Locale.js                    # Localization string tables
      SED_ModuleLoader.js              # On-demand module loading utilities
    runtime/
      SED_StepRegistry.js              # Handler registration
      SED_StepQueue.js                 # Step iteration, labels, jumps
      SED_StepContext.js               # Per-scene state
      SED_Locks.js                     # Reference-counted player lock
      SED_Save.js                      # Save/load integration
      SED_Failsafe.js                  # Recovery system
      SED_DebugOverlay.js              # Visual debug HUD
      SED_Runner.js                    # Frame-based scene runner
      SED_QuestState.js                # Quest state tracking
      SED_RelationshipState.js         # Relationship points
      SED_QuestToast.js                # Quest notification overlay
      SED_QuestTracker.js              # Quest tracker HUD
      SED_QuestLog.js                  # Quest log window
      SED_RelationshipViewer.js        # Relationship viewer window
      SED_DialogueLog.js               # Dialogue history log
      SED_TextEffects.js               # Typing speed & auto-advance
      SED_Cleanup.js                   # Audio/picture snapshot & restore
      SED_HotReload.js                 # Data hot-reload (dev)
      SED_AssetLoader.js               # Image/audio preloading
      SED_Checkpoint.js                # Checkpoint save/restore
      SED_History.js                   # Dialogue history with state snapshots
      SED_BattleIntegration.js         # Battle scene hooks
      SED_InputBuffer.js               # Choose-ahead input buffering
      SED_PluginCommands.js            # All plugin commands
    steps/
      SED_Step_LabelJump.js
      SED_Step_Wait.js
      SED_Step_Dialogue.js
      SED_Step_Choice.js
      SED_Step_SwitchVariable.js
      SED_Step_Fade.js
      SED_Step_Movement.js
      SED_Step_Locks.js
      SED_Step_Loop.js
      SED_Step_CommonEvent.js
      SED_Step_Condition.js
      SED_Step_SelfSwitch.js
      SED_Step_Audio.js
      SED_Step_Picture.js
      SED_Step_Camera.js
      SED_Step_Weather.js
      SED_Step_Transition.js
      SED_Step_TitleCard.js
      SED_Step_Quest.js
      SED_Step_Relationship.js
      SED_Step_Script.js
      SED_Step_Comment.js
      SED_Step_MoveRoute.js
      SED_Step_CallScene.js
      SED_Step_Return.js
      SED_Step_Preload.js
      SED_Step_Checkpoint.js
```

All module files stay under the 450-line warning threshold and 525-line hard limit.

---

## Step Types Reference

| Step Type | Description |
|-----------|-------------|
| `dialogue` | Display a message with optional speaker, face, and text effects (`\v[n]`, `\n[n]`, `\p[n]`, `\t[key]` interpolation) |
| `narration` | Display a message without a speaker name |
| `choice` | Show a branching choice menu; options can be conditional, timed, and store results in memory |
| `wait` | Pause scene execution for a number of frames |
| `switch` | Set an RPG Maker game switch ON or OFF |
| `variable` | Set or modify an RPG Maker game variable |
| `fade` / `fadeIn` / `fadeOut` | Screen fade effects |
| `moveOneTile` | Move an event one tile safely with timeout and stuck detection |
| `moveTo` | Move an event to absolute map coordinates with timeout |
| `moveRoute` | Execute a custom move route with command sequences |
| `lockPlayer` | Lock player movement (reference-counted) |
| `unlockPlayer` | Unlock player movement |
| `label` | Named anchor for jumps |
| `jump` | Unconditional jump to a label |
| `loop` | Start a loop block |
| `endLoop` | Return to the matching `loop` start |
| `condition` | Conditional branching with operators (`switchIs`, `variableGte`, `choiceIs`, `questActive`, `relationshipGte`, etc.) |
| `script` | Execute arbitrary JavaScript (`$gameVariables`, `$gameSwitches`, etc.) |
| `comment` | No-op step for annotating scenes |
| `commonEvent` | Call an RPG Maker common event |
| `selfSwitch` | Set a self-switch on a map event |
| `audio` | Play/stop BGM, BGS, SE, or ME with volume/pitch/pan control |
| `picture` | Show, move, erase, or tint pictures |
| `camera` | Screen scroll, focus, reset, shake, flash, or tint |
| `weather` | Change weather type and power |
| `transition` | Screen transition effects (`fade`, `fadeWhite`, `wipe`, `mosaic`, `instant`) |
| `titleCard` | Display a full-screen title card with subtitle, fade in/out, and hold duration |
| `startQuest` | Start a quest by ID |
| `updateObjective` | Mark a quest objective as complete or incomplete |
| `completeQuest` | Complete a quest |
| `failQuest` | Fail a quest |
| `questReward` | Grant gold, items, weapons, armor, and EXP as quest rewards |
| `relationship` | Add or set relationship points for a character |
| `callScene` | Call another scene as a subroutine; returns to caller on completion |
| `return` | Early return from a sub-scene |
| `checkpoint` | Save a retry checkpoint mid-scene |
| `preload` | Preload images and audio assets |

---

## Quest System Guide

### Defining a quest

Create a JSON file in `data/SmartEventDirector/quests/`:

```json
{
  "schema": "SED_QUEST_1",
  "questId": "tutorial_quest",
  "title": "First Steps",
  "description": "Learn the basics of adventuring.",
  "objectives": [
    { "id": "talk_to_mira", "text": "Talk to Mira" },
    { "id": "collect_herbs", "text": "Collect 3 Healing Herbs" },
    { "id": "return_to_mira", "text": "Return to Mira" }
  ]
}
```

Add it to `data/SmartEventDirector/index.json` under the `"quests"` array.

### Using quest steps in scenes

```json
{ "type": "startQuest", "questId": "tutorial_quest" }
{ "type": "updateObjective", "questId": "tutorial_quest", "objective": "talk_to_mira", "completed": true }
{ "type": "completeQuest", "questId": "tutorial_quest" }
{ "type": "questReward", "questId": "tutorial_quest", "gold": 100, "exp": 50, "items": [{ "id": 1, "quantity": 3 }] }
```

### Quest UI

- **Quest tracker HUD** — Shows active quests with objective checkboxes
- **Quest toast notifications** — Animated notifications when quests start, complete, fail, or objectives update
- **Quest log** — Full quest history accessible from the main menu (if enabled)

---

## Plugin Commands

### Scene Commands

| Command | Arguments | Description |
|---------|-----------|-------------|
| `PlayScene` | `sceneId`, `wait` | Start a scene. Enable **Wait for Completion** to pause the event |
| `StopScene` | — | Stop the current scene immediately |
| `SkipScene` | — | Skip the current scene (respects `canSkip: false`) |
| `RecoverScene` | — | Force failsafe recovery (unlock player, fade in, idle) |
| `ToggleDebug` | — | Toggle the debug overlay HUD |
| `RetryCheckpoint` | — | Retry from the most recent checkpoint |
| `RetryCheckpointId` | `id` | Retry from a specific checkpoint by ID |

### Quest Commands

| Command | Arguments | Description |
|---------|-----------|-------------|
| `StartQuest` | `questId` | Start a quest by ID |
| `CompleteQuest` | `questId` | Complete a quest |
| `FailQuest` | `questId` | Fail a quest |
| `UpdateObjective` | `questId`, `objective`, `completed` | Update a specific objective's completion state |
| `OpenQuestLog` | — | Open the quest log window |

### Relationship Commands

| Command | Arguments | Description |
|---------|-----------|-------------|
| `SetRelationship` | `target`, `value` | Set relationship points for a character |
| `AddRelationship` | `target`, `value` | Add relationship points for a character |
| `OpenRelationshipViewer` | — | Open the relationship viewer window |

### Developer Commands

| Command | Arguments | Description |
|---------|-----------|-------------|
| `ReloadData` | — | Hot-reload all scene and quest JSON data (requires **Hot Reload** enabled) |

### Checkpoint Commands

| Command | Arguments | Description |
|---------|-----------|-------------|
| `RetryCheckpoint` | — | Retry from the most recent checkpoint |
| `RetryCheckpointId` | `id` | Retry from a specific checkpoint by ID |

### Menu Integration

When enabled in plugin parameters:
- **Quest Log** appears in the main menu
- **Relationships** appears in the main menu

---

## Plugin Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| Debug Mode | boolean | `true` | Enable console logging |
| Data Index Path | string | `data/SmartEventDirector/index.json` | Path to the scene/quest index |
| Default Scene Timeout | number | `3600` | Max frames before a scene auto-recovers |
| Enable Scene Skip | boolean | `true` | Allow skipping scenes with the skip key |
| Scene Skip Key | number | `27` | Key code for scene skip (legacy) |
| Scene Skip Key Name | string | `cancel` | Input handler name for skip key |
| Enable Debug Overlay | boolean | `false` | Show debug HUD by default |
| Allow Scene Queue | boolean | `false` | Queue scenes when one is already running |
| Default Can Skip | boolean | `true` | Default `canSkip` value for scenes |
| Enable Quest Log | boolean | `true` | Add Quest Log to the main menu |
| Enable Relationship Viewer | boolean | `false` | Add Relationships to the main menu |
| Quest Toast Position | string | `topRight` | Position of quest toast notifications |
| Quest Toast Duration | number | `180` | Frames to display quest toasts |
| Quest Toast Animation | string | `slide` | Toast animation style |
| Quest Toast Sound | string | *(empty)* | Sound effect for quest toasts |
| Dialogue Log Key Name | string | `pageup` | Keybind to open the dialogue log |
| Enable Hot Reload | boolean | `false` | Allow data reload without game restart |
| Locale | string | `en` | Active locale for string tables |
| Checkpoint Switch IDs | string | *(empty)* | Comma-separated switch IDs to snapshot at checkpoints |
| Checkpoint Variable IDs | string | *(empty)* | Comma-separated variable IDs to snapshot at checkpoints |
| History Switch IDs | string | *(empty)* | Comma-separated switch IDs to track in dialogue history |
| History Variable IDs | string | *(empty)* | Comma-separated variable IDs to track in dialogue history |

---

## Developer Tools

The `tools/` directory contains Python scripts for validation and scaffolding:

### `tools/run_all_checks.py`
Runs the full validation suite:
```bash
python tools/run_all_checks.py
```
This runs both line-count checks and JSON validation.

### `tools/check_sed_lines.py`
Verifies all module files stay within the line-count limits.

### `tools/validate_sed_data.py`
Validates all scene and quest JSON files against the SED schema.

### `tools/generate_scene_template.py`
Generate a new scene file from the command line:
```bash
python tools/generate_scene_template.py my_scene --title "My Scene"
```

### `tools/generate_quest_template.py`
Generate a new quest file from the command line:
```bash
python tools/generate_quest_template.py my_quest --title "My Quest"
```

---

## Scene Format Example

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
    {
      "type": "choice",
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

### Condition Example

```json
{
  "type": "condition",
  "operator": "questActive",
  "questId": "tutorial_quest",
  "jumpTrue": "has_quest",
  "jumpFalse": "no_quest"
}
```

### Relationship Condition Example

```json
{
  "type": "condition",
  "operator": "relationshipGte",
  "target": "Mira",
  "value": 5,
  "jumpTrue": "high_affection",
  "jumpFalse": "neutral"
}
```

---

## Architecture

The plugin uses a **registry pattern** for extensibility:

```js
// The runner does NOT use switch/case on step types:
const handler = SED.StepRegistry.get(step.type);
handler.start(step, context, runtime);
handler.update(step, context, runtime);
```

Adding a new step type means creating one new file and registering it — no changes to the runner are required.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Detailed Plan

For the full architecture plan and design decisions, see [docs/SMART_EVENT_DIRECTOR_MZ_PLAN.md](docs/SMART_EVENT_DIRECTOR_MZ_PLAN.md).
