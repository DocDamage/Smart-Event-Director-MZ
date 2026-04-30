# Smart Event Director MZ — Modular Coding Plan

## Purpose

**Smart Event Director MZ** is a modular RPG Maker MZ plugin for running cutscenes, branching dialogue, scene logic, choice memory, and later quest progression from structured JSON scene files.

The first version should not try to replace RPG Maker's event system. It should coordinate it.

The practical goal:

> Define a scene once, then let the plugin run it safely, remember choices, update state, and recover if something breaks.

The technical goal:

> Build a frame-based scene runner with modular step handlers.

The runner should almost never know what a specific action means. It should not know what dialogue, movement, choices, or fades are. It should only know how to start a step, update a step every frame, finish a step, jump to labels, and recover from failure.

---

## Core Design Principle

The plugin succeeds or fails based on this rule:

```text
The runner should not know what a dialogue is.
The runner should not know what a choice is.
The runner should not know what movement is.
The runner should only know how to run steps.
```

Bad design:

```js
switch (step.type) {
  case "dialogue":
    // 100 lines of dialogue logic
    break;
  case "choice":
    // 100 lines of choice logic
    break;
  case "moveTo":
    // 100 lines of movement logic
    break;
}
```

Good design:

```js
const handler = SED.StepRegistry.get(step.type);
handler.start(step, context, runtime);
handler.update(step, context, runtime);
```

That is what keeps the project modular, testable, and easy for an LLM to code without creating a tangled mess.

---

## Implementation Progress

### v0.1 — Core Engine ✅ (Complete)

- [x] Scene loading via XHR JSON
- [x] Scene registry (SED_SceneRegistry.js)
- [x] Scene validation (SED_SceneValidator.js)
- [x] Scene runner (SED_Runner.js) — frame-based, no switch/case
- [x] Step registry (SED_StepRegistry.js)
- [x] Plugin commands: PlayScene, StopScene, RecoverScene
- [x] Player lock (SED_Locks.js) — reference-counted
- [x] Dialogue / Narration step (SED_Step_Dialogue.js)
- [x] Choice step with memory (SED_Step_Choice.js)
- [x] Wait step (SED_Step_Wait.js)
- [x] Switch / Variable step (SED_Step_SwitchVariable.js)
- [x] Fade step (fadeOut/fadeIn) (SED_Step_Fade.js)
- [x] Movement (moveOneTile/moveTo) (SED_Step_Movement.js)
- [x] Label / Jump step (SED_Step_LabelJump.js)
- [x] Save/load support (SED_Save.js)
- [x] Failsafe recovery (SED_Failsafe.js)
- [x] Module loader boot sequence
- [x] Game_Interpreter wait-mode patch (sedScene)
- [x] Scene_Map update patch
- [x] ALL files under 450 line warning threshold

### v0.2 — Cinematic & Condition Features ✅ (Complete)

- [x] Common event step (SED_Step_CommonEvent.js)
- [x] Condition step (SED_Step_Condition.js)
- [x] Self switch step (SED_Step_SelfSwitch.js)
- [x] Audio step (SED_Step_Audio.js)
- [x] Picture step (SED_Step_Picture.js)
- [x] Camera step (SED_Step_Camera.js)
- [x] Debug overlay (SED_DebugOverlay.js)
- [x] Scene skip with Escape key
- [x] Scene queue (optional)
- [x] Plugin commands: SkipScene, ToggleDebug
- [x] Example scenes: cinematic, picture_demo

### v0.3 — Quest & Relationship System ✅ (Complete)

- [x] Quest registry (SED_QuestRegistry.js)
- [x] Quest state tracking (SED_QuestState.js)
- [x] Relationship state (SED_RelationshipState.js)
- [x] Quest step handlers: startQuest, updateObjective, completeQuest, failQuest, questReward (SED_Step_Quest.js)
- [x] Relationship step handler (SED_Step_Relationship.js)
- [x] Quest condition operators: questActive, questCompleted, questFailed, questObjectiveDone
- [x] Relationship condition operators: relationshipGte, relationshipLte, relationshipIs
- [x] Quest toast notifications (SED_QuestToast.js)
- [x] Quest tracker HUD (SED_QuestTracker.js)
- [x] Save/load integration for quest and relationship state
- [x] Plugin commands: SetRelationship, AddRelationship, StartQuest, CompleteQuest, FailQuest, UpdateObjective
- [x] Example quest data (tutorial_quest, side_quest)
- [x] Example scenes (quest_scene, relationship_scene)

### v0.4 Roadmap (Planned)

- [ ] Command buffering (choose-ahead dialogue)
- [ ] Dialogue log (scrollable text history)
- [ ] Expanded TMX/Tiled map integration
- [ ] Better move route support
- [ ] Common event waiting improvements

---

## v1.0 Release Roadmap

### 💪 Stability & Hardening

- [ ] Save during active scene — store queue position, context, active step state so saving mid-cutscene doesn't lose progress
- [ ] Load mid-scene recovery — restore running scene when loading a save made mid-cutscene
- [ ] Cross-map scenes — handle map transfers mid-scene (movement steps continuing on new map)
- [ ] Event page change detection — warn/log when an event's page changes mid-scene
- [ ] Erased event handling — gracefully handle `$gameMap.eraseEvent()` during movement steps
- [ ] Plugin parameter validation — warn on boot if parameters are misconfigured
- [ ] Missing file recovery — better error messages for missing scenes/quests referenced in index
- [ ] Circular jump detection — detect infinite jump loops at boot/validation time

### 🎬 Core Feature Gaps

- [ ] Move route step — full RPG Maker move route commands (`SED_Step_MoveRoute.js`)
- [ ] Script/eval step — execute arbitrary JavaScript from step JSON
- [ ] Comment step — no-op step for scene documentation
- [ ] Condition else/jump — `elseJump` field on condition steps to avoid label pairs
- [ ] Loop step — `loop` / `endLoop` step types for repeating sections
- [ ] Common event async wait — wait for a common event to finish before continuing
- [ ] Text interpolation — `\v[1]`, `\n[1]` variable/name code support in dialogue text

### 🎨 UI/UX Improvements

- [ ] Dialogue log — scrollable text history (press a key to review past lines)
- [ ] Command buffering — confirm key chooses next dialogue option in advance
- [ ] Text speed control — per-scene or per-step text reveal speed
- [ ] Auto-advance mode — dialogue auto-progresses after configurable delay
- [ ] Typewriter effect — character-by-character text reveal
- [ ] Quest log window — full quest journal accessible from the menu
- [ ] Quest notification config — configurable toast position, animation, sound
- [ ] Relationship viewer — screen showing character relationship values
- [ ] Scene title card — optional title/name display at scene start

### 📖 Documentation & Tutorials

- [ ] Plugin help file — full RPG Maker help format docs with all commands, params, step types
- [ ] Step type reference — markdown doc listing every step type with JSON schema and examples
- [ ] Getting started guide — step-by-step: create a scene, add dialogue, add a choice, run it
- [ ] Quest system guide — define quests, objectives, rewards with examples
- [ ] Condition operator reference — complete list of all operators with examples
- [ ] Example project — small RPG Maker MZ project with maps, events, and demo scenes
- [ ] README overhaul — comprehensive README with feature list, quickstart, API reference

