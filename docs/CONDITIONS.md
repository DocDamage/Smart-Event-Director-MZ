# Smart Event Director MZ — Condition Operator Reference

Reference for the `condition` step type. Each condition evaluates a single operator and optionally branches to a label.

---

## Table of Contents

- [Jump Behavior](#jump-behavior)
- [Operators](#operators)
  - [switchIs](#switchis)
  - [variableIs](#variableis)
  - [variableGte](#variablegte)
  - [variableLte](#variablelte)
  - [choiceIs](#choiceis)
  - [scenePlayed](#sceneplayed)
  - [sceneCompleted](#scenecompleted)
  - [hasItem](#hasitem)
  - [goldGte](#goldgte)
  - [questActive](#questactive)
  - [questCompleted](#questcompleted)
  - [questFailed](#questfailed)
  - [questObjectiveDone](#questobjectivedone)
  - [relationshipGte](#relationshipgte)
  - [relationshipLte](#relationshiplte)
  - [relationshipIs](#relationshipis)
- [Chained Conditions](#chained-conditions)

---

## Jump Behavior

A `condition` step has three optional jump fields:

| Field | Purpose |
|---|---|
| `jumpTrue` | Label to jump to when the condition evaluates to **true**. |
| `jumpFalse` | Label to jump to when the condition evaluates to **false**. |
| `elseJump` | Alias for `jumpFalse`. If both are present, `jumpFalse` takes precedence. |

If the matching jump field is omitted, the runner simply continues to the next step. This lets you use conditions either as branches or as silent gate checks.

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

---

## Operators

### `switchIs`

Checks whether a game switch equals the target value.

**Required fields**

| Field | Type | Description |
|---|---|---|
| `operator` | string | `"switchIs"` |
| `switchId` | number | Switch ID (must be > 0). |
| `value` | boolean | Target value. Defaults to `true` if omitted. |

**Example**

```json
{
  "type": "condition",
  "operator": "switchIs",
  "switchId": 21,
  "value": true,
  "jumpTrue": "switch_on",
  "elseJump": "switch_off"
}
```

---

### `variableIs`

Checks whether a game variable exactly equals a target number.

**Required fields**

| Field | Type | Description |
|---|---|---|
| `operator` | string | `"variableIs"` |
| `variableId` | number | Variable ID (must be > 0). |
| `value` | number | Target value. |

**Example**

```json
{
  "type": "condition",
  "operator": "variableIs",
  "variableId": 10,
  "value": 3,
  "jumpTrue": "exact_match",
  "jumpFalse": "no_match"
}
```

---

### `variableGte`

Checks whether a game variable is greater than or equal to a target number.

**Required fields**

| Field | Type | Description |
|---|---|---|
| `operator` | string | `"variableGte"` |
| `variableId` | number | Variable ID (must be > 0). |
| `value` | number | Target value. |

**Example**

```json
{
  "type": "condition",
  "operator": "variableGte",
  "variableId": 12,
  "value": 5,
  "jumpTrue": "enough_points",
  "elseJump": "need_more"
}
```

---

### `variableLte`

Checks whether a game variable is less than or equal to a target number.

**Required fields**

| Field | Type | Description |
|---|---|---|
| `operator` | string | `"variableLte"` |
| `variableId` | number | Variable ID (must be > 0). |
| `value` | number | Target value. |

**Example**

```json
{
  "type": "condition",
  "operator": "variableLte",
  "variableId": 12,
  "value": 2,
  "jumpTrue": "low_value",
  "elseJump": "high_value"
}
```

---

### `choiceIs`

Checks whether a remembered choice matches a specific option index.

**Required fields**

| Field | Type | Description |
|---|---|---|
| `operator` | string | `"choiceIs"` |
| `choiceKey` | string | The `key` used in the original `choice` step. |
| `choiceIndex` | number | Zero-based option index to match. |

**Example**

```json
{
  "type": "condition",
  "operator": "choiceIs",
  "choiceKey": "mira_intro_response",
  "choiceIndex": 0,
  "jumpTrue": "friendly_branch",
  "elseJump": "other_branch"
}
```

**Notes**
- Returns `false` if no choice has been recorded under the given key.

---

### `scenePlayed`

Checks whether a specific scene has ever been started.

**Required fields**

| Field | Type | Description |
|---|---|---|
| `operator` | string | `"scenePlayed"` |
| `sceneId` | string | Scene ID to check. |

**Example**

```json
{
  "type": "condition",
  "operator": "scenePlayed",
  "sceneId": "opening_cutscene",
  "jumpTrue": "skip_intro",
  "elseJump": "play_intro"
}
```

---

### `sceneCompleted`

Checks whether a specific scene has been played all the way to the end.

**Required fields**

| Field | Type | Description |
|---|---|---|
| `operator` | string | `"sceneCompleted"` |
| `sceneId` | string | Scene ID to check. |

**Example**

```json
{
  "type": "condition",
  "operator": "sceneCompleted",
  "sceneId": "tutorial_scene",
  "jumpTrue": "already_taught",
  "elseJump": "teach_now"
}
```

---

### `hasItem`

Checks whether the party possesses at least one of a specific item.

**Required fields**

| Field | Type | Description |
|---|---|---|
| `operator` | string | `"hasItem"` |
| `itemId` | number | Database item ID. |

**Example**

```json
{
  "type": "condition",
  "operator": "hasItem",
  "itemId": 5,
  "jumpTrue": "has_key",
  "elseJump": "no_key"
}
```

---

### `goldGte`

Checks whether the party's gold is greater than or equal to a target amount.

**Required fields**

| Field | Type | Description |
|---|---|---|
| `operator` | string | `"goldGte"` |
| `value` | number | Gold threshold. |

**Example**

```json
{
  "type": "condition",
  "operator": "goldGte",
  "value": 100,
  "jumpTrue": "can_afford",
  "elseJump": "too_poor"
}
```

---

### `questActive`

Checks whether a quest is currently active.

**Required fields**

| Field | Type | Description |
|---|---|---|
| `operator` | string | `"questActive"` |
| `questId` | string | Quest ID. |

**Example**

```json
{
  "type": "condition",
  "operator": "questActive",
  "questId": "tutorial_quest",
  "jumpTrue": "quest_in_progress",
  "elseJump": "no_quest"
}
```

---

### `questCompleted`

Checks whether a quest has been completed.

**Required fields**

| Field | Type | Description |
|---|---|---|
| `operator` | string | `"questCompleted"` |
| `questId` | string | Quest ID. |

**Example**

```json
{
  "type": "condition",
  "operator": "questCompleted",
  "questId": "tutorial_quest",
  "jumpTrue": "quest_done",
  "elseJump": "quest_pending"
}
```

---

### `questFailed`

Checks whether a quest has been failed.

**Required fields**

| Field | Type | Description |
|---|---|---|
| `operator` | string | `"questFailed"` |
| `questId` | string | Quest ID. |

**Example**

```json
{
  "type": "condition",
  "operator": "questFailed",
  "questId": "tutorial_quest",
  "jumpTrue": "quest_failed",
  "elseJump": "not_failed"
}
```

---

### `questObjectiveDone`

Checks whether a specific objective within a quest is marked complete.

**Required fields**

| Field | Type | Description |
|---|---|---|
| `operator` | string | `"questObjectiveDone"` |
| `questId` | string | Quest ID. |
| `objective` | string | Objective key. |

**Example**

```json
{
  "type": "condition",
  "operator": "questObjectiveDone",
  "questId": "tutorial_quest",
  "objective": "collect_herbs",
  "jumpTrue": "herbs_collected",
  "elseJump": "herbs_missing"
}
```

**Notes**
- Returns `false` if the quest does not exist or the objective has never been updated.

---

### `relationshipGte`

Checks whether a character's relationship points are greater than or equal to a value.

**Required fields**

| Field | Type | Description |
|---|---|---|
| `operator` | string | `"relationshipGte"` |
| `target` | string | Character name or ID. |
| `value` | number | Point threshold. |

**Example**

```json
{
  "type": "condition",
  "operator": "relationshipGte",
  "target": "Mira",
  "value": 5,
  "jumpTrue": "high_affection",
  "elseJump": "neutral"
}
```

---

### `relationshipLte`

Checks whether a character's relationship points are less than or equal to a value.

**Required fields**

| Field | Type | Description |
|---|---|---|
| `operator` | string | `"relationshipLte"` |
| `target` | string | Character name or ID. |
| `value` | number | Point threshold. |

**Example**

```json
{
  "type": "condition",
  "operator": "relationshipLte",
  "target": "Mira",
  "value": -5,
  "jumpTrue": "hostile",
  "elseJump": "okay"
}
```

---

### `relationshipIs`

Checks whether a character's relationship points exactly equal a value.

**Required fields**

| Field | Type | Description |
|---|---|---|
| `operator` | string | `"relationshipIs"` |
| `target` | string | Character name or ID. |
| `value` | number | Exact point value. |

**Example**

```json
{
  "type": "condition",
  "operator": "relationshipIs",
  "target": "Mira",
  "value": 0,
  "jumpTrue": "stranger",
  "elseJump": "acquainted"
}
```

---

## Chained Conditions

Conditions can be chained by placing multiple `condition` steps back-to-back, using `jumpFalse` to fall through to the next check.

```json
{
  "schema": "SED_SCENE_1",
  "sceneId": "test_condition_chain",
  "title": "Test Condition Chain",
  "canSkip": true,
  "timeoutFrames": 600,
  "steps": [
    {
      "type": "condition",
      "operator": "scenePlayed",
      "sceneId": "test_choice",
      "jumpTrue": "played_choice",
      "jumpFalse": "check_gold"
    },
    { "type": "label", "name": "check_gold" },
    {
      "type": "condition",
      "operator": "goldGte",
      "value": 100,
      "jumpTrue": "rich",
      "jumpFalse": "poor"
    },
    { "type": "label", "name": "rich" },
    { "type": "dialogue", "text": "You have at least 100 gold!" },
    { "type": "jump", "label": "end" },
    { "type": "label", "name": "poor" },
    { "type": "dialogue", "text": "You have less than 100 gold." },
    { "type": "jump", "label": "end" },
    { "type": "label", "name": "played_choice" },
    { "type": "dialogue", "text": "You already played the choice test scene!" },
    { "type": "label", "name": "end" }
  ]
}
```

In this example:
1. If `test_choice` was played, jump to `played_choice`.
2. Otherwise, fall through to `check_gold` and test the party's wealth.
3. Each branch eventually converges on the `end` label via `jump`.
