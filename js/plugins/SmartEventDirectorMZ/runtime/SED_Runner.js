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

    // v1.1: call stack for sub-scenes
    _callStack: [],

    isBusy() {
      return this._state === "running" || this._state === "starting";
    },

    hasPending() {
      return this._pendingQueue.length > 0;
    },

    getState() {
      if (!this.isBusy()) return null;
      const state = {
        sceneId: this._scene.sceneId,
        queueIndex: this._queue.currentIndex(),
        contextLocals: SED.Util.cloneJson(this._context.local || {}),
        activeStepType: this._activeStep ? this._activeStep.type : null,
        activeStepData: this._activeStep ? SED.Util.cloneJson(this._activeStep) : null,
        runtimeData: this._activeRuntime ? SED.Util.cloneJson(this._activeRuntime) : null,
        callStack: this._callStack.map(entry => ({
          sceneId: entry.sceneId,
          queueIndex: entry.queue.currentIndex(),
          contextLocals: SED.Util.cloneJson(entry.context.local || {}),
          returnLabel: entry.returnLabel
        }))
      };
      if (this._queue instanceof SED.GraphQueue) {
        state.nodeId = this._queue.currentNodeId();
      }
      return state;
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

      // v1.1: battle context check
      const context = String(scene.context || "map");
      const isBattle = SceneManager._scene && SceneManager._scene.constructor === Scene_Battle;
      const isMap = SceneManager._scene && SceneManager._scene.constructor === Scene_Map;
      if (context === "battle" && !isBattle) {
        SED.Logger.warn("Scene " + sceneId + " requires battle context.");
        return false;
      }
      if (context === "map" && !isMap) {
        SED.Logger.warn("Scene " + sceneId + " requires map context.");
        return false;
      }

      SED.Cleanup.snapshot();

      this._state = "running";
      this._scene = SED.Util.cloneJson(scene);

      // v2.0: use GraphQueue for graph scenes, StepQueue for legacy linear scenes
      if (Array.isArray(this._scene.nodes) && Array.isArray(this._scene.edges)) {
        this._queue = new SED.GraphQueue(this._scene.nodes, this._scene.edges, this._scene._labels);
      } else {
        this._queue = new SED.StepQueue(this._scene.steps);
      }

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

    playIfNotBusy(sceneId) {
      if (this.isBusy()) return false;
      return this.play(sceneId, {});
    },

    resume(sceneId, queueIndex, nodeId) {
      if (this.isBusy()) {
        SED.Logger.warn("Cannot resume: runner is busy.");
        return false;
      }
      const success = this.play(sceneId, {});
      if (!success) return false;

      if (this._queue instanceof SED.GraphQueue && nodeId) {
        this._queue.jumpTo(nodeId);
        SED.Logger.info("Resumed graph scene at node:", nodeId);
      } else {
        this._queue._index = Math.max(0, Math.min(queueIndex, this._scene.steps ? this._scene.steps.length : 0));
        SED.Logger.info("Resumed scene at step:", this._queue._index);
      }
      return true;
    },

    resumeFromSave() {
      const data = SED.Save && SED.Save.getResumeData ? SED.Save.getResumeData() : null;
      if (!data) return false;
      const result = this.resume(data.sceneId, data.queueIndex || 0, data.nodeId || null);
      if (result && data.callStack && data.callStack.length > 0) {
        // v1.1: restore call stack is handled by caller reconstructing state
        SED.Logger.info("Resumed scene with call stack depth:", data.callStack.length);
      }
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

      if (SED.Tween) SED.Tween.clear();
      if (SED.VoiceManager) SED.VoiceManager.stop();

      SED.Cleanup.restore();
      SED.Logger.info("Scene stopped:", reason);
      this._forceIdle();
    },

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

      if (SED.Tween) SED.Tween.clear();
      if (SED.VoiceManager) SED.VoiceManager.stop();

      this._forceIdle();
    },

    update() {
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

      // v1.1: interpolate all string values in the step
      const interpolatedStep = SED.Util.interpolateDeep(step);

      const runtime = {
        startedFrame: Graphics.frameCount
      };

      this._activeStep = interpolatedStep;
      this._activeHandler = handler;
      this._activeRuntime = runtime;

      handler.start(interpolatedStep, this._context, runtime);
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

      // v2.0: take rewind snapshot after each step completes
      if (SED.Rewind && SED.Rewind.takeSnapshot) {
        SED.Rewind.takeSnapshot();
      }

      // v2.0: emit step completion event
      if (SED.EventBus) {
        SED.EventBus.emit("stepEnd", { sceneId: this._scene.sceneId, nodeId: this._queue.currentNodeId() });
      }

      this._activeStep = null;
      this._activeHandler = null;
      this._activeRuntime = null;
    },

    _completeScene() {
      SED.Save.markCompleted(this._scene.sceneId);
      SED.Logger.info("Scene completed:", this._scene.sceneId);

      // v1.1: if call stack has entries, pop and resume
      if (this._callStack.length > 0) {
        const entry = this._callStack.pop();
        this._scene = entry.scene;
        this._queue = entry.queue;
        this._context = entry.context;
        this._sceneTimeoutFrame = entry.timeoutFrame;
        if (entry.returnLabel) {
          this._queue.jumpTo(entry.returnLabel);
        }
        SED.Logger.info("Returned to scene:", entry.sceneId);
        return;
      }

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
      this._callStack = [];
    },

    _onTransferReserved(mapId, x, y, d, fadeType) {
      SED.Logger.info("Map transfer reserved during scene:", this._scene.sceneId, "-> map", mapId);
      this._transferResumeData = {
        sceneId: this._scene.sceneId,
        queueIndex: this._queue.currentIndex(),
        contextLocals: SED.Util.cloneJson(this._context.local || {})
      };
      if (this._queue instanceof SED.GraphQueue) {
        this._transferResumeData.nodeId = this._queue.currentNodeId();
      }
    },

    // v1.1: push current scene onto call stack and start sub-scene
    _callSubScene(sceneId, returnLabel) {
      if (!this.isBusy()) return false;

      const entry = {
        sceneId: this._scene.sceneId,
        scene: this._scene,
        queue: this._queue,
        context: this._context,
        timeoutFrame: this._sceneTimeoutFrame,
        returnLabel: returnLabel || null
      };

      this._callStack.push(entry);

      // Reset runner state for new scene (keep callStack)
      this._scene = null;
      this._queue = null;
      this._context = null;
      this._activeStep = null;
      this._activeHandler = null;
      this._activeRuntime = null;
      this._sceneTimeoutFrame = 0;

      return this.play(sceneId, {});
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
      SED.Runner.resume(data.sceneId, data.queueIndex, data.nodeId || null);
      if (SED.Runner._context && data.contextLocals) {
        for (const key in data.contextLocals) {
          SED.Runner._context.setLocal(key, data.contextLocals[key]);
        }
      }
    }
  };

  SED.Runner = Runner;
  SED.registerModule("Runner", "1.2.1");
})();
