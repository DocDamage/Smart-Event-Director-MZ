(() => {
  "use strict";

  const SED = window.SED;

  function loopCountKey(label) {
    return "_loop_" + label;
  }

  function loopMaxKey(label) {
    return "_loopMax_" + label;
  }

  SED.StepRegistry.register({
    types: ["loop"],

    validate(step) {
      const errors = [];

      if (!step.label || typeof step.label !== "string" || step.label.trim().length === 0) {
        errors.push("loop step requires a non-empty label.");
      }

      if (step.maxIterations !== undefined) {
        const max = Number(step.maxIterations);
        if (!Number.isFinite(max) || max < 0) {
          errors.push("loop maxIterations must be a non-negative number.");
        }
      }

      return errors;
    },

    start(step, context) {
      const label = step.label;
      const max = Number(step.maxIterations);
      context.setLocal(loopMaxKey(label), Number.isFinite(max) ? max : SED.Constants.LOOP_MAX_ITERATIONS);

      const count = context.getLocal(loopCountKey(label));
      if (count === undefined) {
        context.setLocal(loopCountKey(label), 0);
      } else if (count > context.getLocal(loopMaxKey(label))) {
        context.setLocal(loopCountKey(label), 0);
      }
    },

    update() {
      return true;
    },

    cancel() {}
  });

  SED.StepRegistry.register({
    types: ["endLoop"],

    validate(step) {
      const errors = [];

      if (!step.label || typeof step.label !== "string" || step.label.trim().length === 0) {
        errors.push("endLoop step requires a non-empty label.");
      }

      return errors;
    },

    start(step, context) {
      const label = step.label;
      const count = (context.getLocal(loopCountKey(label)) || 0) + 1;
      context.setLocal(loopCountKey(label), count);

      const max = context.getLocal(loopMaxKey(label));
      const limit = Number.isFinite(max) ? max : SED.Constants.LOOP_MAX_ITERATIONS;

      if (count > limit) {
        SED.Logger.warn("Loop maxIterations reached for label:", label);
        return;
      }

      context.jump(label);
    },

    update() {
      return true;
    },

    cancel() {}
  });

  SED.registerModule("Step_Loop", "0.1.0");
})();
