# Smart Event Director MZ

**Smart Event Director MZ** is a modular RPG Maker MZ plugin project for running JSON-driven cutscenes, branching dialogue, choice memory, state changes, safe event movement, and future quest progression.

The core idea is simple:

> Define a scene once, then let the plugin run it safely, remember choices, update state, and recover if something breaks.

This repository is currently in the planning / architecture stage. The next milestone is a clean **v0.1 frame-based scene runner**.

## Detailed plan

Read the full build plan here:

[docs/SMART_EVENT_DIRECTOR_MZ_PLAN.md](docs/SMART_EVENT_DIRECTOR_MZ_PLAN.md)

## What this plugin should become

Smart Event Director MZ should coordinate RPG Maker's existing event system instead of replacing it. It should make complex story scenes easier to write, debug, and maintain by moving scene flow into structured data and modular step handlers.

Target use cases:

- Cutscenes
- Branching dialogue
- Choice memory
- Scene labels and jumps
- Switch and variable changes
- Safe player/event movement
- Screen fades and cinematic timing
- Future quest/objective progression
- Future relationship and route logic

## v0.1 scope

The first working version should stay small and focused:

```text
Scene loading
Scene registry
Scene validation
Scene runner
Step registry
Plugin command: Play Scene
Plugin command: Stop Scene
Plugin command: Recover Scene
Player lock
Dialogue step
Choice step
Wait step
Switch step
Variable step
Fade step
Basic movement step
Label / jump step
Save/load support for scene memory
Failsafe recovery
```

Do not build the quest system, relationship system, visual editor, debug overlay, or advanced camera first. The step engine comes first.

## Core architecture rule

The runner should not know what a dialogue box is. It should not know what a choice is. It should not know what movement is.

The runner should only know how to:

1. Load a scene.
2. Read the next step.
3. Find the correct handler for that step type.
4. Start the handler.
5. Update the handler every frame until it reports completion.
6. Move to the next step, jump to a label, stop, or recover.

Bad direction:

```js
switch (step.type) {
  case "dialogue":
    // dialogue logic here
    break;
  case "choice":
    // choice logic here
    break;
  case "moveTo":
    // movement logic here
    break;
}
```

Good direction:

```js
const handler = SED.StepRegistry.get(step.type);
handler.start(step, context, runtime);
handler.update(step, context, runtime);
```

This keeps the plugin modular and prevents the main runner from becoming a 2,000-line file.

## Planned folder structure

```text
js/plugins/
  SmartEventDirectorMZ.js

js/plugins/SmartEventDirectorMZ/
  core/
    SED_Namespace.js
    SED_Params.js
    SED_Logger.js
    SED_Util.js

  data/
    SED_DataLoader.js
    SED_SceneRegistry.js
    SED_SceneValidator.js

  runtime/
    SED_StepRegistry.js
    SED_StepQueue.js
    SED_StepContext.js
    SED_Runner.js
    SED_Locks.js
    SED_Save.js
    SED_Failsafe.js

  steps/
    SED_Step_LabelJump.js
    SED_Step_Wait.js
    SED_Step_Dialogue.js
    SED_Step_Choice.js
    SED_Step_SwitchVariable.js
    SED_Step_Fade.js
    SED_Step_Movement.js

data/
  SmartEventDirector/
    index.json
    scenes/
      example_intro.json
      example_choice.json
```

## File-size rules

To keep the project easy to code, review, and maintain:

```text
Main plugin file: 250-450 lines
Core files: 80-250 lines each
Runtime files: 150-450 lines each
Step files: 80-300 lines each
Validator: 250-450 lines
Hard warning: split files before they pass 500-ish lines
```

One file, one job. Do not let helper files become junk drawers.

## Scene JSON example

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
    { "type": "wait", "frames": 15 },
    { "type": "fadeIn", "duration": 30, "wait": true },
    {
      "type": "dialogue",
      "speaker": "Mira",
      "text": "Something is wrong with this place."
    },
    {
      "type": "choice",
      "key": "mira_intro_response",
      "prompt": "How do you respond?",
      "options": [
        { "text": "I feel it too.", "jump": "trust" },
        { "text": "You're imagining things.", "jump": "doubt" }
      ],
      "cancel": "none"
    },
    { "type": "label", "name": "trust" },
    { "type": "switch", "id": 21, "value": true },
    { "type": "dialogue", "speaker": "Mira", "text": "Then you understand." },
    { "type": "jump", "label": "end" },
    { "type": "label", "name": "doubt" },
    { "type": "variable", "id": 12, "operation": "add", "value": 1 },
    { "type": "dialogue", "speaker": "Mira", "text": "I wish I was." },
    { "type": "label", "name": "end" },
    { "type": "unlockPlayer" }
  ]
}
```

## Development order

Build in this order:

```text
1. SmartEventDirectorMZ.js
2. SED_Namespace.js
3. SED_Params.js
4. SED_Logger.js
5. SED_Util.js
6. SED_StepRegistry.js
7. SED_SceneRegistry.js
8. SED_SceneValidator.js
9. SED_DataLoader.js
10. SED_StepQueue.js
11. SED_StepContext.js
12. SED_Locks.js
13. SED_Save.js
14. SED_Failsafe.js
15. SED_Runner.js
16. SED_Step_LabelJump.js
17. SED_Step_Wait.js
18. SED_Step_Dialogue.js
19. SED_Step_Choice.js
20. SED_Step_SwitchVariable.js
21. SED_Step_Fade.js
22. SED_Step_Movement.js
23. example index.json
24. example scene JSON
```

## Edge cases to handle early

The v0.1 engine must not soft-lock the player. Prioritize these cases:

- Missing or invalid `index.json`
- Missing scene file
- Malformed scene JSON
- Duplicate scene IDs
- Unknown step types
- `PlayScene` called while another scene is running
- Message window already busy
- Choice callback timing
- Missing event ID during movement
- Blocked movement route
- Movement timeout
- Scene timeout
- Scene fails before `unlockPlayer`
- Old save file has no Smart Event Director data

## LLM coding rules

When generating code for this project:

```text
Use plain JavaScript.
Do not use import/export.
Wrap every module in an IIFE.
Use "use strict".
Use the global window.SED namespace.
Keep each file under 500-ish lines.
Do not implement step behavior inside the runner.
Do not add eval/script steps in v0.1.
Do not rely on folder scanning.
Use data/SmartEventDirector/index.json to list scene files.
```

## Current next task

Start implementation with the v0.1 module loader and runtime skeleton.

Recommended first files:

```text
js/plugins/SmartEventDirectorMZ.js
js/plugins/SmartEventDirectorMZ/core/SED_Namespace.js
js/plugins/SmartEventDirectorMZ/core/SED_Params.js
js/plugins/SmartEventDirectorMZ/core/SED_Logger.js
js/plugins/SmartEventDirectorMZ/core/SED_Util.js
js/plugins/SmartEventDirectorMZ/runtime/SED_StepRegistry.js
```

## Status

Planning complete. Implementation not started.
