# Getting Started with Smart Event Director MZ

This guide walks you through creating your first scene, adding branching dialogue, movement, and a quest.

---

## 1. Prerequisites

- An **RPG Maker MZ** project.
- Basic knowledge of RPG Maker **events** and **plugin commands**.
- Smart Event Director MZ (SED) installed in your project.

---

## 2. Installation

1. Copy the `SmartEventDirectorMZ.js` file into your project's `js/plugins/` folder.
2. Copy the `SmartEventDirectorMZ/` folder (all core modules) into `js/plugins/`.
3. Create the folder `data/SmartEventDirector/scenes/` inside your project.
4. Open RPG Maker MZ, go to **Tools → Plugin Manager**, and add **SmartEventDirectorMZ**.
5. Save your project.

---

## 3. Your First Scene

### Step A: Create the data index

Create `data/SmartEventDirector/index.json`:

```json
{
  "schema": "SED_INDEX_1",
  "scenes": [
    "hello_world.json"
  ],
  "quests": []
}
```

This tells SED which scene files to load.

### Step B: Create a scene file

Create `data/SmartEventDirector/scenes/hello_world.json`:

```json
{
  "schema": "SED_SCENE_1",
  "sceneId": "hello_world",
  "title": "Hello World",
  "canSkip": true,
  "steps": [
    {
      "type": "dialogue",
      "speaker": "Mira",
      "text": "Welcome to Smart Event Director!"
    }
  ]
}
```

### Step C: Play the scene in an event

1. On any map, create a new **Event**.
2. Add a new event command: **Plugin Command** → `SmartEventDirectorMZ` → `PlayScene`.
3. Set **Scene ID** to `hello_world`.
4. Leave **Wait For Completion** checked.
5. Save and **Playtest**.

Walk up to the event and interact. You should see Mira's dialogue box.

---

## 4. Adding a Choice

Let's branch the conversation based on player input.

Replace the contents of `hello_world.json`:

```json
{
  "schema": "SED_SCENE_1",
  "sceneId": "hello_world",
  "title": "Hello World",
  "canSkip": true,
  "steps": [
    {
      "type": "dialogue",
      "speaker": "Mira",
      "text": "Welcome to Smart Event Director!"
    },
    {
      "type": "choice",
      "key": "hello_choice",
      "prompt": "Are you ready to begin?",
      "options": [
        { "text": "Yes, let's go!", "jump": "agree" },
        { "text": "Not yet.", "jump": "refuse" }
      ],
      "cancel": "none"
    },
    { "type": "label", "name": "agree" },
    {
      "type": "dialogue",
      "speaker": "Mira",
      "text": "Great! Let's get started."
    },
    { "type": "jump", "label": "end" },
    { "type": "label", "name": "refuse" },
    {
      "type": "dialogue",
      "speaker": "Mira",
      "text": "No problem. Come back when you're ready."
    },
    { "type": "label", "name": "end" }
  ]
}
```

### How it works

- `choice` displays a prompt with two options.
- Each option has a `jump` to a `label`.
- Labels are empty bookmarks. `jump` moves the scene to the step after the label.
- `cancel: "none"` prevents the player from canceling the choice.
- `key` saves the player's choice so you can check it later.

Playtest the event. Try both options.

---

## 5. Adding Movement

Prevent the player from wandering during the scene, then move an event.

Update `hello_world.json`:

```json
{
  "schema": "SED_SCENE_1",
  "sceneId": "hello_world",
  "title": "Hello World",
  "canSkip": true,
  "steps": [
    { "type": "lockPlayer" },
    {
      "type": "dialogue",
      "speaker": "Mira",
      "text": "Follow me!"
    },
    {
      "type": "moveTo",
      "eventId": 1,
      "x": 8,
      "y": 5,
      "wait": true,
      "timeoutFrames": 300,
      "failBehavior": "continue"
    },
    {
      "type": "dialogue",
      "speaker": "Mira",
      "text": "We made it."
    },
    { "type": "unlockPlayer" }
  ]
}
```

