(() => {
  "use strict";

  const SED = window.SED;

  SED.StepRegistry.register({
    types: ["script"],

    validate(step) {
      const errors = [];

      if (!step.code || typeof step.code !== "string" || step.code.trim().length === 0) {
        errors.push("script step requires a non-empty code string.");
      }

      return errors;
    },

    start(step, context, runtime) {
      runtime.done = false;

      try {
        new Function("context", "runtime", step.code)(context, runtime);
      } catch (error) {
        SED.Logger.error("Script step error:", error.message);
        runtime.done = true;
        return;
      }

      if (step.wait !== true) {
        runtime.done = true;
      }
    },

    update(step, context, runtime) {
      if (runtime.done) {
        return true;
      }

      runtime.done = true;
      return false;
    },

    cancel() {}
  });

  SED.registerModule("Step_Script", "0.1.0");
})();