### 🧪 Testing Checklist

- [ ] Boot test — plugin loads without errors
- [ ] Dialogue test — text, speaker name, face images all work
- [ ] Choice test — options appear, branches work, choice saves/loads
- [ ] Movement test — events move, timeout works, failBehavior works
- [ ] Fade test — fade in/out with wait/no-wait
- [ ] Audio test — BGM/BGS/SE/ME play, stop, fade
- [ ] Picture test — show, move, erase, tint
- [ ] Camera test — scroll, focus, shake, flash, tint
- [ ] Condition test — all condition operators evaluate correctly
- [ ] Quest test — start, update, complete, fail, reward
- [ ] Relationship test — add/set points, conditions evaluate
- [ ] Scene skip test — escape skips, canSkip:false prevents skip
- [ ] Save/load test — save mid-scene, load old saves without SED data
- [ ] Failsafe test — missing event, timeout, bad JSON all recover gracefully
- [ ] Plugin conflict test — test with VisuStella, Yanfly, Galv, other common plugins
- [ ] Stress test — run 50+ scenes consecutively, check memory

### 🚀 Performance & Polish

- [ ] Profiled runner — ensure update loop stays under 1ms per frame
- [ ] Picture cleanup — ensure all pictures erased on scene stop/fail
- [ ] Audio cleanup — ensure audio state restored on scene stop/fail
- [ ] Memory leak check — verify no leaked references after dozens of plays
- [ ] Scene transition effects — crossfade between scenes
- [ ] Configurable keybinds — customization of skip/back/log keys

### 🔧 Developer Tooling

- [ ] JSON schema — publish JSON Schema for IDE autocomplete on scene/quest files
- [ ] Scene validator CLI — extend check_sed_lines.py to validate all JSON files in data/
- [ ] Scene template generator — script to generate a minimal scene JSON
- [ ] Hot-reload mode — debug param to re-load JSON files on each play (no restart needed)

### Summary: v1.0 Target

| Category | Items | Priority |
|---|---|---|
| Stability & Hardening | 8 | 🔴 Critical |
| Core Feature Gaps | 7 | 🔴 Critical |
| UI/UX Improvements | 9 | 🟡 High |
| Documentation | 7 | 🟡 High |
| Testing | 16 | 🔴 Critical |
| Performance | 6 | 🟢 Medium |
| Tooling | 4 | 🟢 Medium |
| **Total** | **57** | |

---


## Version 0.1 Scope

Build this first:

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

Do **not** add these in v0.1:

```text
Quest system
Relationship system
Visual editor
Common event waiting
Battle support
Scene nesting
Scene queueing
Autosave
Cutscene skip menu
Debug overlay
Portrait animation
Localization
Script/eval steps
Advanced camera
```

The clean step engine comes first. Everything else should be layered on top later.

---

## Recommended Folder Structure

Use a smaller structure first. It is easier to code, test, and keep under the line-count limit.

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
    SED_Step_Locks.js

data/
  SmartEventDirector/
    index.json
    scenes/
      example_intro.json
      example_choice.json
```

Target file sizes:

```text
Main plugin file: 250–450 lines
Core files: 80–250 lines each
Runtime files: 150–450 lines each
Step files: 80–300 lines each
Validator: 250–450 lines
```

Hard rule:

> If a file is getting close to 500 lines, split it before continuing.

---

## Important RPG Maker MZ Implementation Rule

Do **not** rely on scanning folders.

In deployed RPG Maker games, browser/mobile-style environments may not let you list files in a folder. Use an explicit data index instead.

Use this file:

```text
data/SmartEventDirector/index.json
```

Example:

```json
{
  "schema": "SED_INDEX_1",
  "scenes": [
    "example_intro.json",
    "example_choice.json"
  ]
}
```

Then each scene lives here:

```text
data/SmartEventDirector/scenes/example_intro.json
```

This avoids needing Node `fs`, avoids deployment problems, and keeps the plugin browser-safe.

---

## Core Scene JSON Format

Keep the v0.1 scene format simple and readable.

```json
{
  "schema": "SED_SCENE_1",
  "sceneId": "example_intro",
  "title": "Example Intro",
  "canSkip": true,
  "timeoutFrames": 3600,
  "steps": [
    {
      "type": "lockPlayer"
    },
    {
      "type": "fadeOut",
      "duration": 30,
      "wait": true
    },
    {
      "type": "wait",
      "frames": 15
    },
    {
      "type": "fadeIn",
      "duration": 30,
      "wait": true
    },
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
        {
          "text": "I feel it too.",
          "jump": "trust"
        },
        {
          "text": "You're imagining things.",
          "jump": "doubt"
        }
      ],
      "cancel": "none"
    },
    {
      "type": "label",
      "name": "trust"
    },
    {
      "type": "switch",
      "id": 21,
      "value": true
    },
    {
      "type": "dialogue",
      "speaker": "Mira",
      "text": "Then you understand."
    },
    {
      "type": "jump",
      "label": "end"
    },
    {
      "type": "label",
      "name": "doubt"
    },
    {
      "type": "variable",
      "id": 12,
      "operation": "add",
      "value": 1
    },
    {
      "type": "dialogue",
      "speaker": "Mira",
      "text": "I wish I was."
    },
    {
      "type": "label",
      "name": "end"
    },
    {
      "type": "unlockPlayer"
    }
  ]
}
```

---

## Step Handler Contract

Every step handler should follow the same contract.

```js
{
  types: ["dialogue"],

  validate(step, scene) {
    return []; // array of error strings
  },

  start(step, context, runtime) {
    // Called once when the step begins.
  },

  update(step, context, runtime) {
    // Called every frame.
    // Return true when the step is finished.
    return true;
  },

  cancel(step, context, runtime) {
    // Optional cleanup if scene is skipped/stopped.
  }
}
```

Definitions:

```text
step = raw JSON step
context = scene-wide state
runtime = temporary state for this one step
```

Do **not** store temporary step state directly on the handler object. Handlers are shared.

Good:

```js
runtime.phase = "waitingForMessage";
```

Bad:

```js
this.phase = "waitingForMessage";
```

---

## Main Plugin File

File:

```text
js/plugins/SmartEventDirectorMZ.js
```

This file should only handle:

```text
plugin metadata
plugin parameters
module loading
plugin command registration
boot waiting
Game_Interpreter wait-mode patch
Scene_Map update patch
```

Do **not** put scene logic, step logic, dialogue logic, movement logic, quest logic, or UI logic in this file.

```js
/*:
 * @target MZ
 * @plugindesc v0.1 Smart Event Director MZ - modular cutscene/story runner.
 * @author YourName
 *
 * @param Debug Mode
 * @type boolean
 * @default true
 *
 * @param Data Index Path
 * @type string
 * @default data/SmartEventDirector/index.json
 *
 * @param Default Scene Timeout
 * @type number
 * @default 3600
 *
 * @command PlayScene
 * @text Play Scene
 *
 * @arg sceneId
 * @type string
 * @text Scene ID
 *
 * @arg wait
 * @type boolean
 * @default true
 * @text Wait For Completion
 *
 * @command StopScene
 * @text Stop Current Scene
 *
 * @command RecoverScene
 * @text Force Scene Recovery
 */

