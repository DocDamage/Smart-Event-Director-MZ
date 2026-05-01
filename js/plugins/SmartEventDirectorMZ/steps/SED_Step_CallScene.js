(() => {
  "use strict";

  const SED = window.SED;

  SED.StepRegistry.register({
    types: ["callScene"],

    validate(step) {
      const errors = [];

      if (!step.sceneId) {
        errors.push("callScene step missing sceneId.");
      }

      return errors;
    },

    start(step, context, runtime) {
      runtime.done = false;

      if (SED.Runner && SED.Runner._callSubScene) {
        const success = SED.Runner._callSubScene(step.sceneId, step.returnLabel);
        runtime.done = success;
      } else {
        runtime.done = true;
      }
    },

    update(step, context, runtime) {
      return runtime.done;
    }
  });

  SED.registerModule("Step_CallScene", "1.1.0");
})();
