/*:
 * @target MZ
 * @plugindesc v1.2 Smart Event Director MZ - modular cutscene/story runner.
 * @author Smart Event Director MZ
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
 * @param Enable Scene Skip
 * @type boolean
 * @default true
 *
 * @param Scene Skip Key
 * @type number
 * @default 27
 * @desc Key code for skipping scenes (27 = Escape, 192 = Tilde/~)
 *
 * @param Enable Debug Overlay
 * @type boolean
 * @default false
 *
 * @param Allow Scene Queue
 * @type boolean
 * @default false
 *
 * @param Default Can Skip
 * @type boolean
 * @default true
 *
 * @param Enable Quest Log
 * @type boolean
 * @default true
 * @desc Adds a Quest Log command to the main menu.
 *
 * @param Enable Relationship Viewer
 * @type boolean
 * @default false
 * @desc Adds a Relationships command to the main menu.
 *
 * @param Enable Achievement Viewer
 * @type boolean
 * @default false
 * @desc Adds an Achievements command to the main menu.
 *
 * @param Quest Toast Position
 * @type string
 * @default topRight
 * @desc Toast position: topLeft, topRight, bottomLeft, bottomRight, center
 *
 * @param Quest Toast Duration
 * @type number
 * @default 180
 * @desc Frames the toast stays visible (60fps)
 *
 * @param Quest Toast Animation
 * @type string
 * @default slide
 * @desc Animation type: slide, fade, none
 *
 * @param Quest Toast Sound
 * @type string
 * @default
 * @desc SE filename to play on toast (leave empty for none)
 *
 * @param Scene Skip Key Name
 * @type string
 * @default cancel
 * @desc RPG Maker key name for skipping scenes (cancel, escape, shift, control)
 *
 * @param Dialogue Log Key Name
 * @type string
 * @default pageup
 * @desc RPG Maker key name for toggling dialogue log (pageup, pagedown, shift)
 *
 * @param Enable Hot Reload
 * @type boolean
 * @default false
 * @desc Allow reloading JSON data at runtime via ReloadData plugin command.
 *
 * @param Locale
 * @type string
 * @default en
 * @desc Active locale for string tables (e.g., en, es, jp). Requires localeFiles in index.json.
 *
 * @command PlayScene
 * @text Play Scene
 * @arg sceneId
 * @type string
 * @text Scene ID
 * @arg wait
 * @type boolean
 * @default true
 * @text Wait For Completion
 *
 * @command StopScene
 * @text Stop Current Scene
 *
 * @command SkipScene
 * @text Skip Current Scene
 *
 * @command RecoverScene
 * @text Force Scene Recovery
 *
 * @command ToggleDebug
 * @text Toggle Debug Overlay
 *
 * @command SetRelationship
 * @text Set Relationship Points
 * @arg target
 * @type string
 * @text Target Character
 * @arg value
 * @type number
 * @default 0
 * @text Points
 *
 * @command AddRelationship
 * @text Add Relationship Points
 * @arg target
 * @type string
 * @text Target Character
 * @arg value
 * @type number
 * @default 1
 * @text Points to Add
 *
 * @command StartQuest
 * @text Start Quest
 * @arg questId
 * @type string
 * @text Quest ID
 *
 * @command CompleteQuest
 * @text Complete Quest
 * @arg questId
 * @type string
 * @text Quest ID
 *
 * @command FailQuest
 * @text Fail Quest
 * @arg questId
 * @type string
 * @text Quest ID
 *
 * @command UpdateObjective
 * @text Update Objective
 * @arg questId
 * @type string
 * @text Quest ID
 * @arg objective
 * @type string
 * @text Objective Key
 * @arg completed
 * @type boolean
 * @default true
 * @text Completed
 *
 * @command OpenQuestLog
 * @text Open Quest Log
 *
 * @command OpenRelationshipViewer
 * @text Open Relationship Viewer
 *
 * @command UnlockAchievement
 * @text Unlock Achievement
 * @arg achievementId
 * @type string
 * @text Achievement ID
 *
 * @command OpenAchievementViewer
 * @text Open Achievement Viewer
 *
 * @command RetryCheckpoint
 * @text Retry Last Checkpoint
 *
 * @command RetryCheckpointId
 * @text Retry Checkpoint by ID
 * @arg id
 * @type string
 * @text Checkpoint ID
 *
 * @help
 * ============================================================
 * Smart Event Director MZ - v1.2.0
 * ============================================================
 * Modular cutscene/story runner via JSON scene files.
 *
 * Quick Setup:
 *  1. Create data/SmartEventDirector/
 *  2. Create index.json with schema SED_INDEX_1
 *  3. Put scene/quest JSON files in subfolders
 *
 * Plugin Commands:
 *  PlayScene, StopScene, SkipScene, RecoverScene, ToggleDebug
 *  SetRelationship, AddRelationship, StartQuest, CompleteQuest
 *  FailQuest, UpdateObjective, OpenQuestLog, OpenRelationshipViewer
 *  UnlockAchievement, OpenAchievementViewer
 *  RetryCheckpoint, RetryCheckpointId, ReloadData
 *
 * Step Types:
 *  Core: dialogue, narration, choice, wait, switch, variable
 *  Movement: moveOneTile, moveTo, moveRoute, lockPlayer, unlockPlayer
 *  Flow: label, jump, loop, endLoop, condition, script, comment
 *  Scene: callScene, return, checkpoint, preload
 *  Visual: fade, fadeIn, fadeOut, picture, camera, weather, transition, titleCard
 *  Audio: audio | Quest: startQuest, updateObjective, completeQuest, failQuest, questReward
 *  Relationship: relationship | Achievement: unlockAchievement | System: commonEvent, selfSwitch
 *
 * Notes:
 *  - Use \v[n], \n[n], \p[n] for variable/actor/party interpolation
 *  - Use \t[key] for locale string resolution
 *  - Scenes default to map context; set "context":"battle" for battle scenes
 *  - See docs/ for full STEP_TYPES.md, CONDITIONS.md, and API_REFERENCE.md
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
    "core/SED_Locale.js",
    "core/SED_ModuleLoader.js",

    "runtime/SED_StepRegistry.js",

    "data/SED_SceneRegistry.js",
    "data/SED_SceneValidator.js",
    "data/SED_DataLoader.js",

    "runtime/SED_StepQueue.js",
    "runtime/SED_StepContext.js",
    "runtime/SED_Locks.js",
    "runtime/SED_Save.js",
    "runtime/SED_Cleanup.js",
    "runtime/SED_Failsafe.js",
    "runtime/SED_DebugOverlay.js",
    "runtime/SED_DialogueLog.js",
    "runtime/SED_TextEffects.js",
    "runtime/SED_Tween.js",
    "runtime/SED_ThemeManager.js",
    "runtime/SED_ScreenEffects.js",
    "runtime/SED_InputBuffer.js",
    "runtime/SED_Runner.js",
    "runtime/SED_Triggers.js",
    "runtime/SED_Profiler.js",

    "steps/SED_Step_LabelJump.js",
    "steps/SED_Step_Wait.js",
    "steps/SED_Step_Dialogue.js",
    "steps/SED_Step_Choice.js",
    "steps/SED_Step_SwitchVariable.js",
    "steps/SED_Step_Fade.js",
    "steps/SED_Step_Transition.js",
    "steps/SED_Step_Movement.js",
    "steps/SED_Step_Locks.js",
    "steps/SED_Step_CommonEvent.js",
    "steps/SED_Step_Condition.js",
    "steps/SED_Step_SelfSwitch.js",
    "steps/SED_Step_Audio.js",
    "steps/SED_Step_Picture.js",
    "steps/SED_Step_Camera.js",
    "steps/SED_Step_Timeline.js",
    "steps/SED_Step_Weather.js",

    "data/SED_QuestRegistry.js",
    "runtime/SED_QuestState.js",
    "runtime/SED_RelationshipState.js",
    "runtime/SED_RelationshipViewer.js",
    "steps/SED_Step_Quest.js",
    "steps/SED_Step_Relationship.js",
    "runtime/SED_QuestToast.js",
    "runtime/SED_QuestTracker.js",
    "runtime/SED_QuestLog.js",

    "data/SED_AchievementRegistry.js",
    "runtime/SED_AchievementState.js",
    "runtime/SED_AchievementToast.js",
    "runtime/SED_AchievementViewer.js",
    "steps/SED_Step_Achievement.js",

    "steps/SED_Step_Script.js",
    "steps/SED_Step_Comment.js",
    "steps/SED_Step_Loop.js",
    "steps/SED_Step_MoveRoute.js",
    "steps/SED_Step_TitleCard.js",

    "runtime/SED_HotReload.js",
    "runtime/SED_AssetLoader.js",
    "runtime/SED_Checkpoint.js",
    "runtime/SED_History.js",
    "runtime/SED_BattleIntegration.js",
    "runtime/SED_SceneLayer.js",
    "runtime/SED_PluginCommands.js",

    "steps/SED_Step_CallScene.js",
    "steps/SED_Step_Return.js",
    "steps/SED_Step_Preload.js",
    "steps/SED_Step_Checkpoint.js"
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

      if (SED.SceneRegistry && SED.Triggers) {
        for (const sceneId of SED.SceneRegistry.listIds()) {
          const scene = SED.SceneRegistry.get(sceneId);
          if (scene && scene.triggers) {
            SED.Triggers.register(sceneId, scene.triggers);
          }
        }
      }

      if (SED.Params && SED.Params.validate) {
        SED.Params.validate();
      }

      SED.ready = true;
      if (SED.Logger) SED.Logger.info("Smart Event Director ready.");
    } catch (error) {
      SED.bootError = error;
      SED.ready = true;
      console.error(error);
    }
  }

  bootSed();

  const _Scene_Boot_isReady = Scene_Boot.prototype.isReady;
  Scene_Boot.prototype.isReady = function() {
    const baseReady = _Scene_Boot_isReady.apply(this, arguments);
    return baseReady && SED.ready;
  };

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

    if (SED.Runner && SED.Runner.update) SED.Runner.update();
    if (SED.LayerManager && SED.LayerManager.update) SED.LayerManager.update();
    if (SED.Tween && SED.Tween.update) SED.Tween.update();
    if (SED.Triggers && SED.Triggers.update) SED.Triggers.update();
    if (SED.DebugOverlay && SED.DebugOverlay.update) SED.DebugOverlay.update();
    if (SED.QuestToast && SED.QuestToast.update) SED.QuestToast.update();
    if (SED.AchievementToast && SED.AchievementToast.update) SED.AchievementToast.update();
    if (SED.QuestTracker && SED.QuestTracker.update) SED.QuestTracker.update();
    if (SED.DialogueLog && SED.DialogueLog.update) SED.DialogueLog.update();
    if (SED.ScreenEffects && SED.ScreenEffects.update) SED.ScreenEffects.update();
  };

  const _Scene_Map_postUpdate = Scene_Map.prototype.postUpdate;
  Scene_Map.prototype.postUpdate = function() {
    _Scene_Map_postUpdate.apply(this, arguments);

    if (SED.DebugOverlay && SED.DebugOverlay.draw) SED.DebugOverlay.draw();
    if (SED.QuestToast && SED.QuestToast.draw) SED.QuestToast.draw();
    if (SED.AchievementToast && SED.AchievementToast.draw) SED.AchievementToast.draw();
    if (SED.QuestTracker && SED.QuestTracker.draw) SED.QuestTracker.draw();
    if (SED.DialogueLog && SED.DialogueLog.draw) SED.DialogueLog.draw();
  };

  const _Scene_Map_updateScene = Scene_Map.prototype.updateScene;
  Scene_Map.prototype.updateScene = function() {
    _Scene_Map_updateScene.apply(this, arguments);

    if (!SED.Params || !SED.Params.enableSceneSkip) return;
    if (!SED.Runner || !SED.Runner.isBusy()) return;
    if (!SED.Runner._scene) return;
    if (SED.Runner._scene.canSkip === false) return;

    const skipKey = SED.Params && SED.Params.sceneSkipKeyName ? SED.Params.sceneSkipKeyName : "cancel";
    if (Input.isTriggered(skipKey)) {
      SED.Runner.skip();
    }
  };
})();