(() => {
  "use strict";

  const PLUGIN_NAME = "SmartEventDirectorMZ";

  window.SED = window.SED || {};
  const SED = window.SED;

  SED.pluginName = PLUGIN_NAME;
  SED.ready = false;
  SED.bootError = null;

  const MODULES = [
    "core/SED_Namespace.js",
    "core/SED_Params.js",
    "core/SED_Logger.js",
    "core/SED_Util.js",

    "runtime/SED_StepRegistry.js",

    "data/SED_SceneRegistry.js",
    "data/SED_SceneValidator.js",
    "data/SED_DataLoader.js",

    "runtime/SED_StepQueue.js",
    "runtime/SED_StepContext.js",
    "runtime/SED_Locks.js",
    "runtime/SED_Save.js",
    "runtime/SED_Failsafe.js",
    "runtime/SED_Runner.js",

    "steps/SED_Step_LabelJump.js",
    "steps/SED_Step_Wait.js",
    "steps/SED_Step_Dialogue.js",
    "steps/SED_Step_Choice.js",
    "steps/SED_Step_SwitchVariable.js",
    "steps/SED_Step_Fade.js",
    "steps/SED_Step_Movement.js",
    "steps/SED_Step_Locks.js"
  ];

  function moduleBasePath() {
    return "js/plugins/SmartEventDirectorMZ/";
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.onload = () => resolve(src);
      script.onerror = () => reject(new Error("Failed to load SED module: " + src));
      document.body.appendChild(script);
    });
  }

  async function bootSed() {
    try {
      for (const file of MODULES) {
        await loadScript(moduleBasePath() + file);
      }

      if (SED.DataLoader && SED.DataLoader.loadAll) {
        await SED.DataLoader.loadAll();
      }

      SED.ready = true;
      if (SED.Logger) SED.Logger.info("Smart Event Director ready.");
    } catch (error) {
      SED.bootError = error;
      SED.ready = true; // Prevent permanent boot lock.
      console.error(error);
    }
  }

  bootSed();

  const _Scene_Boot_isReady = Scene_Boot.prototype.isReady;
  Scene_Boot.prototype.isReady = function() {
    const baseReady = _Scene_Boot_isReady.apply(this, arguments);
    return baseReady && SED.ready;
  };

  PluginManager.registerCommand(PLUGIN_NAME, "PlayScene", function(args) {
    const sceneId = String(args.sceneId || "");
    const wait = String(args.wait || "true") === "true";

    if (!sceneId) {
      console.error("SED PlayScene missing sceneId.");
      return;
    }

    if (!SED.Runner) {
      console.error("SED Runner is not loaded.");
      return;
    }

    SED.Runner.play(sceneId, {
      interpreter: this,
      callerEventId: typeof this.eventId === "function" ? this.eventId() : 0
    });

    if (wait && this.setWaitMode) {
      this.setWaitMode("sedScene");
    }
  });

  PluginManager.registerCommand(PLUGIN_NAME, "StopScene", function() {
    if (SED.Runner) SED.Runner.stop("pluginCommand");
  });

  PluginManager.registerCommand(PLUGIN_NAME, "RecoverScene", function() {
    if (SED.Failsafe) SED.Failsafe.recover("pluginCommand");
  });

  const _Game_Interpreter_updateWaitMode = Game_Interpreter.prototype.updateWaitMode;
  Game_Interpreter.prototype.updateWaitMode = function() {
    if (this._waitMode === "sedScene") {
      if (SED.Runner && SED.Runner.isBusy()) {
        return true;
      }
      this._waitMode = "";
      return false;
    }

    return _Game_Interpreter_updateWaitMode.apply(this, arguments);
  };

  const _Scene_Map_update = Scene_Map.prototype.update;
  Scene_Map.prototype.update = function() {
    _Scene_Map_update.apply(this, arguments);

    if (SED.Runner && SED.Runner.update) {
      SED.Runner.update();
    }
  };
})();
```

Important:

```text
The plugin command uses function(args), not args => {}.
That preserves the Game_Interpreter this value.
That lets PlayScene pause the calling event with setWaitMode("sedScene").
```

---

## Core Modules

### `core/SED_Namespace.js`

```js
(() => {
  "use strict";

  const SED = window.SED = window.SED || {};

  SED.version = "0.1.0";
  SED.modules = SED.modules || {};

  SED.registerModule = function(name, version) {
    if (this.modules[name]) {
      console.warn("SED module loaded twice:", name);
    }

    this.modules[name] = {
      version: version || "0.0.0",
      loadedAt: Date.now()
    };
  };

  SED.assert = function(condition, message) {
    if (!condition) {
      throw new Error("[SED] " + message);
    }
  };

  SED.registerModule("Namespace", "0.1.0");
})();
```

### `core/SED_Params.js`

```js
(() => {
  "use strict";

  const SED = window.SED;
  const raw = PluginManager.parameters(SED.pluginName);

  function bool(name, fallback) {
    const value = raw[name];
    if (value === undefined || value === "") return fallback;
    return String(value) === "true";
  }

  function number(name, fallback) {
    const value = Number(raw[name]);
    return Number.isFinite(value) ? value : fallback;
  }

  function text(name, fallback) {
    const value = raw[name];
    return value === undefined || value === "" ? fallback : String(value);
  }

  SED.Params = {
    debug: bool("Debug Mode", true),
    dataIndexPath: text("Data Index Path", "data/SmartEventDirector/index.json"),
    defaultSceneTimeout: number("Default Scene Timeout", 3600)
  };

  SED.registerModule("Params", "0.1.0");
})();
```

### `core/SED_Logger.js`

```js
(() => {
  "use strict";

  const SED = window.SED;

  const history = [];

  function push(level, args) {
    const item = {
      level,
      frame: Graphics.frameCount,
      message: Array.from(args).map(String).join(" ")
    };

    history.push(item);
    if (history.length > 100) history.shift();

    if (!SED.Params || SED.Params.debug) {
      console[level === "error" ? "error" : "log"]("[SED]", ...args);
    }
  }

  SED.Logger = {
    history,

    info() {
      push("info", arguments);
    },

    warn() {
      push("warn", arguments);
    },

    error() {
      push("error", arguments);
    },

    debug() {
      if (SED.Params && SED.Params.debug) {
        push("debug", arguments);
      }
    }
  };

  SED.registerModule("Logger", "0.1.0");
})();
```

### `core/SED_Util.js`

```js
(() => {
  "use strict";

  const SED = window.SED;

  function toBool(value, fallback) {
    if (value === undefined || value === null || value === "") return fallback;
    if (typeof value === "boolean") return value;
    return String(value) === "true";
  }

  function toNumber(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function characterFromId(id, interpreter) {
    const characterId = Number(id);

    if (characterId === -1) {
      return $gamePlayer;
    }

    if (characterId === 0 && interpreter && interpreter.character) {
      return interpreter.character(0);
    }

    if (characterId > 0 && $gameMap) {
      return $gameMap.event(characterId);
    }

    return null;
  }

  function directionFromText(value) {
    const map = {
      down: 2,
      left: 4,
      right: 6,
      up: 8
    };

    if (typeof value === "number") return value;
    return map[String(value || "").toLowerCase()] || 0;
  }

  function cloneJson(value) {
    return JSON.parse(JSON.stringify(value));
  }

  SED.Util = {
    toBool,
    toNumber,
    characterFromId,
    directionFromText,
    cloneJson
  };

  SED.registerModule("Util", "0.1.0");
})();
```

---

## Data Modules

### `data/SED_DataLoader.js`

```js
(() => {
  "use strict";

  const SED = window.SED;

  function loadJson(path) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", path);
      xhr.overrideMimeType("application/json");

      xhr.onload = function() {
        const ok = xhr.status < 400 || xhr.status === 0;

        if (!ok) {
          reject(new Error("Failed to load JSON: " + path + " status=" + xhr.status));
          return;
        }

        try {
          resolve(JSON.parse(xhr.responseText));
        } catch (error) {
          reject(new Error("Invalid JSON in " + path + ": " + error.message));
        }
      };

      xhr.onerror = function() {
        reject(new Error("XHR error loading JSON: " + path));
      };

      xhr.send();
    });
  }

  async function loadAll() {
    const indexPath = SED.Params.dataIndexPath;
    const index = await loadJson(indexPath);

    if (!index || index.schema !== "SED_INDEX_1") {
      throw new Error("Invalid SED index schema.");
    }

    if (!Array.isArray(index.scenes)) {
      throw new Error("SED index must contain scenes array.");
    }

    for (const file of index.scenes) {
      const scenePath = "data/SmartEventDirector/scenes/" + file;
      const scene = await loadJson(scenePath);

      const errors = SED.SceneValidator.validateScene(scene);

      if (errors.length > 0) {
        throw new Error("Scene validation failed for " + file + ": " + errors.join("; "));
      }

      SED.SceneRegistry.register(scene);
    }
  }

  SED.DataLoader = {
    loadJson,
    loadAll
  };

  SED.registerModule("DataLoader", "0.1.0");
})();
```

Edge case handled:

```text
xhr.status === 0
```

That matters because local files can report status `0`.

### `data/SED_SceneRegistry.js`

```js
(() => {
  "use strict";

  const SED = window.SED;
  const scenes = Object.create(null);

  function register(scene) {
    const id = String(scene.sceneId || "");

    if (!id) {
      throw new Error("Cannot register scene without sceneId.");
    }

    if (scenes[id]) {
      throw new Error("Duplicate sceneId: " + id);
    }

    scenes[id] = scene;
  }

  function get(sceneId) {
    return scenes[String(sceneId)] || null;
  }

  function has(sceneId) {
    return !!get(sceneId);
  }

  function list() {
    return Object.keys(scenes);
  }

  function clear() {
    for (const key of Object.keys(scenes)) {
      delete scenes[key];
    }
  }

  SED.SceneRegistry = {
    register,
    get,
    has,
    list,
    clear
  };

  SED.registerModule("SceneRegistry", "0.1.0");
})();
```

### `data/SED_SceneValidator.js`

```js
(() => {
  "use strict";

  const SED = window.SED;

  function validateScene(scene) {
    const errors = [];

    if (!scene || typeof scene !== "object") {
      return ["Scene must be an object."];
    }

    if (scene.schema !== "SED_SCENE_1") {
      errors.push("Scene schema must be SED_SCENE_1.");
    }

    if (!scene.sceneId || typeof scene.sceneId !== "string") {
      errors.push("Scene missing string sceneId.");
    }

    if (!Array.isArray(scene.steps)) {
      errors.push("Scene steps must be an array.");
      return errors;
    }

    const labels = Object.create(null);

    scene.steps.forEach((step, index) => {
      if (!step || typeof step !== "object") {
        errors.push("steps[" + index + "] must be an object.");
        return;
      }

      if (!step.type || typeof step.type !== "string") {
        errors.push("steps[" + index + "] missing type.");
        return;
      }

      if (step.type === "label") {
        if (!step.name) {
          errors.push("steps[" + index + "] label missing name.");
        } else if (labels[step.name]) {
          errors.push("Duplicate label: " + step.name);
        } else {
          labels[step.name] = true;
        }
      }
    });

    scene.steps.forEach((step, index) => {
      if (!step || !step.type) return;

      if (step.type === "jump" && !labels[step.label]) {
        errors.push("steps[" + index + "] jumps to missing label: " + step.label);
      }

      if (step.type === "choice" && Array.isArray(step.options)) {
        step.options.forEach((option, optionIndex) => {
          if (option.jump && !labels[option.jump]) {
            errors.push(
              "steps[" + index + "].options[" + optionIndex + "] jumps to missing label: " + option.jump
            );
          }
        });
      }

      if (SED.StepRegistry && !SED.StepRegistry.has(step.type)) {
        errors.push("steps[" + index + "] unknown step type: " + step.type);
      }
    });

    return errors;
  }

  SED.SceneValidator = {
    validateScene
  };

  SED.registerModule("SceneValidator", "0.1.0");
})();
```

Important:

```text
Load StepRegistry before loading scene data.
Otherwise the validator cannot check unknown step types.
```

---

## Runtime Modules

### `runtime/SED_StepRegistry.js`

```js
(() => {
  "use strict";

  const SED = window.SED;
  const handlers = Object.create(null);

  function register(handler) {
    if (!handler || !Array.isArray(handler.types)) {
      throw new Error("SED step handler must have types array.");
    }

    if (typeof handler.start !== "function") {
      throw new Error("SED step handler must have start().");
    }

    if (typeof handler.update !== "function") {
      throw new Error("SED step handler must have update().");
    }

    for (const type of handler.types) {
      if (handlers[type]) {
        throw new Error("Duplicate SED step handler type: " + type);
      }

      handlers[type] = handler;
    }
  }

  function get(type) {
    return handlers[type] || null;
  }

  function has(type) {
    return !!get(type);
  }

  function listTypes() {
    return Object.keys(handlers);
  }

  SED.StepRegistry = {
    register,
    get,
    has,
    listTypes
  };

  SED.registerModule("StepRegistry", "0.1.0");
})();
```

### `runtime/SED_StepQueue.js`

```js
(() => {
  "use strict";

  const SED = window.SED;

  function StepQueue(steps) {
    this._steps = steps || [];
    this._index = 0;
    this._labels = this.buildLabels();
  }

  StepQueue.prototype.buildLabels = function() {
    const labels = Object.create(null);

    for (let i = 0; i < this._steps.length; i++) {
      const step = this._steps[i];

      if (step && step.type === "label" && step.name) {
        labels[step.name] = i;
      }
    }

    return labels;
  };

  StepQueue.prototype.currentIndex = function() {
    return this._index;
  };

  StepQueue.prototype.next = function() {
    if (this._index >= this._steps.length) {
      return null;
    }

    const step = this._steps[this._index];
    this._index += 1;
    return step;
  };

  StepQueue.prototype.jumpTo = function(label) {
    const index = this._labels[label];

    if (index === undefined) {
      throw new Error("Missing label: " + label);
    }

    this._index = index + 1;
  };

  StepQueue.prototype.isComplete = function() {
    return this._index >= this._steps.length;
  };

  SED.StepQueue = StepQueue;
  SED.registerModule("StepQueue", "0.1.0");
})();
```

### `runtime/SED_StepContext.js`

```js
(() => {
  "use strict";

  const SED = window.SED;

  function StepContext(scene, options) {
    options = options || {};

    this.scene = scene;
    this.sceneId = scene.sceneId;
    this.interpreter = options.interpreter || null;
    this.callerEventId = options.callerEventId || 0;

    this.startedFrame = Graphics.frameCount;
    this.local = Object.create(null);

    this.requestedJump = null;
    this.requestedStop = false;
  }

  StepContext.prototype.jump = function(label) {
    this.requestedJump = String(label);
  };

  StepContext.prototype.stop = function() {
    this.requestedStop = true;
  };

  StepContext.prototype.setLocal = function(key, value) {
    this.local[String(key)] = value;
  };

  StepContext.prototype.getLocal = function(key) {
    return this.local[String(key)];
  };

  SED.StepContext = StepContext;
  SED.registerModule("StepContext", "0.1.0");
})();
```

### `runtime/SED_Locks.js`

```js
(() => {
  "use strict";

  const SED = window.SED;

  const state = {
    player: 0
  };

  function lockPlayer() {
    state.player += 1;
  }

  function unlockPlayer() {
    state.player = Math.max(0, state.player - 1);
  }

  function forceUnlockAll() {
    state.player = 0;
  }

  function isPlayerLocked() {
    return state.player > 0;
  }

  const _Game_Player_canMove = Game_Player.prototype.canMove;
  Game_Player.prototype.canMove = function() {
    if (SED.Locks && SED.Locks.isPlayerLocked()) {
      return false;
    }

    return _Game_Player_canMove.apply(this, arguments);
  };

  SED.Locks = {
    lockPlayer,
    unlockPlayer,
    forceUnlockAll,
    isPlayerLocked
  };

  SED.registerModule("Locks", "0.1.0");
})();
```

Why use reference-count locks?

```text
A scene may lock the player twice.
Unlocking once should not accidentally release the player too early.
```

### `runtime/SED_Save.js`

```js
(() => {
  "use strict";

  const SED = window.SED;

  const state = {
    playedScenes: Object.create(null),
    completedScenes: Object.create(null),
    choices: Object.create(null),
    flags: Object.create(null)
  };

  function markPlayed(sceneId) {
    state.playedScenes[String(sceneId)] = true;
  }

  function markCompleted(sceneId) {
    state.completedScenes[String(sceneId)] = true;
  }

  function setChoice(key, value) {
    state.choices[String(key)] = value;
  }

  function getChoice(key) {
    return state.choices[String(key)];
  }

  function toJSON() {
    return {
      version: 1,
      playedScenes: state.playedScenes,
      completedScenes: state.completedScenes,
      choices: state.choices,
      flags: state.flags
    };
  }

  function fromJSON(data) {
    data = data || {};

    state.playedScenes = data.playedScenes || Object.create(null);
    state.completedScenes = data.completedScenes || Object.create(null);
    state.choices = data.choices || Object.create(null);
    state.flags = data.flags || Object.create(null);
  }

  const _DataManager_makeSaveContents = DataManager.makeSaveContents;
  DataManager.makeSaveContents = function() {
    const contents = _DataManager_makeSaveContents.apply(this, arguments);
    contents.smartEventDirector = toJSON();
    return contents;
  };

  const _DataManager_extractSaveContents = DataManager.extractSaveContents;
  DataManager.extractSaveContents = function(contents) {
    _DataManager_extractSaveContents.apply(this, arguments);
    fromJSON(contents.smartEventDirector);
  };

  SED.Save = {
    markPlayed,
    markCompleted,
    setChoice,
    getChoice,
    toJSON,
    fromJSON
  };

  SED.registerModule("Save", "0.1.0");
})();
```

Recommended v0.1 save behavior:

```text
Do not save active running scene state yet.
Only save completed scene memory, played scene memory, flags, and choice memory.
```

Trying to resume a half-finished cutscene in v0.1 is not worth the bugs.

### `runtime/SED_Failsafe.js`

```js
(() => {
  "use strict";

  const SED = window.SED;

  function recover(reason) {
    reason = reason || "unknown";

    if (SED.Logger) {
      SED.Logger.warn("Failsafe recovery:", reason);
    }

    if (SED.Locks) {
      SED.Locks.forceUnlockAll();
    }

    if ($gameScreen) {
      $gameScreen.startFadeIn(1);
    }

    if (SED.Runner && SED.Runner._forceIdle) {
      SED.Runner._forceIdle();
    }
  }

  SED.Failsafe = {
    recover
  };

  SED.registerModule("Failsafe", "0.1.0");
})();
```

For v0.1, the failsafe should only do this:

```text
unlock player
fade screen back in
force runner idle
```

Do not overbuild it yet.

### `runtime/SED_Runner.js`

This is the most important file. Keep it under 500 lines by refusing to put step behavior inside it.

```js
(() => {
  "use strict";

  const SED = window.SED;

  const Runner = {
    _state: "idle",
    _scene: null,
    _queue: null,
    _context: null,
    _activeStep: null,
    _activeHandler: null,
    _activeRuntime: null,
    _sceneTimeoutFrame: 0,

    isBusy() {
      return this._state === "running" || this._state === "starting";
    },

    play(sceneId, options) {
      if (this.isBusy()) {
        SED.Logger.warn("Cannot start scene while another scene is running:", sceneId);
        return false;
      }

      const scene = SED.SceneRegistry.get(sceneId);

      if (!scene) {
        SED.Logger.error("Scene not found:", sceneId);
        return false;
      }

      const errors = SED.SceneValidator.validateScene(scene);

      if (errors.length > 0) {
        SED.Logger.error("Scene validation failed:", sceneId, errors.join("; "));
        return false;
      }

      this._state = "running";
      this._scene = SED.Util.cloneJson(scene);
      this._queue = new SED.StepQueue(this._scene.steps);
      this._context = new SED.StepContext(this._scene, options);
      this._activeStep = null;
      this._activeHandler = null;
      this._activeRuntime = null;

      const timeout = Number(scene.timeoutFrames || SED.Params.defaultSceneTimeout || 3600);
      this._sceneTimeoutFrame = Graphics.frameCount + timeout;

      SED.Save.markPlayed(sceneId);
      SED.Logger.info("Scene started:", sceneId);

      return true;
    },

    stop(reason) {
      reason = reason || "stopped";

      if (this._activeHandler && this._activeHandler.cancel) {
        try {
          this._activeHandler.cancel(this._activeStep, this._context, this._activeRuntime);
        } catch (error) {
          SED.Logger.error("Error during step cancel:", error.message);
        }
      }

      SED.Logger.info("Scene stopped:", reason);
      this._forceIdle();
    },

    update() {
      if (this._state !== "running") return;

      try {
        if (Graphics.frameCount > this._sceneTimeoutFrame) {
          throw new Error("Scene timeout: " + this._scene.sceneId);
        }

        if (!this._activeStep) {
          this._startNextStep();
        }

        if (!this._activeStep) {
          this._completeScene();
          return;
        }

        const done = this._activeHandler.update(
          this._activeStep,
          this._context,
          this._activeRuntime
        );

        if (done) {
          this._finishActiveStep();
        }
      } catch (error) {
        this._fail(error);
      }
    },

    _startNextStep() {
      const step = this._queue.next();

      if (!step) {
        this._activeStep = null;
        return;
      }

      const handler = SED.StepRegistry.get(step.type);

      if (!handler) {
        throw new Error("No handler for step type: " + step.type);
      }

      const runtime = {
        startedFrame: Graphics.frameCount
      };

      this._activeStep = step;
      this._activeHandler = handler;
      this._activeRuntime = runtime;

      handler.start(step, this._context, runtime);
    },

    _finishActiveStep() {
      const ctx = this._context;

      if (ctx.requestedStop) {
        this._completeScene();
        return;
      }

      if (ctx.requestedJump) {
        this._queue.jumpTo(ctx.requestedJump);
        ctx.requestedJump = null;
      }

      this._activeStep = null;
      this._activeHandler = null;
      this._activeRuntime = null;
    },

    _completeScene() {
      SED.Save.markCompleted(this._scene.sceneId);
      SED.Logger.info("Scene completed:", this._scene.sceneId);
      this._forceIdle();
    },

    _fail(error) {
      SED.Logger.error("Scene failed:", error.message);

      if (SED.Failsafe) {
        SED.Failsafe.recover(error.message);
      } else {
        this._forceIdle();
      }
    },

    _forceIdle() {
      this._state = "idle";
      this._scene = null;
      this._queue = null;
      this._context = null;
      this._activeStep = null;
      this._activeHandler = null;
      this._activeRuntime = null;
      this._sceneTimeoutFrame = 0;
    }
  };

  SED.Runner = Runner;
  SED.registerModule("Runner", "0.1.0");
})();
```

---

## Step Modules

### `steps/SED_Step_LabelJump.js`

```js
(() => {
  "use strict";

  const SED = window.SED;

  SED.StepRegistry.register({
    types: ["label"],

    validate() {
      return [];
    },

    start() {},

    update() {
      return true;
    }
  });

  SED.StepRegistry.register({
    types: ["jump"],

    validate(step) {
      const errors = [];
      if (!step.label) errors.push("jump step missing label.");
      return errors;
    },

    start(step, context) {
      context.jump(step.label);
    },

    update() {
      return true;
    }
  });

  SED.registerModule("Step_LabelJump", "0.1.0");
})();
```

### `steps/SED_Step_Wait.js`

```js
(() => {
  "use strict";

  const SED = window.SED;

  SED.StepRegistry.register({
    types: ["wait"],

    validate(step) {
      const errors = [];
      if (Number(step.frames) < 0) errors.push("wait frames must be >= 0.");
      return errors;
    },

    start(step, context, runtime) {
      const frames = Math.max(0, Number(step.frames || 0));
      runtime.endFrame = Graphics.frameCount + frames;
    },

    update(step, context, runtime) {
      return Graphics.frameCount >= runtime.endFrame;
    }
  });

  SED.registerModule("Step_Wait", "0.1.0");
})();
```

### `steps/SED_Step_Dialogue.js`

```js
(() => {
  "use strict";

  const SED = window.SED;

  SED.StepRegistry.register({
    types: ["dialogue", "narration"],

    validate(step) {
      const errors = [];

      if (!step.text) {
        errors.push(step.type + " step missing text.");
      }

      return errors;
    },

    start(step, context, runtime) {
      runtime.phase = "waitForMessageSlot";
    },

    update(step, context, runtime) {
      if (runtime.phase === "waitForMessageSlot") {
        if ($gameMessage.isBusy()) {
          return false;
        }

        if (step.faceName) {
          $gameMessage.setFaceImage(String(step.faceName), Number(step.faceIndex || 0));
        }

        if (step.speaker && $gameMessage.setSpeakerName) {
          $gameMessage.setSpeakerName(String(step.speaker));
        }

        $gameMessage.add(String(step.text));
        runtime.phase = "waitForMessageClose";
        return false;
      }

      if (runtime.phase === "waitForMessageClose") {
        return !$gameMessage.isBusy();
      }

      return true;
    }
  });

  SED.registerModule("Step_Dialogue", "0.1.0");
})();
```

Important edge case:

```text
Do not call $gameMessage.add() while $gameMessage.isBusy().
```

### `steps/SED_Step_Choice.js`

```js
(() => {
  "use strict";

  const SED = window.SED;

  function cancelIndex(step) {
    if (step.cancel === "none") return -1;
    if (step.cancel === "branch") return -2;

    const n = Number(step.cancel);
    return Number.isFinite(n) ? n : -1;
  }

  SED.StepRegistry.register({
    types: ["choice"],

    validate(step) {
      const errors = [];

      if (!Array.isArray(step.options) || step.options.length === 0) {
        errors.push("choice step needs non-empty options array.");
      }

      if (step.options && step.options.length > 6) {
        errors.push("choice step has more than 6 options. MZ default choice UI may not fit.");
      }

      return errors;
    },

    start(step, context, runtime) {
      runtime.phase = "waitForMessageSlot";
      runtime.resultIndex = null;
      runtime.done = false;
    },

    update(step, context, runtime) {
      if (runtime.phase === "waitForMessageSlot") {
        if ($gameMessage.isBusy()) {
          return false;
        }

        const options = step.options.map(option => String(option.text || ""));
        const defaultIndex = Number(step.defaultIndex || 0);

        if (step.prompt) {
          $gameMessage.add(String(step.prompt));
        }

        $gameMessage.setChoices(options, defaultIndex, cancelIndex(step));

        $gameMessage.setChoiceCallback(index => {
          runtime.resultIndex = index;
          runtime.done = true;
        });

        runtime.phase = "waitForChoice";
        return false;
      }

      if (runtime.phase === "waitForChoice") {
        if (!runtime.done || $gameMessage.isBusy()) {
          return false;
        }

        const index = runtime.resultIndex;
        const option = step.options[index];

        if (step.key) {
          SED.Save.setChoice(step.key, {
            index,
            text: option ? option.text : null
          });
        }

        if (option && option.jump) {
          context.jump(option.jump);
        }

        return true;
      }

      return true;
    },

    cancel(step, context, runtime) {
      runtime.done = true;
    }
  });

  SED.registerModule("Step_Choice", "0.1.0");
})();
```

Choice edge cases:

```text
No options
More options than the default choice window handles cleanly
Cancel disabled
Cancel branch not implemented yet
Choice callback fires while message window is still closing
Choice key missing
Option jumps to missing label
```

### `steps/SED_Step_SwitchVariable.js`

```js
(() => {
  "use strict";

  const SED = window.SED;

  SED.StepRegistry.register({
    types: ["switch"],

    validate(step) {
      const errors = [];

      if (Number(step.id) <= 0) {
        errors.push("switch step needs id > 0.");
      }

      return errors;
    },

    start(step) {
      const id = Number(step.id);
      const value = SED.Util.toBool(step.value, true);
      $gameSwitches.setValue(id, value);
    },

    update() {
      return true;
    }
  });

  SED.StepRegistry.register({
    types: ["variable"],

    validate(step) {
      const errors = [];

      if (Number(step.id) <= 0) {
        errors.push("variable step needs id > 0.");
      }

      return errors;
    },

    start(step) {
      const id = Number(step.id);
      const operation = String(step.operation || "set");
      const value = Number(step.value || 0);
      const current = Number($gameVariables.value(id) || 0);

      let next = current;

      if (operation === "set") next = value;
      else if (operation === "add") next = current + value;
      else if (operation === "sub") next = current - value;
      else if (operation === "mul") next = current * value;
      else if (operation === "div") next = value === 0 ? current : current / value;
      else if (operation === "mod") next = value === 0 ? current : current % value;
      else throw new Error("Unknown variable operation: " + operation);

      $gameVariables.setValue(id, next);
    },

    update() {
      return true;
    }
  });

  SED.registerModule("Step_SwitchVariable", "0.1.0");
})();
```

Variable edge case:

```text
Division by zero should not crash the game.
```

### `steps/SED_Step_Fade.js`

```js
(() => {
  "use strict";

  const SED = window.SED;

  function registerFade(type, methodName) {
    SED.StepRegistry.register({
      types: [type],

      validate(step) {
        const errors = [];
        if (Number(step.duration || 0) < 0) {
          errors.push(type + " duration must be >= 0.");
        }
        return errors;
      },

      start(step, context, runtime) {
        const duration = Math.max(0, Number(step.duration || 30));
        runtime.wait = step.wait !== false;
        runtime.endFrame = Graphics.frameCount + duration;

        $gameScreen[methodName](duration);
      },

      update(step, context, runtime) {
        if (!runtime.wait) return true;
        return Graphics.frameCount >= runtime.endFrame;
      }
    });
  }

  registerFade("fadeOut", "startFadeOut");
  registerFade("fadeIn", "startFadeIn");

  SED.registerModule("Step_Fade", "0.1.0");
})();
```

### `steps/SED_Step_Movement.js`

Start simple. Do not build full pathfinding first.

Support two movement types:

```text
moveOneTile
moveTo
```

Example:

```json
{
  "type": "moveOneTile",
  "eventId": 3,
  "direction": "left",
  "wait": true,
  "timeoutFrames": 120
}
```

Example:

```json
{
  "type": "moveTo",
  "eventId": 3,
  "x": 10,
  "y": 7,
  "wait": true,
  "timeoutFrames": 300,
  "failBehavior": "continue"
}
```

Code:

```js
(() => {
  "use strict";

  const SED = window.SED;

  function isAt(character, x, y) {
    return character.x === Number(x) && character.y === Number(y);
  }

  SED.StepRegistry.register({
    types: ["moveOneTile"],

    validate(step) {
      const errors = [];

      if (SED.Util.directionFromText(step.direction) === 0) {
        errors.push("moveOneTile needs direction: up/down/left/right or 2/4/6/8.");
      }

      return errors;
    },

    start(step, context, runtime) {
      const character = SED.Util.characterFromId(step.eventId, context.interpreter);

      if (!character) {
        throw new Error("moveOneTile could not find character: " + step.eventId);
      }

      const direction = SED.Util.directionFromText(step.direction);

      runtime.character = character;
      runtime.wait = step.wait !== false;
      runtime.timeoutFrame = Graphics.frameCount + Number(step.timeoutFrames || 120);

      character.moveStraight(direction);
    },

    update(step, context, runtime) {
      if (!runtime.wait) return true;

      if (Graphics.frameCount > runtime.timeoutFrame) {
        throw new Error("moveOneTile timeout.");
      }

      return !runtime.character.isMoving();
    }
  });

  SED.StepRegistry.register({
    types: ["moveTo"],

    validate(step) {
      const errors = [];

      if (step.x === undefined || step.y === undefined) {
        errors.push("moveTo needs x and y.");
      }

      return errors;
    },

    start(step, context, runtime) {
      const character = SED.Util.characterFromId(step.eventId, context.interpreter);

      if (!character) {
        throw new Error("moveTo could not find character: " + step.eventId);
      }

      runtime.character = character;
      runtime.wait = step.wait !== false;
      runtime.timeoutFrame = Graphics.frameCount + Number(step.timeoutFrames || 300);
      runtime.lastX = character.x;
      runtime.lastY = character.y;
      runtime.stuckFrames = 0;
    },

    update(step, context, runtime) {
      const character = runtime.character;

      if (isAt(character, step.x, step.y)) {
        return true;
      }

      if (!runtime.wait) {
        return true;
      }

      if (Graphics.frameCount > runtime.timeoutFrame) {
        if (step.failBehavior === "continue") {
          SED.Logger.warn("moveTo timeout; continuing.");
          return true;
        }

        throw new Error("moveTo timeout.");
      }

      if (character.isMoving()) {
        return false;
      }

      if (character.x === runtime.lastX && character.y === runtime.lastY) {
        runtime.stuckFrames += 1;
      } else {
        runtime.stuckFrames = 0;
        runtime.lastX = character.x;
        runtime.lastY = character.y;
      }

      if (runtime.stuckFrames > 30) {
        if (step.failBehavior === "continue") {
          SED.Logger.warn("moveTo stuck; continuing.");
          return true;
        }

        throw new Error("moveTo stuck.");
      }

      const direction = character.findDirectionTo(Number(step.x), Number(step.y));

      if (direction > 0) {
        character.moveStraight(direction);
      } else {
        runtime.stuckFrames += 1;
      }

      return false;
    }
  });

  SED.registerModule("Step_Movement", "0.1.0");
})();
```

Movement edge cases:

```text
Target event does not exist
Event page changes mid-scene
Event is erased
Path is blocked
Player blocks the event
Another event blocks the event
Destination is outside map
Destination is unreachable
Event has Through OFF
Event has Direction Fix ON
Map transfers during movement
```

For v0.1, do not try to solve all of those. Just make sure the game does not soft-lock.

### `steps/SED_Step_Locks.js`

```js
(() => {
  "use strict";

  const SED = window.SED;

  SED.StepRegistry.register({
    types: ["lockPlayer"],

    validate() {
      return [];
    },

    start() {
      SED.Locks.lockPlayer();
    },

    update() {
      return true;
    }
  });

  SED.StepRegistry.register({
    types: ["unlockPlayer"],

    validate() {
      return [];
    },

    start() {
      SED.Locks.unlockPlayer();
    },

    update() {
      return true;
    }
  });

  SED.registerModule("Step_Locks", "0.1.0");
})();
```

---

## Edge Cases To Handle Explicitly

### Boot/loading edge cases

```text
Missing index.json
Invalid index.json
Scene file listed in index but missing
Scene JSON malformed
Scene schema wrong
Duplicate sceneId
Unknown step type
External module failed to load
Boot error causes permanent black screen
```

Required behavior:

```text
Log a clear error.
Do not freeze forever.
Do not crash without explanation.
```

### Plugin command edge cases

```text
PlayScene missing sceneId
PlayScene called before SED modules loaded
PlayScene called while another scene is running
PlayScene called from common event
PlayScene called from parallel process
PlayScene called without wait
```

Recommended v0.1 behavior:

```text
Only allow one active scene.
Reject new scenes while busy.
Log warning.
Do not queue scenes yet.
```

### Message edge cases

```text
$gameMessage is already busy
message plugin changes name box behavior
choice callback fires before message closes
scene is skipped during a message
player fast-forwards message
```

Required behavior:

```text
Wait for $gameMessage.isBusy() to become false before starting dialogue or choice.
Do not add new message text while busy.
```

### Movement edge cases

```text
Event does not exist
Event erased itself
Event page changed
Target tile unreachable
Character stuck
Map changed mid-move
Event route blocked forever
```

Required behavior:

```text
Use timeoutFrames.
Use failBehavior.
Never soft-lock.
```

### Save/load edge cases

```text
Save during scene
Load old save with no SED data
Load save from older plugin version
Choice key missing
Scene was played but not completed
```

Recommended v0.1 behavior:

```text
Allow save data to load even if smartEventDirector is missing.
Do not save active running scene state yet.
Only save completed scene memory and choice memory.
```

### Label/jump edge cases

```text
Duplicate labels
Jump to missing label
Choice option jumps to missing label
Jump loop
```

Recommended v0.1 behavior:

```text
Validator catches missing/duplicate labels.
Scene timeout catches infinite loops.
```

### Lock edge cases

```text
Scene locks player twice
Scene fails before unlockPlayer
Scene skipped before unlockPlayer
Another plugin also affects player movement
```

Required behavior:

```text
Use reference-count locks.
Failsafe must force unlock all SED locks.
```

---

## Line Count Dev Tool

File:

```text
tools/check_sed_lines.py
```

```python
from pathlib import Path

