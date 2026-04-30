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

    // v0.2: scene queue
    _pendingQueue: [],

    isBusy() {
      return this._state === "running" || this._state === "starting";
    },

    hasPending() {
      return this._pendingQueue.length > 0;
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

    stop(reason) {
      reason = reason || "stopped";

      if (this._activeHandler && this._activeHandler.cancel) {
        try {
          this._activeHandler.cancel(this._activeStep, this._context, this._activeRuntime);
        } catch (error) {
          SED.Logger.error("Error during step cancel:", error.message);
        }
      }

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

      if (SED.Failsafe) {
        SED.Failsafe.recover(error.message);
      } else {
        this._forceIdle();
      }
    },

    _forceIdle() {
      this._state = "idle";
      this._scene = null;
      this._queue = null;
      this._context = null;
      this._activeStep = null;
      this._activeHandler = null;
      this._activeRuntime = null;
      this._sceneTimeoutFrame = 0;
    }
  };

  SED.Runner = Runner;
  SED.registerModule("Runner", "0.2.0");
})();
