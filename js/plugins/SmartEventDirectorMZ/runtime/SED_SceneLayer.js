(() => {
  "use strict";

  const SED = window.SED;

  function SceneLayer(layerId, priority) {
    this.layerId = layerId;
    this.priority = priority;
    this._state = "idle";
    this._scene = null;
    this._queue = null;
    this._context = null;
    this._activeStep = null;
    this._activeHandler = null;
    this._activeRuntime = null;
    this._sceneTimeoutFrame = 0;
  }

  SceneLayer.prototype.isBusy = function() {
    return this._state === "running";
  };

  SceneLayer.prototype.play = function(sceneId) {
    if (this.isBusy()) return false;
    const scene = SED.SceneRegistry.get(sceneId);
    if (!scene) return false;
    const errors = SED.SceneValidator.validateScene(scene);
    if (errors.length > 0) return false;

    this._state = "running";
    this._scene = SED.Util.cloneJson(scene);
    this._queue = new SED.StepQueue(this._scene.steps);
    this._context = new SED.StepContext(this._scene, {});
    this._activeStep = null;
    this._activeHandler = null;
    this._activeRuntime = null;
    this._sceneTimeoutFrame = Graphics.frameCount + Number(scene.timeoutFrames || SED.Params.defaultSceneTimeout || 3600);
    return true;
  };

  SceneLayer.prototype.stop = function() {
    if (this._activeHandler && this._activeHandler.cancel) {
      try { this._activeHandler.cancel(this._activeStep, this._context, this._activeRuntime); } catch (e) {}
    }
    this._forceIdle();
  };

  SceneLayer.prototype.update = function() {
    if (this._state !== "running") return;
    try {
      if (Graphics.frameCount > this._sceneTimeoutFrame) {
        SED.Logger.warn("Layer timeout:", this._scene.sceneId);
        this.stop();
        return;
      }
      if (!this._activeStep) this._startNextStep();
      if (!this._activeStep) { this._completeScene(); return; }
      const done = this._activeHandler.update(this._activeStep, this._context, this._activeRuntime);
      if (done) this._finishActiveStep();
    } catch (error) {
      SED.Logger.error("Layer failed:", error.message);
      this.stop();
    }
  };

  SceneLayer.prototype._startNextStep = function() {
    const step = this._queue.next();
    if (!step) { this._activeStep = null; return; }
    const handler = SED.StepRegistry.get(step.type);
    if (!handler) { throw new Error("No handler for: " + step.type); }
    const interpolated = SED.Util.interpolateDeep(step);
    const runtime = { startedFrame: Graphics.frameCount };
    this._activeStep = interpolated;
    this._activeHandler = handler;
    this._activeRuntime = runtime;
    handler.start(interpolated, this._context, runtime);
  };

  SceneLayer.prototype._finishActiveStep = function() {
    if (this._context.requestedStop) { this._completeScene(); return; }
    if (this._context.requestedJump) { this._queue.jumpTo(this._context.requestedJump); this._context.requestedJump = null; }
    this._activeStep = null;
    this._activeHandler = null;
    this._activeRuntime = null;
  };

  SceneLayer.prototype._completeScene = function() {
    SED.Logger.info("Layer scene completed:", this._scene ? this._scene.sceneId : "unknown");
    this._forceIdle();
  };

  SceneLayer.prototype._forceIdle = function() {
    this._state = "idle";
    this._scene = null;
    this._queue = null;
    this._context = null;
    this._activeStep = null;
    this._activeHandler = null;
    this._activeRuntime = null;
    this._sceneTimeoutFrame = 0;
  };

  const LayerManager = {
    _layers: [],
    _nextId: 1,

    play(sceneId, options) {
      options = options || {};
      const priority = Number(options.priority || 0);
      const layer = new SceneLayer("layer_" + this._nextId++, priority);
      const success = layer.play(sceneId);
      if (!success) return null;
      this._layers.push(layer);
      this._layers.sort((a, b) => a.priority - b.priority);
      SED.Logger.info("Layer started:", sceneId, "priority:", priority);
      return layer.layerId;
    },

    stop(layerId) {
      const idx = this._layers.findIndex(l => l.layerId === layerId);
      if (idx >= 0) {
        this._layers[idx].stop();
        this._layers.splice(idx, 1);
      }
    },

    stopAll() {
      for (const layer of this._layers) layer.stop();
      this._layers = [];
    },

    update() {
      for (const layer of this._layers) layer.update();
    },

    isBusy() {
      return this._layers.some(l => l.isBusy());
    },

    list() {
      return this._layers.map(l => ({ layerId: l.layerId, sceneId: l._scene ? l._scene.sceneId : null, priority: l.priority }));
    }
  };

  // Auto-stop all layers on map transfer or battle start
  const _Game_Player_reserveTransfer = Game_Player.prototype.reserveTransfer;
  Game_Player.prototype.reserveTransfer = function(mapId, x, y, d, fadeType) {
    _Game_Player_reserveTransfer.apply(this, arguments);
    if (SED.LayerManager) SED.LayerManager.stopAll();
  };

  const _Scene_Battle_start = Scene_Battle.prototype.start;
  Scene_Battle.prototype.start = function() {
    _Scene_Battle_start.apply(this, arguments);
    if (SED.LayerManager) SED.LayerManager.stopAll();
  };

  SED.SceneLayer = SceneLayer;
  SED.LayerManager = LayerManager;
  SED.registerModule("SceneLayer", "1.2.1");
})();
