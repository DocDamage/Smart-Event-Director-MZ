(() => {
  "use strict";

  const SED = window.SED;

  SED.StepRegistry.register({
    types: ["label"],

    validate() {
      return [];
    },

    start() {},

    update() {
      return true;
    }
  });

  SED.StepRegistry.register({
    types: ["jump"],

    validate(step) {
      const errors = [];
      if (!step.label) errors.push("jump step missing label.");
      return errors;
    },

    start(step, context) {
      context.jump(step.label);
    },

    update() {
      return true;
    }
  });

  SED.registerModule("Step_LabelJump", "0.1.0");
})();