### Movement options

- `eventId`: The event to move. Use `-1` for the player, `0` for the calling event.
- `x`, `y`: Target map coordinates.
- `wait: true`: The scene waits until the event arrives.
- `timeoutFrames`: Maximum frames to wait before failing.
- `failBehavior`: `"continue"` lets the scene proceed if the event gets stuck.

**Note:** `lockPlayer` uses reference counting. If a scene fails or is skipped, the failsafe automatically unlocks the player.

---

## 6. Adding a Quest

### Step A: Define a quest

Create `data/SmartEventDirector/quests/my_first_quest.json`:

```json
{
  "schema": "SED_QUEST_1",
  "questId": "my_first_quest",
  "title": "My First Quest",
  "description": "Help Mira collect herbs.",
  "objectives": [
    { "id": "talk_to_mira", "text": "Talk to Mira" },
    { "id": "collect_herbs", "text": "Collect 3 Healing Herbs" },
    { "id": "return_to_mira", "text": "Return to Mira" }
  ]
}
```

### Step B: Register the quest

Update `data/SmartEventDirector/index.json`:

```json
{
  "schema": "SED_INDEX_1",
  "scenes": [
    "hello_world.json"
  ],
  "quests": [
    "my_first_quest.json"
  ]
}
```

### Step C: Add quest steps to the scene

Update `hello_world.json`:

```json
{
  "schema": "SED_SCENE_1",
  "sceneId": "hello_world",
  "title": "Hello World",
  "canSkip": true,
  "steps": [
    { "type": "lockPlayer" },
    {
      "type": "dialogue",
      "speaker": "Mira",
      "text": "I need your help."
    },
    {
      "type": "startQuest",
      "questId": "my_first_quest"
    },
    {
      "type": "dialogue",
      "speaker": "Mira",
      "text": "I've added a quest to your journal."
    },
    {
      "type": "updateObjective",
      "questId": "my_first_quest",
      "objective": "talk_to_mira",
      "completed": true
    },
    {
      "type": "dialogue",
      "speaker": "Mira",
      "text": "Go collect those herbs and come back."
    },
    { "type": "unlockPlayer" }
  ]
}
```

### Step D: Complete the quest later

Create a second scene `data/SmartEventDirector/scenes/quest_complete.json`:

```json
{
  "schema": "SED_SCENE_1",
  "sceneId": "quest_complete",
  "title": "Quest Complete",
  "canSkip": false,
  "steps": [
    { "type": "lockPlayer" },
    {
      "type": "dialogue",
      "speaker": "Mira",
      "text": "You found the herbs!"
    },
    {
      "type": "updateObjective",
      "questId": "my_first_quest",
      "objective": "collect_herbs",
      "completed": true
    },
    {
      "type": "updateObjective",
      "questId": "my_first_quest",
      "objective": "return_to_mira",
      "completed": true
    },
    {
      "type": "completeQuest",
      "questId": "my_first_quest"
    },
    {
      "type": "questReward",
      "questId": "my_first_quest",
      "gold": 100,
      "exp": 50,
      "items": [
        { "id": 1, "quantity": 3 }
      ]
    },
    {
      "type": "dialogue",
      "speaker": "Mira",
      "text": "Here is your reward!"
    },
    { "type": "unlockPlayer" }
  ]
}
```

Add `"quest_complete.json"` to the `scenes` array in `index.json`.

### Step E: Check the quest log

SED automatically shows a **quest toast** when a quest starts or completes.

To open the full **Quest Log** in-game:
- Use the plugin command `OpenQuestLog`.
- Or call it from a Script command:

```js
SED.QuestLog.open();
```

The quest tracker HUD displays active quests and their objectives on the map screen.

---

## 7. Next Steps

- **Step Types**: See `STEP_TYPES.md` for a complete reference of every scene step.
- **Quest System**: See `QUEST_SYSTEM.md` for advanced quest features, conditions, and UI customization.
- **Tips**: Always test scenes after editing JSON. Invalid files will log errors to the console and prevent the game from booting.
