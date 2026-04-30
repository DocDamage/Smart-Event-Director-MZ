(() => {
  "use strict";

  const SED = window.SED;

  SED.StepRegistry.register({
    types: ["lockPlayer"],

    validate() {
      return [];
    },

    start() {
      SED.Locks.lockPlayer();
    },

    update() {
      return true;
    }
  });

  SED.StepRegistry.register({
    types: ["unlockPlayer"],

    validate() {
      return [];
    },

    start() {
      SED.Locks.unlockPlayer();
    },

    update() {
      return true;
    }
  });

  SED.registerModule("Step_Locks", "0.1.0");
})();
