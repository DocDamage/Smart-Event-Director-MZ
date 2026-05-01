# Quest System Guide

This guide covers everything about quests in Smart Event Director MZ (SED).

---

## 1. Overview

SED's quest system lets you define quests in JSON, track objectives, and reward players — all without complex eventing.

A quest has three parts:

1. **Definition** — A JSON file describing the quest's metadata and objectives.
2. **State** — Runtime tracking of whether the quest is active, completed, or failed.
3. **Scene Steps** — Commands inside your scenes that start, update, complete, and reward quests.

---

## 2. Defining a Quest

Create a file in `data/SmartEventDirector/quests/`.

### Example

```json
{
  "schema": "SED_QUEST_1",
  "questId": "slime_extermination",
  "title": "Slime Extermination",
  "description": "Clear the slimes from the eastern cave.",
  "objectives": [
    { "id": "defeat_slimes", "text": "Defeat 5 Slimes" },
    { "id": "report_to_chief", "text": "Report to the Village Chief" }
  ]
}
```

### Fields

| Field | Required | Description |
|---|---|---|
| `schema` | Yes | Must be `SED_QUEST_1`. |
| `questId` | Yes | Unique identifier used by scenes and conditions. |
| `title` | Yes | Display name shown in toasts and the quest log. |
| `description` | No | Long description shown in the quest log detail pane. |
| `objectives` | No | Array of objective objects. |

### Objective object

| Field | Required | Description |
|---|---|---|
| `id` | Yes | Unique key for the objective within this quest. |
| `text` | Yes | Human-readable text shown in trackers and logs. |

### Optional rewards field

You may add a `rewards` object for your own reference or external tools:

```json
{
  "rewards": {
    "gold": 200,
    "exp": 100,
    "items": [{ "id": 5, "quantity": 1 }]
  }
}
```

> **Note:** SED does not automatically process the `rewards` field. You grant rewards using the `questReward` step in a scene.

### Registration

Add the quest filename to `data/SmartEventDirector/index.json`:

```json
{
  "schema": "SED_INDEX_1",
  "scenes": [],
  "quests": [
    "slime_extermination.json"
  ]
}
```

---

## 3. Quest States

Every quest has one of four states, stored internally as numbers:

| State | Value | Meaning |
|---|---|---|
| `NOT_STARTED` | `0` | The quest has never been started. |
| `ACTIVE` | `1` | The quest is in progress. Objectives can be updated. |
| `COMPLETED` | `2` | The quest was successfully finished. |
| `FAILED` | `3` | The quest was failed and can no longer be completed. |

States transition only in one direction:

- `NOT_STARTED` → `ACTIVE` (via `startQuest`)
- `ACTIVE` → `COMPLETED` (via `completeQuest`)
- `ACTIVE` → `FAILED` (via `failQuest`)

You cannot restart a quest once it has left `NOT_STARTED`.

---

## 4. Quest Steps in Scenes

Use these step types inside your scene JSON `steps` array.

### `startQuest`

Activates a quest and initializes its objectives.

```json
{
  "type": "startQuest",
  "questId": "slime_extermination"
}
```

### `updateObjective`

Marks an objective as complete or incomplete.

```json
{
  "type": "updateObjective",
  "questId": "slime_extermination",
  "objective": "defeat_slimes",
  "completed": true
}
```

Setting `"completed": false` un-marks the objective.

### `completeQuest`

Sets the quest to `COMPLETED` and marks all objectives done.

```json
{
  "type": "completeQuest",
  "questId": "slime_extermination"
}
```

### `failQuest`

Sets the quest to `FAILED`.

```json
{
  "type": "failQuest",
  "questId": "slime_extermination"
}
```

### `questReward`

Grants gold, EXP, items, weapons, and armor to the party.

```json
{
  "type": "questReward",
  "questId": "slime_extermination",
  "gold": 200,
  "exp": 100,
  "items": [
    { "id": 1, "quantity": 3 }
  ],
  "weapons": [
    { "id": 2, "quantity": 1 }
  ],
  "armors": [
    { "id": 4, "quantity": 1 }
  ]
}
```

| Field | Description |
|---|---|
| `gold` | Amount of gold added to the party. |
| `exp` | Experience points granted to all party members. |
| `items` | Array of `{ id, quantity }` using database item IDs. |
| `weapons` | Array of `{ id, quantity }` using database weapon IDs. |
| `armors` | Array of `{ id, quantity }` using database armor IDs. |

---

## 5. Quest Conditions

Use the `condition` step to branch scenes based on quest state.

### Operators

| Operator | Required Fields | Evaluates to true when... |
|---|---|---|
| `questActive` | `questId` | The quest is currently active. |
| `questCompleted` | `questId` | The quest has been completed. |
| `questFailed` | `questId` | The quest has been failed. |
| `questObjectiveDone` | `questId`, `objective` | The specific objective is marked complete. |

