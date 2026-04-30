# Smart Event Director MZ — JavaScript API Reference

This document is intended for developers who want to interact with SED from other plugins or script calls.

---

## Namespace

All public APIs live under the global namespace:

```js
window.SED
```

---

## Version

```js
SED.version  // => string (e.g. "0.4.0")
```

---

## Modules

```js
SED.modules  // => { "ModuleName": "version", ... }
```

Each registered module appears here. Use it to verify that a specific subsystem is loaded.

---

## Core APIs

### `SED.Params`

Parsed plugin parameters. Key fields:

| Property | Type | Description |
|----------|------|-------------|
| `debug` | `boolean` | Enables debug logging and overlays. |
| `dataIndexPath` | `string` | Path to `index.json` (default: `data/SmartEventDirector/index.json`). |
| `defaultSceneTimeout` | `number` | Frame limit for scenes when `timeoutFrames` is omitted. |
| `allowSceneQueue` | `boolean` | Allows queuing a new scene while one is running. |
| `enableDebugOverlay` | `boolean` | Toggles the in-game debug overlay. |
| `enableQuestLog` | `boolean` | Enables the quest log scene. |
| `enableRelationshipViewer` | `boolean` | Enables the relationship viewer scene. |
| `dialogueLogKeyName` | `string` | Input key that opens the dialogue log. |
| `hotReload` | `boolean` | Enables the hot-reload file watcher. |

### `SED.Logger`

```js
SED.Logger.info(...args)   // info message
SED.Logger.warn(...args)   // warning
SED.Logger.error(...args)  // error
SED.Logger.debug(...args)  // debug (only when Params.debug is true)
```

`SED.Logger.history` is an array of the last 100 log entries (`{ level, frame, message }`).

### `SED.Util`

```js
SED.Util.toBool(value, fallback)           // => boolean
SED.Util.toNumber(value, fallback)         // => number
SED.Util.characterFromId(id, interpreter)  // => Game_Character | null
SED.Util.directionFromText(text)           // => number (2/4/6/8 or 0)
SED.Util.cloneJson(value)                  // => deep clone
SED.Util.interpolateText(text)             // => string (replaces \v[n], \n[n], \p[n])
```

---

## Data APIs

### `SED.SceneRegistry`

```js
SED.SceneRegistry.register(scene)   // scene must have a string sceneId
SED.SceneRegistry.get(sceneId)      // => object | null
SED.SceneRegistry.has(sceneId)      // => boolean
SED.SceneRegistry.list()            // => string[]
SED.SceneRegistry.clear()           // removes all scenes
SED.SceneRegistry.reload(scene)     // unregister old, register new
```

### `SED.QuestRegistry`

```js
SED.QuestRegistry.register(quest)   // quest must have a string questId
SED.QuestRegistry.get(questId)      // => object | null
SED.QuestRegistry.has(questId)      // => boolean
SED.QuestRegistry.list()            // => string[]
SED.QuestRegistry.clear()           // removes all quests
SED.QuestRegistry.reload(quest)     // unregister old, register new
```

### `SED.SceneValidator`

```js
SED.SceneValidator.validateScene(scene)  // => string[]
```

Returns an array of human-readable error messages. An empty array means the scene is valid.

### `SED.DataLoader`

```js
SED.DataLoader.loadJson(path)        // => Promise<object>
SED.DataLoader.loadAll()             // => Promise<void>  (loads index, scenes, quests)
SED.DataLoader.reloadScene(file)     // => Promise<object>
SED.DataLoader.reloadAll()           // => Promise<void>  (hot-reload everything)
```

---

## Runtime APIs

### `SED.Runner`

```js
SED.Runner.play(sceneId, options)     // => boolean
SED.Runner.stop(reason)
SED.Runner.skip()
SED.Runner.isBusy()                   // => boolean
SED.Runner.resume(sceneId, queueIndex) // => boolean
SED.Runner.resumeFromSave()           // => boolean
SED.Runner.getState()                 // => object | null
SED.Runner.getSceneStats()            // => { sceneId, queueIndex, totalSteps, elapsedFrames }
```

- `play` validates the scene, takes a cleanup snapshot, and begins execution.
- `options` may contain `interpreter` (the calling event interpreter) and `callerEventId`.
- If `allowSceneQueue` is enabled and a scene is already running, `play` queues the request and returns `true`.

### `SED.StepRegistry`

```js
SED.StepRegistry.register(handler)
SED.StepRegistry.get(type)       // => handler | null
SED.StepRegistry.has(type)       // => boolean
SED.StepRegistry.listTypes()     // => string[]
```

A handler must provide:

- `types: string[]`
- `start(step, context, runtime)`
- `update(step, context, runtime) → boolean` (`true` when finished)
- Optional: `validate(step) → string[]`
- Optional: `cancel(step, context, runtime)`

### `SED.StepQueue`

```js
const queue = new SED.StepQueue(steps);
queue.currentIndex()   // => number
queue.next()           // => step | null
queue.jumpTo(label)    // moves index to the step after the label
queue.isComplete()     // => boolean
```

### `SED.StepContext`

```js
const context = new SED.StepContext(scene, options);
context.scene           // the scene object
context.sceneId         // string
context.interpreter     // Game_Interpreter | null
context.callerEventId   // number
context.startedFrame    // number
context.local           // plain object for temporary data

context.jump(label)     // request a jump to label
context.stop()          // request early scene stop
context.setLocal(key, value)
context.getLocal(key)   // => any
```

### `SED.Locks`

