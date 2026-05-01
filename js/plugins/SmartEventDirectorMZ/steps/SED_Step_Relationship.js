(() => {
  "use strict";

  const SED = window.SED;

  SED.StepRegistry.register({
    types: ["relationship"],

    validate(step) {
      const errors = [];
      const validActions = ["set", "add"];

      if (validActions.indexOf(step.action) === -1) {
        errors.push("relationship step unknown action: " + step.action + ". Valid: " + validActions.join(", "));
      }

      if (!step.target) {
        errors.push("relationship step needs target (character name or id).");
      }

      return errors;
    },

    start(step) {
      const action = String(step.action || "add");
      const target = String(step.target);
      const value = Number(step.value || 0);

      if (action === "set") {
        SED.RelationshipState.setPoints(target, value);
      } else if (action === "add") {
        SED.RelationshipState.addPoints(target, value);
      }
    },

    update() {
      return true;
    }
  });

  SED.registerModule("Step_Relationship", "0.3.0");
})();
