(() => {
  "use strict";

  const SED = window.SED;
  if (!SED.Runner) return;

  Object.assign(SED.Runner, {
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
    }
  });

  SED.registerModule("RunnerState", "1.0.0");
})();
