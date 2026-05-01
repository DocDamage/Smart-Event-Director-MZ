(() => {
  "use strict";

  const SED = window.SED;

  SED.StepRegistry.register({
    types: ["preload"],

    validate(step) {
      const errors = [];

      const hasImages = step.images && Array.isArray(step.images) && step.images.length > 0;
      const hasAudio = step.audio && Array.isArray(step.audio) && step.audio.length > 0;

      if (!hasImages && !hasAudio) {
        errors.push("preload step needs images or audio array.");
      }

      return errors;
    },

    start(step, context, runtime) {
      runtime.phase = "loading";
      runtime.done = false;

      if (SED.AssetLoader && SED.AssetLoader.preload) {
        SED.AssetLoader.preload(step).then(() => {
          runtime.done = true;
        }).catch(() => {
          runtime.done = true;
        });
      } else {
        runtime.done = true;
      }
    },

    update(step, context, runtime) {
      return runtime.done;
    }
  });

  SED.registerModule("Step_Preload", "1.1.0");
})();
