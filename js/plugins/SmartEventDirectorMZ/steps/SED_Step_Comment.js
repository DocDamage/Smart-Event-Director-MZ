(() => {
  "use strict";

  const SED = window.SED;

  SED.StepRegistry.register({
    types: ["comment"],

    validate() {
      return [];
    },

    start() {},

    update() {
      return true;
    },

    cancel() {}
  });

  SED.registerModule("Step_Comment", "0.1.0");
})();
