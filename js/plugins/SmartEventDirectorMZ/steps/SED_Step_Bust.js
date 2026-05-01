(() => {
  "use strict";

  const SED = window.SED;

  SED.StepRegistry.register({
    types: ["bust"],

    validate(step) {
      const errors = [];
      const validActions = ["show", "hide", "move"];
      if (validActions.indexOf(step.action) === -1) {
        errors.push("bust step unknown action: " + step.action + ". Valid: " + validActions.join(", "));
      }
      if (!step.character) {
        errors.push("bust step needs character.");
      }
      if ((step.action === "show" || step.action === "move") && !step.position) {
        errors.push("bust " + step.action + " step needs position.");
      }
      return errors;
    },

    start(step, context, runtime) {
      const character = String(step.character || "");
      const emotion = String(step.emotion || "");
      const position = String(step.position || "");
      const action = String(step.action || "");
      const enter = String(step.enter || "");
      const exit = String(step.exit || "");

      if (action === "show" || action === "move") {
        SED.BustManager.show(character, emotion, position, enter);
      } else if (action === "hide") {
        SED.BustManager.hide(character, exit);
      }
    },

    update(step, context, runtime) {
      return true;
    }
  });

  SED.registerModule("Step_Bust", "1.0.0");
})();