### Example

```json
{
  "type": "condition",
  "operator": "questActive",
  "questId": "slime_extermination",
  "jumpTrue": "has_quest",
  "jumpFalse": "no_quest"
},
{ "type": "label", "name": "has_quest" },
{
  "type": "dialogue",
  "speaker": "Chief",
  "text": "How is the hunt going?"
},
{ "type": "jump", "label": "end" },
{ "type": "label", "name": "no_quest" },
{
  "type": "dialogue",
  "speaker": "Chief",
  "text": "We have a slime problem. Can you help?"
},
{ "type": "label", "name": "end" }
```

You can also use `elseJump` as a shorthand for `jumpFalse`.

---

## 6. Quest UI

SED provides three built-in UI features for quests.

### Quest Toasts

A toast notification appears automatically when:
- A quest is started.
- A quest is completed.
- A quest is failed.

Toasts slide in and fade out after a few seconds. You can configure their position and sound via plugin parameters.

### Quest Tracker HUD

The tracker displays active quests and their objectives in the top-left corner of the map screen.

- Complete objectives show `[X]` in green.
- Incomplete objectives show `[ ]` in gray.

The tracker only appears while at least one quest is active.

### Quest Log

The full quest log is a menu scene with three tabs: **Active**, **Completed**, and **Failed**.

To open it, use the plugin command:

```
OpenQuestLog
```

Or call it from a Script command:

```js
SED.QuestLog.open();
```

You can bind the `OpenQuestLog` command to a common event triggered by a menu item or key item.

---

## 7. Quest Save/Load

Quest state is saved and loaded automatically with RPG Maker's save system.

SED hooks into `DataManager.makeSaveContents` and `DataManager.extractSaveContents` to persist:

- Quest state (`NOT_STARTED`, `ACTIVE`, `COMPLETED`, `FAILED`)
- Objective completion flags
- Start, completion, and failure timestamps
- Custom quest flags

You do not need to do anything special. Quests will survive save/load cycles, including loading older saves that did not have SED installed.

---

## 8. Complete Example

Below is a full quest from definition to completion.

### Quest Definition

`data/SmartEventDirector/quests/herb_hunt.json`:

```json
{
  "schema": "SED_QUEST_1",
  "questId": "herb_hunt",
  "title": "Herb Hunt",
  "description": "Mira needs 3 Healing Herbs for her potion.",
  "objectives": [
    { "id": "talk_to_mira", "text": "Talk to Mira" },
    { "id": "collect_herbs", "text": "Collect 3 Healing Herbs" },
    { "id": "return_herbs", "text": "Return the herbs to Mira" }
  ]
}
```

### Start Scene

`data/SmartEventDirector/scenes/start_herb_hunt.json`:

```json
{
  "schema": "SED_SCENE_1",
  "sceneId": "start_herb_hunt",
  "title": "Start Herb Hunt",
  "canSkip": false,
  "steps": [
    { "type": "lockPlayer" },
    {
      "type": "dialogue",
      "speaker": "Mira",
      "text": "I need 3 Healing Herbs. Can you find them?"
    },
    {
      "type": "startQuest",
      "questId": "herb_hunt"
    },
    {
      "type": "updateObjective",
      "questId": "herb_hunt",
      "objective": "talk_to_mira",
      "completed": true
    },
    {
      "type": "dialogue",
      "speaker": "Mira",
      "text": "Check your quest tracker for progress."
    },
    { "type": "unlockPlayer" }
  ]
}
```

### Hand-In Scene

`data/SmartEventDirector/scenes/finish_herb_hunt.json`:

```json
{
  "schema": "SED_SCENE_1",
  "sceneId": "finish_herb_hunt",
  "title": "Finish Herb Hunt",
  "canSkip": false,
  "steps": [
    { "type": "lockPlayer" },
    {
      "type": "dialogue",
      "speaker": "Mira",
      "text": "You got the herbs!"
    },
    {
      "type": "updateObjective",
      "questId": "herb_hunt",
      "objective": "collect_herbs",
      "completed": true
    },
    {
      "type": "updateObjective",
      "questId": "herb_hunt",
      "objective": "return_herbs",
      "completed": true
    },
    {
      "type": "completeQuest",
      "questId": "herb_hunt"
    },
    {
      "type": "questReward",
      "questId": "herb_hunt",
      "gold": 150,
      "exp": 75,
      "items": [
        { "id": 2, "quantity": 1 }
      ]
    },
    {
      "type": "dialogue",
      "speaker": "Mira",
      "text": "Thank you! Here is your reward."
    },
    { "type": "unlockPlayer" }
  ]
}
```

Register both scenes and the quest in `index.json`, then trigger the scenes with `PlayScene` plugin commands in your map events.
