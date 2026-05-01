(() => {
  "use strict";

  const SED = window.SED;
  if (!SED.Runner) return;

  Object.assign(SED.Runner, {
    play(sceneId, options) {
      options = options || {};

      if (SED.EventBus) {
        SED.EventBus.emit(SED.EventBus.Events.RUNNER_PLAY, { sceneId: sceneId, options: options });
      }

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

      if (Array.isArray(this._scene.nodes) && Array.isArray(this._scene.edges)) {
        this._queue = new SED.GraphQueue(this._scene.nodes, this._scene.edges, this._scene._labels);
      } else {
        this._queue = new SED.StepQueue(this._scene.steps);
      }

      this._context = new SED.StepContext(this._scene, options);
      this._activeStep = null;
      this._activeHandler = null;
      this._activeRuntime = null;

      const timeout = Number(scene.timeoutFrames || SED.Params.defaultSceneTimeout || SED.Constants.DEFAULT_SCENE_TIMEOUT);
      this._sceneTimeoutFrame = Graphics.frameCount + timeout;

      SED.Save.markPlayed(sceneId);
      SED.Logger.info("Scene started:", sceneId);

      if (SED.Recorder && SED.Recorder.isRecording && SED.Recorder.isRecording()) {
        SED.Recorder.log("sceneStart", { sceneId: sceneId });
      }

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
        SED.Logger.info("Resumed scene with call stack depth:", data.callStack.length);
      }
      if (result && SED.Save.clearResumeData) {
        SED.Save.clearResumeData();
      }
      return result;
    }
  });

  SED.registerModule("RunnerScene", "1.0.0");
})();
