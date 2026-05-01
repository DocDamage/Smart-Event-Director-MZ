(() => {
  "use strict";

  const SED = window.SED;
  if (!SED.Runner) return;

  Object.assign(SED.Runner, {
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

      this._scene = null;
      this._queue = null;
      this._context = null;
      this._activeStep = null;
      this._activeHandler = null;
      this._activeRuntime = null;
      this._sceneTimeoutFrame = 0;

      return this.play(sceneId, {});
    }
  });

  SED.registerModule("RunnerStack", "1.0.0");
})();
