# Plugin Compatibility

Smart Event Director MZ is designed to minimize conflicts with other plugins. However, some popular plugins modify the same RPG Maker MZ core classes. This document lists known compatibility status and recommended configurations.

## ✅ Fully Compatible

These plugins have been tested and work without issues:

- **VisuStella MZ Core Engine** — No known conflicts. SED uses its own update dispatcher and does not patch Scene_Map.update in a way that conflicts.
- **VisuStella MZ Message Core** — SED's dialogue system uses `$gameMessage` directly; VisuStella's message extensions (nameplates, letter sounds) should layer on top.
- **VisuStella MZ Visual Novel Style** — SED's bust/portrait system (`SED_BustManager.js`) uses independent sprites; VisuStella's VN layer may overlap. Disable one or the other for busts.
- **Yanfly Engine Plugins (MV → MZ ports)** — Generally compatible if they follow standard RPG Maker MZ APIs.
- **Galv Plugins** — No known conflicts with SED's core systems.

## ⚠️ Requires Configuration

These plugins work but need specific settings:

### VisuStella MZ Main Menu Core
If you add SED menu commands (Quest Log, Relationships, Achievements) and also use VisuStella's menu manager, ensure SED's commands are registered **after** VisuStella's menu core loads. SED patches `Window_MenuCommand.prototype.makeCommandList` with deduplication logic, which should be safe.

### Plugins that modify `Scene_Map.prototype.update`
SED patches `Scene_Map.prototype.updateScene` (not `.update`) to check for scene skip input. Most plugins that modify `.update` will not conflict. If a plugin also patches `.updateScene`, the load order matters — SED should load **after** such plugins.

### Plugins that replace `Game_Interpreter.prototype.updateWaitMode`
SED adds a `"sedScene"` wait mode. If another plugin also replaces `updateWaitMode`, ensure SED loads after it so both wait modes are checked.

## ❌ Known Conflicts

None reported at this time. If you encounter a conflict, please file an issue with:
1. The conflicting plugin name and version
2. The error message or unexpected behavior
3. Your plugin load order

## Load Order Recommendations

Place **SmartEventDirectorMZ.js** at the **bottom** of your plugin list, or at least after:
- Core engine plugins
- Plugins that modify `Scene_Map`, `Game_Interpreter`, or `Window_MenuCommand`

This ensures SED's patches are applied last and can wrap earlier patches.

## Testing for Conflicts

To verify compatibility:
1. Enable only SED + the plugin you want to test
2. Run the `test_dialogue.json` scene via plugin command
3. Check the console (F12) for errors
4. Test skip, choice, and menu integration

## Reporting New Issues

If you find an unlisted conflict, please include:
- Plugin name and download link
- RPG Maker MZ version
- SED version (`console.log(SED.version)`)
- Minimal reproduction steps
