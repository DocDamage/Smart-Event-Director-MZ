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
    _pendingQueue: [],
    _callStack: [],

    update() {
      if (SED.EventBus) {
        SED.EventBus.emit(SED.EventBus.Events.RUNNER_UPDATE_START, { sceneId: this._scene ? this._scene.sceneId : null, state: this._state });
      }

      if (this._state !== "running") {
        if (this._pendingQueue.length > 0) {
          const next = this._pendingQueue.shift();
          this.play(next.sceneId, next.options);
        }
        if (SED.EventBus) {
          SED.EventBus.emit(SED.EventBus.Events.RUNNER_UPDATE_END, { sceneId: this._scene ? this._scene.sceneId : null, state: this._state });
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
          if (SED.EventBus) {
            SED.EventBus.emit(SED.EventBus.Events.RUNNER_UPDATE_END, { sceneId: this._scene ? this._scene.sceneId : null, state: this._state });
          }
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

      if (SED.EventBus) {
        SED.EventBus.emit(SED.EventBus.Events.RUNNER_UPDATE_END, { sceneId: this._scene ? this._scene.sceneId : null, state: this._state });
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

      const interpolatedStep = SED.Util.interpolateDeep(step);

      const runtime = {
        startedFrame: Graphics.frameCount
      };

      this._activeStep = interpolatedStep;
      this._activeHandler = handler;
      this._activeRuntime = runtime;

      if (SED.EventBus) {
        SED.EventBus.emit(SED.EventBus.Events.RUNNER_STEP_START, { sceneId: this._scene.sceneId, type: interpolatedStep.type, step: interpolatedStep });
      }

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

      if (SED.Rewind && SED.Rewind.takeSnapshot) {
        SED.Rewind.takeSnapshot();
      }

      if (SED.EventBus) {
        SED.EventBus.emit(SED.EventBus.Events.RUNNER_STEP_END, { sceneId: this._scene.sceneId, nodeId: this._queue.currentNodeId() });
      }

      if (SED.Recorder && SED.Recorder.isRecording && SED.Recorder.isRecording() && this._activeStep) {
        SED.Recorder.log(this._activeStep.type, SED.Util.cloneJson(this._activeStep));
      }

      this._activeStep = null;
      this._activeHandler = null;
      this._activeRuntime = null;
    },

    _completeScene() {
      SED.Save.markCompleted(this._scene.sceneId);
      SED.Logger.info("Scene completed:", this._scene.sceneId);

      if (SED.EventBus) {
        SED.EventBus.emit(SED.EventBus.Events.RUNNER_SCENE_COMPLETE, { sceneId: this._scene.sceneId });
      }

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

      if (SED.EventBus) {
        SED.EventBus.emit(SED.EventBus.Events.RUNNER_SCENE_FAIL, { sceneId: this._scene ? this._scene.sceneId : null, error: error.message });
      }

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

    _cancelActiveStep() {
      if (this._activeHandler && this._activeHandler.cancel) {
        try {
          this._activeHandler.cancel(this._activeStep, this._context, this._activeRuntime);
        } catch (error) {
          SED.Logger.error("Error during step cancel:", error.message);
        }
      }
    },

    stop(reason) {
      reason = reason || "stopped";

      if (SED.EventBus) {
        SED.EventBus.emit(SED.EventBus.Events.RUNNER_STOP, { sceneId: this._scene ? this._scene.sceneId : null, reason: reason });
      }

      this._cancelActiveStep();

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

      this._cancelActiveStep();

      if (SED.Tween) SED.Tween.clear();
      if (SED.VoiceManager) SED.VoiceManager.stop();

      this._forceIdle();
    }
  };

  SED.Runner = Runner;
  SED.registerModule("Runner", "1.3.0");

  if (SED.UpdateDispatcher) {
    SED.UpdateDispatcher.register("Runner", {
      update: function() { if (SED.Runner && SED.Runner.update) SED.Runner.update(); },
      priority: 0,
      contexts: ["map", "battle"]
    });
  }
})();
