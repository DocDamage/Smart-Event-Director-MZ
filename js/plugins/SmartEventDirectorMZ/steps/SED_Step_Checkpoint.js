(() => {
  "use strict";

  const SED = window.SED;

  SED.StepRegistry.register({
    types: ["checkpoint"],

    validate() {
      return [];
    },

    start(step, context, runtime) {
      if (SED.Checkpoint && SED.Checkpoint.save) {
        SED.Checkpoint.save(step.id);
      }
      runtime.done = true;
    },

    update(step, context, runtime) {
      return runtime.done;
    }
  });

  SED.registerModule("Step_Checkpoint", "1.1.0");
})();