```js
SED.Locks.lockPlayer()
SED.Locks.unlockPlayer()
SED.Locks.forceUnlockAll()
SED.Locks.isPlayerLocked()  // => boolean
```

Locks are reference-counted. `lockPlayer` increments; `unlockPlayer` decrements. `forceUnlockAll` resets the counter to zero.

### `SED.Save`

Persistent, save-compatible storage.

```js
SED.Save.markPlayed(sceneId)
SED.Save.markCompleted(sceneId)
SED.Save.getPlayed(sceneId)      // => boolean
SED.Save.getCompleted(sceneId)   // => boolean
SED.Save.setChoice(key, value)
SED.Save.getChoice(key)          // => object | undefined
```

### `SED.Failsafe`

```js
SED.Failsafe.recover(reason)
```

Performs emergency cleanup: restores audio/pictures, unlocks the player, forces the runner idle, and clears transfer resume data.

### `SED.Cleanup`

```js
SED.Cleanup.snapshot()   // saves BGM/BGS and picture states
SED.Cleanup.restore()    // restores saved states and stops ME
SED.Cleanup.clear()      // discards the snapshot
```

### `SED.Profiler`

```js
SED.Profiler.getFrameStats()   // => { current, average, max } (ms)
SED.Profiler.getStepStats()    // => { stepType: averageMs, ... }
SED.Profiler.getSceneStats()   // => { sceneId, duration, stepsRun }
SED.Profiler.reset()
SED.Profiler.isEnabled()       // => boolean
SED.Profiler.setEnabled(value)
```

Profiling is disabled by default unless `SED.Params.debug` is true.

### `SED.HotReload`

```js
SED.HotReload.trigger()
```

Clears registries and reloads all data from disk. No-op unless `debug` and `hotReload` parameters are enabled.

### `SED.InputBuffer`

```js
SED.InputBuffer.flagOk()      // flags that OK was pressed during a scene
SED.InputBuffer.consumeOk()   // => boolean (true once if flagged)
SED.InputBuffer.clear()
```

Used internally to forward OK input into choice windows while a scene is running.

### `SED.TextEffects`

```js
SED.TextEffects.setSpeed(frames)
SED.TextEffects.getSpeed()          // => number
SED.TextEffects.setAutoAdvance(frames)
SED.TextEffects.getAutoAdvance()    // => number
SED.TextEffects.pushOverride(speed, autoAdvance)
SED.TextEffects.clearOverride()
```

Controls character-by-character text speed and auto-advance timing for dialogue steps.

---

## UI APIs

### `SED.DebugOverlay`

```js
SED.DebugOverlay.toggle()   // show/hide the debug overlay
```

Also exposes `show()`, `hide()`, `update()`, and `draw()`.

### `SED.DialogueLog`

```js
SED.DialogueLog.addEntry({ speaker, text, faceName, faceIndex })
SED.DialogueLog.clear()
SED.DialogueLog.getEntries()     // => array
SED.DialogueLog.toggle()
SED.DialogueLog.setVisible(bool)
SED.DialogueLog.isVisible()      // => boolean
```

### `SED.QuestToast` (internal)

On-screen toast notifications for quest events. Not intended for direct external use.

### `SED.QuestTracker` (internal)

Active-quest tracker window. Not intended for direct external use.

### `SED.QuestLog`

```js
SED.QuestLog.open()   // pushes the quest log scene
```

### `SED.RelationshipViewer`

```js
SED.RelationshipViewer.open()   // pushes the relationship viewer scene
```

---

## Plugin Commands

From script, call SED plugin commands via `PluginManager.callCommand`:

```js
PluginManager.callCommand("SmartEventDirectorMZ", "PlayScene", { sceneId: "my_scene", wait: true });
PluginManager.callCommand("SmartEventDirectorMZ", "StopScene", {});
PluginManager.callCommand("SmartEventDirectorMZ", "SkipScene", {});
PluginManager.callCommand("SmartEventDirectorMZ", "Recover", {});
PluginManager.callCommand("SmartEventDirectorMZ", "ToggleDebugOverlay", {});
PluginManager.callCommand("SmartEventDirectorMZ", "OpenQuestLog", {});
PluginManager.callCommand("SmartEventDirectorMZ", "OpenRelationshipViewer", {});
PluginManager.callCommand("SmartEventDirectorMZ", "ReloadData", {});
```

---

## Script Step

Use the `script` step type to run arbitrary JavaScript inside a scene:

```json
{
  "type": "script",
  "code": "$gameVariables.setValue(10, 42);",
  "wait": true
}
```

The code executes in the global scope with full access to RPG Maker MZ globals such as `$gameVariables`, `$gameSwitches`, `$gamePlayer`, `$gameMap`, `$gameParty`, and `SED`.

---

## Event Safety

SED handles several common edge cases automatically:

- **Map transfer during a scene** — The runner captures resume data and automatically resumes the scene after the transfer completes.
- **Player lock leaks** — `SED.Cleanup.restore()` and `SED.Failsafe.recover()` both reset player locks via `forceUnlockAll()`.
- **Scene timeout** — Each scene has a `timeoutFrames` limit; if exceeded, the runner throws an error and triggers failsafe recovery.
- **Missing step handlers** — Unknown step types are caught at validation time, before the scene starts.
- **Audio & picture state** — `snapshot()` / `restore()` ensures BGM/BGS and pictures are returned to their pre-scene states on stop or failure.
- **Duplicate scene start** — If a scene is already running, `play()` returns `false` (or queues the scene if `allowSceneQueue` is enabled).
- **Invalid JSON / missing files** — `DataLoader` catches load and parse errors and reports them via `SED.Logger.error`.
