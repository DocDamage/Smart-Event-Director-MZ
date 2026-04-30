(() => {
  "use strict";

  const SED = window.SED;

  SED.StepRegistry.register({
    types: ["selfSwitch"],

    validate(step) {
      const errors = [];

      if (step.eventId === undefined && step.eventId === null) {
        errors.push("selfSwitch step needs eventId.");
      }

      if (!step.letter || String(step.letter).length !== 1) {
        errors.push("selfSwitch step needs letter (A, B, C, D).");
      }

      return errors;
    },

    start(step) {
      const eventId = Number(step.eventId);
      const letter = String(step.letter || "A").toUpperCase();
      const value = step.value !== false;

      if (eventId <= 0 || !$gameMap) {
        $gameSelfSwitches.setValue([$gameMap.mapId(), eventId, letter], value);
      }
    },

    update() {
      return true;
    }
  });

  SED.registerModule("Step_SelfSwitch", "0.2.0");
})();
