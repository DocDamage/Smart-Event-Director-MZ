/*:
 * @target MZ
 * @plugindesc v0.2 Smart Event Director MZ - modular cutscene/story runner.
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
 * @command SkipScene
 * @text Skip Current Scene
 *
 * @command RecoverScene
 * @text Force Scene Recovery
 *
 * @command ToggleDebug
 * @text Toggle Debug Overlay
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

    // v0.2: Debug overlay before runner
    "runtime/SED_DebugOverlay.js",

    "runtime/SED_Runner.js",

    "steps/SED_Step_LabelJump.js",
    "steps/SED_Step_Wait.js",
    "steps/SED_Step_Dialogue.js",
    "steps/SED_Step_Choice.js",
    "steps/SED_Step_SwitchVariable.js",
    "steps/SED_Step_Fade.js",
    "steps/SED_Step_Movement.js",
    "steps/SED_Step_Locks.js",

    // v0.2 steps
    "steps/SED_Step_CommonEvent.js",
    "steps/SED_Step_Condition.js",
    "steps/SED_Step_SelfSwitch.js",
    "steps/SED_Step_Audio.js",
    "steps/SED_Step_Picture.js",
    "steps/SED_Step_Camera.js"
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

  // v0.2: Skip scene plugin command
  PluginManager.registerCommand(PLUGIN_NAME, "SkipScene", function() {
    if (SED.Runner) SED.Runner.skip();
  });

  PluginManager.registerCommand(PLUGIN_NAME, "RecoverScene", function() {
    if (SED.Failsafe) SED.Failsafe.recover("pluginCommand");
  });

  // v0.2: Toggle debug overlay plugin command
  PluginManager.registerCommand(PLUGIN_NAME, "ToggleDebug", function() {
    if (SED.DebugOverlay) SED.DebugOverlay.toggle();
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

    // v0.2: Debug overlay update
    if (SED.DebugOverlay && SED.DebugOverlay.update) {
      SED.DebugOverlay.update();
    }
  };

  // v0.2: Draw debug overlay after all other rendering
  const _Scene_Map_postUpdate = Scene_Map.prototype.postUpdate;
  Scene_Map.prototype.postUpdate = function() {
    _Scene_Map_postUpdate.apply(this, arguments);

    if (SED.DebugOverlay && SED.DebugOverlay.draw) {
      SED.DebugOverlay.draw();
    }
  };

  // v0.2: Scene skip key detection
  const _Scene_Map_updateScene = Scene_Map.prototype.updateScene;
  Scene_Map.prototype.updateScene = function() {
    _Scene_Map_updateScene.apply(this, arguments);

    if (!SED.Params || !SED.Params.enableSceneSkip) return;
    if (!SED.Runner || !SED.Runner.isBusy()) return;
    if (!SED.Runner._scene) return;

    // Only skip if canSkip is not explicitly false
    if (SED.Runner._scene.canSkip === false) return;

    if (Input.isTriggered("escape") || Input.isTriggered("cancel")) {
      SED.Runner.skip();
    }
  };
})();
