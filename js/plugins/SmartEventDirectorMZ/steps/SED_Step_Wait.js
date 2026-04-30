(() => {
  "use strict";

  const SED = window.SED;

  SED.StepRegistry.register({
    types: ["wait"],

    validate(step) {
      const errors = [];
      if (Number(step.frames) < 0) errors.push("wait frames must be >= 0.");
      return errors;
    },

    start(step, context, runtime) {
      const frames = Math.max(0, Number(step.frames || 0));
      runtime.endFrame = Graphics.frameCount + frames;
    },

    update(step, context, runtime) {
      return Graphics.frameCount >= runtime.endFrame;
    }
  });

  SED.registerModule("Step_Wait", "0.1.0");
})();