ROOT = Path("js/plugins/SmartEventDirectorMZ")
WARN_AT = 450
FAIL_AT = 525

failed = False

for path in ROOT.rglob("*.js"):
    lines = path.read_text(encoding="utf-8").splitlines()
    count = len(lines)

    if count >= FAIL_AT:
        print(f"FAIL {count:4} lines  {path}")
        failed = True
    elif count >= WARN_AT:
        print(f"WARN {count:4} lines  {path}")
    else:
        print(f"OK   {count:4} lines  {path}")

if failed:
    raise SystemExit(1)
```

Use this after every generated file.

---

## Recommended Implementation Order

Give your LLM one file at a time, in this order:

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
23. SED_Step_Locks.js
24. example index.json
25. example scene JSON
```

Reason:

```text
Registry before handlers.
Validator before data load.
Queue/context before runner.
Locks/save/failsafe before runner.
Runner before real scene tests.
```

---

## Testing Checklist

### Test 1: Boot

Expected:

```text
Game boots.
Console says Smart Event Director ready.
No module loading errors.
```

### Test 2: Simple dialogue scene

Scene:

```json
{
  "schema": "SED_SCENE_1",
  "sceneId": "test_dialogue",
  "title": "Test Dialogue",
  "steps": [
    {
      "type": "dialogue",
      "speaker": "Mira",
      "text": "This is a test."
    }
  ]
}
```

