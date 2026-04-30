# Smart Event Director MZ — Step Type Reference

Complete reference for all SED scene step types. Every step is a JSON object with at least a `type` field.

---

## Table of Contents

- [Core](#core)
  - [`dialogue`](#dialogue)
  - [`narration`](#narration)
  - [`choice`](#choice)
  - [`wait`](#wait)
  - [`switch`](#switch)
  - [`variable`](#variable)
- [Movement](#movement)
  - [`moveOneTile`](#moveonetile)
  - [`moveTo`](#moveto)
  - [`moveRoute`](#moveroute)
  - [`lockPlayer`](#lockplayer)
  - [`unlockPlayer`](#unlockplayer)
- [Flow Control](#flow-control)
  - [`label`](#label)
  - [`jump`](#jump)
  - [`loop`](#loop)
  - [`endLoop`](#endloop)
  - [`condition`](#condition)
  - [`script`](#script)
  - [`comment`](#comment)
- [Scene Control](#scene-control)
  - [`callScene`](#callscene)
  - [`return`](#return)
  - [`checkpoint`](#checkpoint)
  - [`preload`](#preload)
- [Audio / Visual](#audio--visual)
  - [`fadeOut`](#fadeout)
  - [`fadeIn`](#fadein)
  - [`audio`](#audio)
  - [`picture`](#picture)
  - [`camera`](#camera)
  - [`weather`](#weather)
  - [`transition`](#transition)
  - [`titleCard`](#titlecard)
- [Quest](#quest)
  - [`startQuest`](#startquest)
  - [`updateObjective`](#updateobjective)
  - [`completeQuest`](#completequest)
  - [`failQuest`](#failquest)
  - [`questReward`](#questreward)
- [Relationship](#relationship)
  - [`relationship`](#relationship)
- [System](#system)
  - [`commonEvent`](#commonevent)
  - [`selfSwitch`](#selfswitch)

---

## Text Interpolation

All string fields in steps are automatically interpolated at runtime:

| Code | Meaning | Example |
|---|---|---|
| `\\v[n]` | Game variable value | `"You have \\v[1] gold."` |
| `\\n[n]` | Actor name from database | `"\\n[1] joined the party!"` |
| `\\p[n]` | Party member name | `"\\p[1] is injured."` |
| `\\t[key]` | Locale string lookup | `"\\t[dialogue.greeting]"` |


---

## Core

### `dialogue`

Displays a spoken message in the RPG Maker message window.

**Schema**

| Field | Type | Required | Default |
|---|---|---|---|
| `type` | string | yes | `"dialogue"` |
| `text` | string | yes | — |
| `speaker` | string | no | — |
| `faceName` | string | no | — |
| `faceIndex` | number | no | `0` |

**Example**

```json
{
  "type": "dialogue",
  "speaker": "Mira",
  "faceName": "Actor1",
  "faceIndex": 2,
  "text": "Something is wrong with this place."
}
```

**Notes**
- The handler waits for `$gameMessage.isBusy()` to become false before adding text, so overlapping dialogue never corrupts the window.
- If the speaker name box plugin feature is available, `speaker` populates it automatically.
- Supports text interpolation codes such as `\v[n]` and `\p[n]` when the TextEffects module is active.

---

### `narration`

Displays a message without a speaker name box; otherwise identical to `dialogue`.

**Schema**

| Field | Type | Required | Default |
|---|---|---|---|
| `type` | string | yes | `"narration"` |
| `text` | string | yes | — |
| `faceName` | string | no | — |
| `faceIndex` | number | no | `0` |

**Example**

```json
{
  "type": "narration",
  "text": "The wind howls through the empty halls."
}
```

**Notes**
- Use `narration` for environmental or inner-monologue text where no named speaker is appropriate.

---

### `choice`

Presents a multiple-choice prompt and optionally branches to a label based on the player's selection.

**Schema**

| Field | Type | Required | Default |
|---|---|---|---|
| `type` | string | yes | `"choice"` |
| `key` | string | no | — |
| `prompt` | string | no | — |
| `options` | array | yes | — |
| `options[].text` | string | yes | — |
| `options[].jump` | string | no | — |
| `options[].condition` | object | no | — |
| `conditionMode` | string | no | `"hidden"` |
| `defaultIndex` | number | no | `0` |
| `cancel` | string\|number | no | `"none"` |
| `timeout` | number | no | — |
| `timeoutBehavior` | string | no | `"default"` |
| `timeoutDefaultIndex` | number | no | `0` |
| `timeoutJump` | string | no | — |

**Example**

```json
{
  "type": "choice",
  "key": "mira_intro_response",
  "prompt": "How do you respond?",
  "options": [
    { "text": "I feel it too.", "jump": "trust" },
    {
      "text": "(Intimidate) Back off.",
      "jump": "intimidate",
      "condition": { "operator": "variableGte", "variableId": 5, "value": 10 }
    }
  ],
  "cancel": "none"
}
```

**Timed Choice Example**

```json
{
  "type": "choice",
  "prompt": "Quick! Choose!",
  "timeout": 180,
  "timeoutBehavior": "jump",
  "timeoutJump": "tooSlow",
  "options": [
    { "text": "Run!", "jump": "run" },
    { "text": "Fight!", "jump": "fight" }
  ]
}
```

**Notes**
- Up to 6 options are recommended; more may overflow the default MZ choice window.
- `cancel` can be `"none"`, `"branch"`, or a zero-based option index.
- If `key` is provided, the chosen index and text are persisted in `SED.Save` and survive save/load.
- Each option `jump` target must match a `label` name in the same scene.
- **Conditional options**: Each option can have a `condition` object (same format as the `condition` step). If the condition fails, the option is hidden by default. Set `conditionMode: "disabled"` to grey it out instead of hiding it.
- **Timed choices**: Set `timeout` to the number of frames. `timeoutBehavior` can be `"default"` (auto-select default), `"jump"` (jump to `timeoutJump` label), or `"cancel"` (treat as cancelled).

---

### `wait`

Pauses the scene runner for a fixed number of frames.

**Schema**

| Field | Type | Required | Default |
|---|---|---|---|
| `type` | string | yes | `"wait"` |
| `frames` | number | yes | `0` |

**Example**

```json
{
  "type": "wait",
  "frames": 60
}
```

**Notes**
- One second at 60 fps equals 60 frames.
- Negative frames are clamped to `0`.

---

### `switch`

Sets an RPG Maker game switch to `true` or `false`.

**Schema**

| Field | Type | Required | Default |
|---|---|---|---|
| `type` | string | yes | `"switch"` |
| `id` | number | yes | — |
| `value` | boolean | no | `true` |

**Example**

```json
{
  "type": "switch",
  "id": 21,
  "value": true
}
```

**Notes**
- `id` must be greater than `0`. Invalid IDs are caught by the validator.

---

### `variable`

Performs a math operation on an RPG Maker game variable.

**Schema**

| Field | Type | Required | Default |
|---|---|---|---|
| `type` | string | yes | `"variable"` |
| `id` | number | yes | — |
| `operation` | string | no | `"set"` |
| `value` | number | no | `0` |

**Example**

```json
{
  "type": "variable",
  "id": 12,
  "operation": "add",
  "value": 1
}
```

**Notes**
- Valid operations: `set`, `add`, `sub`, `mul`, `div`, `mod`.
- Division or modulo by zero leaves the current value unchanged rather than crashing.

---

## Movement

### `moveOneTile`

Moves a character one tile in the specified direction.

**Schema**

| Field | Type | Required | Default |
|---|---|---|---|
| `type` | string | yes | `"moveOneTile"` |
| `eventId` | number | no | `0` (caller) |
| `direction` | string\|number | yes | — |
| `wait` | boolean | no | `true` |
| `timeoutFrames` | number | no | `120` |
| `failBehavior` | string | no | `"error"` |

**Example**

```json
{
  "type": "moveOneTile",
  "eventId": 3,
  "direction": "left",
  "wait": true,
  "timeoutFrames": 120
}
```

**Notes**
- `direction` accepts `"up"`, `"down"`, `"left"`, `"right"` or the MZ numeric equivalents `2`, `4`, `6`, `8`.
- `eventId` of `-1` targets the player; `0` targets the calling event.
- If the character is erased or its event page changes mid-movement, the runner logs a warning.
- Set `failBehavior` to `"continue"` to ignore timeout errors.

---

### `moveTo`

Pathfinds a character to an absolute map tile coordinate.

**Schema**

| Field | Type | Required | Default |
|---|---|---|---|
| `type` | string | yes | `"moveTo"` |
| `eventId` | number | no | `0` (caller) |
| `x` | number | yes | — |
| `y` | number | yes | — |
| `wait` | boolean | no | `true` |
| `timeoutFrames` | number | no | `300` |
| `failBehavior` | string | no | `"error"` |

**Example**

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

**Notes**
- Uses RPG Maker's built-in `findDirectionTo` for basic pathfinding.
- If the character remains stuck for more than 30 frames, the runner treats it as a failure.
- If the destination is unreachable and `failBehavior` is `"continue"`, the scene proceeds without hanging.

---

### `moveRoute`

Executes a full RPG Maker move route on a character.

**Schema**

| Field | Type | Required | Default |
|---|---|---|---|
| `type` | string | yes | `"moveRoute"` |
| `eventId` | number | no | `0` (caller) |
| `commands` | array | yes | — |
| `commands[].code` | string | yes | — |
| `wait` | boolean | no | `true` |
| `timeoutFrames` | number | no | `600` |
| `failBehavior` | string | no | `"error"` |

**Example**

```json
{
  "type": "moveRoute",
  "eventId": -1,
  "commands": [
    { "code": "turnRight" },
    { "code": "stepForward" },
    { "code": "turnDown" },
    { "code": "stepForward" }
  ],
  "wait": true,
  "timeoutFrames": 180
}
```

**Notes**
- Supported codes include `moveDown`, `moveLeft`, `moveRight`, `moveUp`, `moveRandom`, `moveTowardPlayer`, `moveAwayFromPlayer`, `stepForward`, `stepBackward`, `jump`, `wait`, `turnDown`, `turnLeft`, `turnRight`, `turnUp`, `turnRight90`, `turnLeft90`, `turn180`, `turnRightOrLeft90`, `turnRandom`, `turnTowardPlayer`, `turnAwayFromPlayer`, `switchOn`, `switchOff`, `changeSpeed`, `changeFreq`, `walkAnimeOn`, `walkAnimeOff`, `stepAnimeOn`, `stepAnimeOff`, `dirFixOn`, `dirFixOff`, `throughOn`, `throughOff`, `transparentOn`, `transparentOff`, `changeImage`, `changeOpacity`, `changeBlendMode`, `playSE`, `script`.
- The route is forced and never repeats.

---

### `lockPlayer`

Prevents the player from moving via a reference-counted lock.

**Schema**

| Field | Type | Required | Default |
|---|---|---|---|
| `type` | string | yes | `"lockPlayer"` |

**Example**

```json
{
  "type": "lockPlayer"
}
```

**Notes**
- Multiple `lockPlayer` steps stack; the player is only freed when an equal number of `unlockPlayer` steps have run.
- Failsafe recovery forcibly clears all SED player locks.

---

### `unlockPlayer`

Decrements the player movement lock counter.

**Schema**

| Field | Type | Required | Default |
|---|---|---|---|
| `type` | string | yes | `"unlockPlayer"` |

**Example**

```json
{
  "type": "unlockPlayer"
}
```

**Notes**
- The counter never drops below `0`.

---

## Flow Control

### `label`

A named anchor that can be jumped to from `jump`, `choice`, `loop`, or `condition` steps.

**Schema**

| Field | Type | Required | Default |
|---|---|---|---|
| `type` | string | yes | `"label"` |
| `name` | string | yes | — |

**Example**

```json
{
  "type": "label",
  "name": "trust"
}
```

**Notes**
- Label names must be unique within a scene; duplicates are caught by the validator.

---

### `jump`

Instantly moves the scene runner to the step after the named label.

**Schema**

| Field | Type | Required | Default |
|---|---|---|---|
| `type` | string | yes | `"jump"` |
| `label` | string | yes | — |

**Example**

```json
{
  "type": "jump",
  "label": "end"
}
```

**Notes**
- The target label must exist in the same scene; missing labels are caught by the validator.

---

### `loop`

Marks the start of a repeatable block.

**Schema**

| Field | Type | Required | Default |
|---|---|---|---|
| `type` | string | yes | `"loop"` |
| `label` | string | yes | — |
| `maxIterations` | number | no | `10000` |

**Example**

```json
{
  "type": "loop",
  "label": "repeatStart",
  "maxIterations": 10
}
```

**Notes**
- The loop counter and limit are stored in scene-local context, so nested loops are safe as long as labels differ.

---

### `endLoop`

Jumps back to the matching `loop` label until `maxIterations` is reached.

**Schema**

| Field | Type | Required | Default |
|---|---|---|---|
| `type` | string | yes | `"endLoop"` |
| `label` | string | yes | — |

**Example**

```json
{
  "type": "endLoop",
  "label": "repeatStart"
}
```

**Notes**
- When the iteration limit is exceeded, the runner logs a warning and falls through instead of looping forever.

---

### `condition`

Evaluates a logical test and jumps to a label based on the result.

**Schema**

| Field | Type | Required | Default |
|---|---|---|---|
| `type` | string | yes | `"condition"` |
| `operator` | string | yes | — |
| `jumpTrue` | string | no | — |
| `jumpFalse` | string | no | — |
| `elseJump` | string | no | — |

**Example**

```json
{
  "type": "condition",
  "operator": "switchIs",
  "switchId": 1,
  "value": true,
  "jumpTrue": "already_done",
  "jumpFalse": "new_path"
}
```

**Notes**
- See [`CONDITIONS.md`](CONDITIONS.md) for the full operator list and required fields per operator.
- `elseJump` is a shorthand alias for `jumpFalse`.
- If no jump is defined for the resulting branch, execution simply continues to the next step.

---

### `script`

Executes arbitrary JavaScript inside the SED runtime.

**Schema**

| Field | Type | Required | Default |
|---|---|---|---|
| `type` | string | yes | `"script"` |
| `code` | string | yes | — |
| `wait` | boolean | no | `false` |

**Example**

```json
{
  "type": "script",
  "code": "$gameVariables.setValue(10, 3);",
  "wait": true
}
```

**Notes**
- The code runs in a function with `context` and `runtime` as local arguments.
- Errors are logged to the console; the scene continues unless `wait` is `true` and the script throws.
- Set `wait: true` if the script needs to span multiple frames; the step finishes on the next update.

---

### `comment`

No-op step for documenting scene logic. Ignored by the runner.

**Schema**

| Field | Type | Required | Default |
|---|---|---|---|
| `type` | string | yes | `"comment"` |
| `text` | string | no | — |

**Example**

```json
{
  "type": "comment",
  "text": "This section handles the trust branch."
}
```

**Notes**
- Comments are validated as valid objects but have no effect on execution.

---

## Audio / Visual

### `fadeOut`

Fades the screen to black.

**Schema**

| Field | Type | Required | Default |
|---|---|---|---|
| `type` | string | yes | `"fadeOut"` |
| `duration` | number | no | `30` |
| `wait` | boolean | no | `true` |

**Example**

```json
{
  "type": "fadeOut",
  "duration": 30,
  "wait": true
}
```

**Notes**
- If `wait` is `false`, the runner immediately proceeds while the fade continues in the background.

---

### `fadeIn`

Fades the screen back in from black.

**Schema**

| Field | Type | Required | Default |
|---|---|---|---|
| `type` | string | yes | `"fadeIn"` |
| `duration` | number | no | `30` |
| `wait` | boolean | no | `true` |

**Example**

```json
{
  "type": "fadeIn",
  "duration": 30,
  "wait": true
}
```

**Notes**
- Failsafe recovery automatically issues a 1-frame fade-in to rescue a stuck black screen.

---

### `audio`

Plays or stops BGM, BGS, SE, or ME.

**Schema**

| Field | Type | Required | Default |
|---|---|---|---|
| `type` | string | yes | `"audio"` |
| `action` | string | yes | — |
| `name` | string | conditional | — |
| `volume` | number | no | `90` |
| `pitch` | number | no | `100` |
| `pan` | number | no | `0` |

**Example**

```json
{
  "type": "audio",
  "action": "bgm",
  "name": "Theme1",
  "volume": 90,
  "pitch": 100
}
```

**Notes**
- Valid actions: `bgm`, `bgs`, `se`, `me`, `stopBgm`, `stopBgs`, `stopAll`.
- `name` is required for play actions and ignored for stop actions.
- Audio state is tracked by `SED.Cleanup` and restored on scene stop or failure.

---

### `picture`

Shows, moves, tints, or erases a screen picture.

**Schema**

| Field | Type | Required | Default |
|---|---|---|---|
| `type` | string | yes | `"picture"` |
| `action` | string | yes | — |
| `id` | number | yes | — |
| `name` | string | conditional | — |
| `origin` | number | no | `0` |
| `x` | number | no | `0` |
| `y` | number | no | `0` |
| `scaleX` | number | no | `100` |
| `scaleY` | number | no | `100` |
| `opacity` | number | no | `255` |
| `blendMode` | number | no | `0` |
| `duration` | number | no | `30` |
| `wait` | boolean | no | `true` |
| `tone` | array | no | `[0,0,0,0]` |

**Example**

```json
{
  "type": "picture",
  "action": "show",
  "id": 1,
  "name": "Picture1",
  "origin": 0,
  "x": 320,
  "y": 240,
  "scaleX": 100,
  "scaleY": 100,
  "opacity": 255,
  "blendMode": 0
}
```

**Notes**
- Valid actions: `show`, `move`, `erase`, `tint`.
- `tone` is only used for `tint` and is an `[r, g, b, gray]` array.
- Pictures are tracked by `SED.Cleanup` and erased on scene stop or failure.

---

### `camera`

Scrolls, shakes, flashes, tints, or resets the game camera.

**Schema**

| Field | Type | Required | Default |
|---|---|---|---|
| `type` | string | yes | `"camera"` |
| `action` | string | yes | — |
| `x` | number | no | `0` |
| `y` | number | no | `0` |
| `duration` | number | no | `30` |
| `wait` | boolean | no | `true` |
| `power` | number | no | `5` |
| `speed` | number | no | `5` |
| `color` | array | no | `[255,255,255,128]` |
| `tone` | array | no | `[0,0,0,0]` |

**Example**

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

**Notes**
- Valid actions: `scroll`, `focus`, `reset`, `shake`, `flash`, `tint`.
- `scroll` and `reset` wait for `$gameMap.isScrolling()`; `shake`, `flash`, and `tint` wait for the specified duration.
- `focus` snaps instantly to a tile coordinate and does not wait.

---

### `weather`

Changes the map weather effect.

**Schema**

| Field | Type | Required | Default |
|---|---|---|---|
| `type` | string | yes | `"weather"` |
| `action` | string | no | `"set"` |
| `weatherType` | string | no | `"none"` |
| `power` | number | no | `5` |
| `duration` | number | no | `60` |
| `wait` | boolean | no | `true` |

**Example**

```json
{
  "type": "weather",
  "action": "set",
  "weatherType": "rain",
  "power": 5,
  "duration": 60,
  "wait": true
}
```

**Notes**
- Valid actions: `set`, `clear`, `fade`.
- Valid weather types: `none`, `rain`, `storm`, `snow`.
- `power` must be between `0` and `9`.
- `clear` is a convenience alias that sets type to `none` and power to `0`.

---

### `transition`

Performs a full-screen transition effect.

**Schema**

| Field | Type | Required | Default |
|---|---|---|---|
| `type` | string | yes | `"transition"` |
| `effect` | string | no | `"fade"` |
| `duration` | number | no | `30` |
| `wait` | boolean | no | `true` |
| `color` | array | no | `[255,255,255,255]` |

**Example**

```json
{
  "type": "transition",
  "effect": "fadeWhite",
  "duration": 45,
  "wait": true,
  "color": [255, 255, 255, 255]
}
```

**Notes**
- Valid effects: `fade`, `fadeWhite`, `wipe`, `mosaic`, `instant`.
- Non-instant effects perform an out-then-in cycle over the total duration.
- `fadeWhite` uses the `color` array as a screen tone; other effects fall back to standard fade out/in.
- On cancel, the screen is restored immediately.

---

### `titleCard`

Displays a centered title and optional subtitle over a dark overlay.

**Schema**

| Field | Type | Required | Default |
|---|---|---|---|
| `type` | string | yes | `"titleCard"` |
| `title` | string | yes | — |
| `subtitle` | string | no | — |
| `fadeIn` | number | no | `30` |
| `duration` | number | no | `180` |
| `fadeOut` | number | no | `30` |
| `wait` | boolean | no | `true` |

**Example**

```json
{
  "type": "titleCard",
  "title": "Chapter 1",
  "subtitle": "The Awakening",
  "fadeIn": 30,
  "duration": 180,
  "fadeOut": 30,
  "wait": true
}
```

**Notes**
- The window is removed automatically when the fade-out phase completes.
- If `wait` is `false`, the window appears instantly at full opacity and the runner continues immediately.
- On scene skip or stop, the window is forcibly removed.

---

## Quest

### `startQuest`

Activates a quest from the quest registry.

**Schema**

| Field | Type | Required | Default |
|---|---|---|---|
| `type` | string | yes | `"startQuest"` |
| `questId` | string | yes | — |

**Example**

```json
{
  "type": "startQuest",
  "questId": "tutorial_quest"
}
```

**Notes**
- Fails silently with a logged error if the quest is not registered or is already active.
- Objectives are initialized from the quest definition automatically.

---

### `updateObjective`

Marks a quest objective as complete or incomplete.

**Schema**

| Field | Type | Required | Default |
|---|---|---|---|
| `type` | string | yes | `"updateObjective"` |
| `questId` | string | yes | — |
| `objective` | string | yes | — |
| `completed` | boolean | no | `true` |

**Example**

```json
{
  "type": "updateObjective",
  "questId": "tutorial_quest",
  "objective": "collect_herbs",
  "completed": true
}
```

**Notes**
- Has no effect if the quest is not currently active.

---

### `completeQuest`

Marks an active quest as completed.

**Schema**

| Field | Type | Required | Default |
|---|---|---|---|
| `type` | string | yes | `"completeQuest"` |
| `questId` | string | yes | — |

**Example**

```json
{
  "type": "completeQuest",
  "questId": "tutorial_quest"
}
```

**Notes**
- All objectives are automatically marked complete when this step runs.
- Cannot complete a quest that is not active.

---

### `failQuest`

Marks an active quest as failed.

**Schema**

| Field | Type | Required | Default |
|---|---|---|---|
| `type` | string | yes | `"failQuest"` |
| `questId` | string | yes | — |

**Example**

```json
{
  "type": "failQuest",
  "questId": "tutorial_quest"
}
```

**Notes**
- Cannot fail a quest that is not active.

---

### `questReward`

Grants gold, items, weapons, armor, and/or EXP as a quest reward.

**Schema**

| Field | Type | Required | Default |
|---|---|---|---|
| `type` | string | yes | `"questReward"` |
| `questId` | string | yes | — |
| `gold` | number | no | `0` |
| `exp` | number | no | `0` |
| `items` | array | no | `[]` |
| `items[].id` | number | yes | — |
| `items[].quantity` | number | no | `1` |
| `weapons` | array | no | `[]` |
| `weapons[].id` | number | yes | — |
| `weapons[].quantity` | number | no | `1` |
| `armors` | array | no | `[]` |
| `armors[].id` | number | yes | — |
| `armors[].quantity` | number | no | `1` |

**Example**

```json
{
  "type": "questReward",
  "questId": "tutorial_quest",
  "gold": 100,
  "exp": 50,
  "items": [
    { "id": 1, "quantity": 3 }
  ]
}
```

**Notes**
- EXP is distributed to all party members.
- Invalid item/weapon/armor IDs are silently skipped.

---

## Relationship

### `relationship`

Adds or sets relationship points for a target character.

**Schema**

| Field | Type | Required | Default |
|---|---|---|---|
| `type` | string | yes | `"relationship"` |
| `action` | string | no | `"add"` |
| `target` | string | yes | — |
| `value` | number | no | `0` |

**Example**

```json
{
  "type": "relationship",
  "action": "add",
  "target": "Mira",
  "value": 10
}
```

**Notes**
- Valid actions: `set`, `add`.
- Negative values are allowed for `add` to subtract points.
- Relationship data persists through save/load.

---

## System

### `commonEvent`

Runs an RPG Maker common event.

**Schema**

| Field | Type | Required | Default |
|---|---|---|---|
| `type` | string | yes | `"commonEvent"` |
| `id` | number | yes | — |
| `wait` | boolean | no | `true` |

**Example**

```json
{
  "type": "commonEvent",
  "id": 5,
  "wait": true
}
```

**Notes**
- Requires a valid `Game_Interpreter` context; will error if called without one.
- When `wait` is `true`, the runner manually advances the interpreter each frame until the event list finishes.
- On scene cancel, the interpreter is restored to its previous list and index.

---

### `selfSwitch`

Sets a self-switch for a specific map event.

**Schema**

| Field | Type | Required | Default |
|---|---|---|---|
| `type` | string | yes | `"selfSwitch"` |
| `eventId` | number | yes | — |
| `letter` | string | yes | — |
| `value` | boolean | no | `true` |

**Example**

```json
{
  "type": "selfSwitch",
  "eventId": 1,
  "letter": "A",
  "value": true
}
```

**Notes**
- `letter` must be exactly one character (`A`, `B`, `C`, or `D`).
- The switch is stored per-map, per-event, per-letter in `$gameSelfSwitches`.

---

## Scene Control

### `callScene`

Calls another scene as a sub-scene. When the sub-scene completes (or hits a `return` step), execution resumes at the `returnLabel` in the current scene.

**Schema**

| Field | Type | Required | Default |
|---|---|---|---|
| `type` | string | yes | `"callScene"` |
| `sceneId` | string | yes | — |
| `returnLabel` | string | no | — |

**Example**

```json
{
  "type": "callScene",
  "sceneId": "shop_greeting",
  "returnLabel": "afterShop"
}
```

**Notes**
- The sub-scene runs with its own `StepQueue` and `StepContext`.
- When the sub-scene ends (naturally or via `return`), the runner pops the call stack and resumes the parent scene.
- `stop()` and failsafe recovery clear the entire call stack.
- Save/load preserves the call stack depth and resumes correctly.

---

### `return`

Forces an early return from a sub-scene back to its caller. If no call stack exists, this step does nothing and the scene continues.

**Schema**

| Field | Type | Required | Default |
|---|---|---|---|
| `type` | string | yes | `"return"` |

**Example**

```json
{
  "type": "return"
}
```

**Notes**
- Typically used inside sub-scenes that are called via `callScene`.
- Equivalent to completing the scene early.

---

### `checkpoint`

Saves a checkpoint of the current scene state. The player can later retry from this checkpoint via the `RetryCheckpoint` or `RetryCheckpointId` plugin commands.

**Schema**

| Field | Type | Required | Default |
|---|---|---|---|
| `type` | string | yes | `"checkpoint"` |
| `id` | string | no | auto-generated |

**Example**

```json
{
  "type": "checkpoint",
  "id": "pre_boss"
}
```

**Notes**
- Checkpoints capture: scene ID, queue index, context locals, configured switches/variables, SED choices, and flags.
- Up to 10 checkpoints are kept in a ring buffer; older ones are discarded.
- Configure which switches and variables to snapshot via plugin parameters: `Checkpoint Switch IDs` and `Checkpoint Variable IDs` (comma-separated).

---

### `preload`

Preloads images and audio assets before they are needed, preventing frame hitches during scenes.

**Schema**

| Field | Type | Required | Default |
|---|---|---|---|
| `type` | string | yes | `"preload"` |
| `images` | string[] | no | — |
| `audio` | object[] | no | — |
| `audio[].name` | string | yes | — |
| `audio[].type` | string | yes | `"bgm"` |

**Example**

```json
{
  "type": "preload",
  "images": ["img/pictures/boss_bust.png"],
  "audio": [
    { "name": "boss_theme", "type": "bgm" },
    { "name": "roar", "type": "se" }
  ]
}
```

**Notes**
- The step waits until all listed assets report loaded before finishing.
- Image paths should be relative to the project root (e.g., `img/pictures/name.png`).
- Audio `type` can be `"bgm"`, `"bgs"`, `"me"`, or `"se"`.
