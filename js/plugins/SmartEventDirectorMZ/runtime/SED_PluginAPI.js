(() => {
  "use strict";

  const SED = window.SED;

  function playScene(sceneId, options) {
    if (!SED.Runner) return false;
    return SED.Runner.play(sceneId, options || {});
  }

  function stopScene() {
    if (!SED.Runner) return;
    SED.Runner.stop("api");
  }

  function skipScene() {
    if (!SED.Runner) return;
    SED.Runner.skip();
  }

  function getState() {
    if (!SED.Runner) return null;
    return SED.Runner.getState();
  }

  function isBusy() {
    if (!SED.Runner) return false;
    return SED.Runner.isBusy();
  }

  function on(event, callback) {
    if (SED.EventBus) SED.EventBus.on(event, callback);
  }

  function off(event, callback) {
    if (SED.EventBus) SED.EventBus.off(event, callback);
  }

  function registerStep(handler) {
    if (!SED.StepRegistry) throw new Error("StepRegistry not loaded.");
    SED.StepRegistry.register(handler);
  }

  function getStepHandler(type) {
    if (!SED.StepRegistry) return null;
    return SED.StepRegistry.get(type);
  }

  function listStepTypes() {
    if (!SED.StepRegistry) return [];
    return SED.StepRegistry.listTypes();
  }

  SED.API = {
    playScene,
    stopScene,
    skipScene,
    getState,
    isBusy,
    on,
    off,
    registerStep,
    getStepHandler,
    listStepTypes
  };

  SED.registerModule("PluginAPI", "2.0.0");
})();