Expected:

```text
Plugin command PlayScene test_dialogue displays message.
Calling event waits until message closes.
```

### Test 3: Lock player

Scene:

```json
{
  "schema": "SED_SCENE_1",
  "sceneId": "test_lock",
  "title": "Test Lock",
  "steps": [
    { "type": "lockPlayer" },
    { "type": "wait", "frames": 120 },
    { "type": "unlockPlayer" }
  ]
}
```

Expected:

```text
Player cannot move for 120 frames.
Player can move after scene.
```

### Test 4: Choice memory

Scene:

```json
{
  "schema": "SED_SCENE_1",
  "sceneId": "test_choice",
  "title": "Test Choice",
  "steps": [
    {
      "type": "choice",
      "key": "test_choice_key",
      "prompt": "Pick one.",
      "options": [
        { "text": "A", "jump": "a" },
        { "text": "B", "jump": "b" }
      ],
      "cancel": "none"
    },
    { "type": "label", "name": "a" },
    { "type": "dialogue", "text": "You picked A." },
    { "type": "jump", "label": "end" },
    { "type": "label", "name": "b" },
    { "type": "dialogue", "text": "You picked B." },
    { "type": "label", "name": "end" }
  ]
}
```

Expected:

```text
Choice appears.
Correct branch plays.
Choice result saves.
```

