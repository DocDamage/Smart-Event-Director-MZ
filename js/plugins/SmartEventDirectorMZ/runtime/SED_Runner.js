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
    _transferResumeData: null,

    // v0.2: scene queue
    _pendingQueue: [],

    isBusy() {
      return this._state === "running" || this._state === "starting";
    },

    hasPending() {
      return this._pendingQueue.length > 0;
    },

    getState() {
      if (!this.isBusy()) return null;
      return {
        sceneId: this._scene.sceneId,
        queueIndex: this._queue.currentIndex(),
        contextLocals: SED.Util.cloneJson(this._context.local || {}),
        activeStepType: this._activeStep ? this._activeStep.type : null,
        activeStepData: this._activeStep ? SED.Util.cloneJson(this._activeStep) : null,
        runtimeData: this._activeRuntime ? SED.Util.cloneJson(this._activeRuntime) : null
      };
    },

    getSceneStats() {
      return {
        sceneId: this._scene ? this._scene.sceneId : null,
        queueIndex: this._queue ? this._queue.currentIndex() : 0,
        totalSteps: this._scene ? this._scene.steps.length : 0,
        elapsedFrames: this._scene ? Graphics.frameCount - this._context.startedFrame : 0
      };
    },

    play(sceneId, options) {
      options = options || {};

      if (this.isBusy()) {
        const allowQueue = SED.Params && SED.Params.allowSceneQueue;

        if (allowQueue) {
          this._pendingQueue.push({ sceneId: sceneId, options: options });
          SED.Logger.info("Scene queued:", sceneId);
          return true;
        }

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

      SED.Cleanup.snapshot();

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

    resume(sceneId, queueIndex) {
      if (this.isBusy()) {
        SED.Logger.warn("Cannot resume: runner is busy.");
        return false;
      }
      const success = this.play(sceneId, {});
      if (!success) return false;
      this._queue._index = Math.max(0, Math.min(queueIndex, this._scene.steps.length));
      SED.Logger.info("Resumed scene at step:", this._queue._index);
      return true;
    },

    resumeFromSave() {
      const data = SED.Save && SED.Save.getResumeData ? SED.Save.getResumeData() : null;
      if (!data) return false;
      const result = this.resume(data.sceneId, data.queueIndex || 0);
      if (result && SED.Save.clearResumeData) {
        SED.Save.clearResumeData();
      }
      return result;
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

      SED.Cleanup.restore();
      SED.Logger.info("Scene stopped:", reason);
      this._forceIdle();
    },

    // v0.2: scene skip - stop current and start next if queued, else go idle
    skip() {
      if (this._state !== "running") return;

      const scene = this._scene;

      if (scene && scene.canSkip === false) {
        SED.Logger.info("Scene skip prevented:", scene.sceneId);
        return;
      }

      SED.Logger.info("Scene skipped:", scene ? scene.sceneId : "unknown");

      if (this._activeHandler && this._activeHandler.cancel) {
        try {
          this._activeHandler.cancel(this._activeStep, this._context, this._activeRuntime);
        } catch (error) {
          SED.Logger.error("Error during step cancel:", error.message);
        }
      }

      this._forceIdle();
    },

    update() {
      // v0.2: process queued scenes after previous completes
      if (this._state !== "running") {
        if (this._pendingQueue.length > 0) {
          const next = this._pendingQueue.shift();
          this.play(next.sceneId, next.options);
        }
        return;
      }

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

      SED.Cleanup.restore();

      if (SED.Failsafe) {
        SED.Failsafe.recover(error.message);
      } else {
        this._forceIdle();
      }
    },

    _forceIdle() {
      SED.Cleanup.clear();

      this._state = "idle";
      this._scene = null;
      this._queue = null;
      this._context = null;
      this._activeStep = null;
      this._activeHandler = null;
      this._activeRuntime = null;
      this._sceneTimeoutFrame = 0;
      this._transferResumeData = null;
    },

    _onTransferReserved(mapId, x, y, d, fadeType) {
      SED.Logger.info("Map transfer reserved during scene:", this._scene.sceneId, "-> map", mapId);
      this._transferResumeData = {
        sceneId: this._scene.sceneId,
        queueIndex: this._queue.currentIndex(),
        contextLocals: SED.Util.cloneJson(this._context.local || {})
      };
    }
  };

  const _Game_Player_reserveTransfer = Game_Player.prototype.reserveTransfer;
  Game_Player.prototype.reserveTransfer = function(mapId, x, y, d, fadeType) {
    _Game_Player_reserveTransfer.apply(this, arguments);
    if (SED.Runner && SED.Runner.isBusy()) {
      SED.Runner._onTransferReserved(mapId, x, y, d, fadeType);
    }
  };

  const _Scene_Map_onTransferEnd = Scene_Map.prototype.onTransferEnd;
  Scene_Map.prototype.onTransferEnd = function() {
    _Scene_Map_onTransferEnd.apply(this, arguments);
    if (SED.Runner && SED.Runner._transferResumeData) {
      const data = SED.Runner._transferResumeData;
      SED.Runner._transferResumeData = null;
      SED.Runner.resume(data.sceneId, data.queueIndex);
      if (SED.Runner._context && data.contextLocals) {
        for (const key in data.contextLocals) {
          SED.Runner._context.setLocal(key, data.contextLocals[key]);
        }
      }
    }
  };

  SED.Runner = Runner;
  SED.registerModule("Runner", "0.4.0");
})();