### Test 5: Movement failure

Scene:

```json
{
  "schema": "SED_SCENE_1",
  "sceneId": "test_bad_move",
  "title": "Test Bad Move",
  "steps": [
    {
      "type": "moveTo",
      "eventId": 999,
      "x": 10,
      "y": 10,
      "timeoutFrames": 60
    }
  ]
}
```

Expected:

```text
Scene fails clearly.
Failsafe unlocks player.
Screen is not stuck black.
Console shows useful error.
```

---

## v0.2 Roadmap

After v0.1 works, add:

```text
Debug overlay
Scene skip button
Common event step
Condition step
Self switch step
Audio step
Picture step
Camera scroll/focus step
Scene queue option
Better move route support
```

---

## v0.3 Roadmap

Then add:

```text
Quest registry
Quest state
Objective state
Quest toast
Quest tracker window
Quest reward step
Relationship point step
Conditional branch by choice/quest/relationship
```

At that point, the plugin becomes the real **Smart Event Director MZ**.

---

## LLM Prompt Templates

### For a normal module

```text
You are coding Smart Event Director MZ for RPG Maker MZ.

Implement only this file:
js/plugins/SmartEventDirectorMZ/runtime/SED_StepRegistry.js

Rules:
- Plain JavaScript, no import/export.
- Wrap in an IIFE.
- Use "use strict".
- Use global window.SED namespace.
- Do not exceed 450 lines.
- Do not modify unrelated RPG Maker prototypes.
- Keep this file responsible only for registering and retrieving step handlers.
- Every handler must have types[], start(), and update().
- Return the full file contents only.
```

### For a step handler

```text
Implement only this file:
js/plugins/SmartEventDirectorMZ/steps/SED_Step_Dialogue.js

Rules:
- Register a handler with SED.StepRegistry.
- Handler type: dialogue and narration.
- Do not add text while $gameMessage.isBusy().
- Store temporary state in runtime, not in the handler object.
- Return true from update() only after the message window has closed.
- Do not exceed 300 lines.
```

### For the runner

```text
Implement only this file:
js/plugins/SmartEventDirectorMZ/runtime/SED_Runner.js

Rules:
- Frame-based update runner.
- One active scene only.
- No switch statement for step types.
- Use SED.StepRegistry to find handlers.
- Use SED.StepQueue for next/jump.
- Use SED.StepContext for scene context.
- Catch errors and call SED.Failsafe.recover().
- Do not implement dialogue, choices, movement, fade, or switch behavior inside the runner.
- Do not exceed 500 lines.
```

---

## Final Coding Advice

Build v0.1 as a clean engine, not a giant all-in-one plugin.

The first working version should prove these things:

```text
A scene can load.
A scene can run.
A scene can wait.
A scene can show dialogue.
A scene can branch from a choice.
A scene can lock/unlock the player.
A scene can fail without soft-locking the game.
Scene memory can save/load.
```

Once that works, quests, relationships, debug overlays, cinematic camera, and compatibility modules become straightforward additions instead of a rewrite.
