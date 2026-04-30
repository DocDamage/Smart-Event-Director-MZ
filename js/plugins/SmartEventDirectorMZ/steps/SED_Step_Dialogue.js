(() => {
  "use strict";

  const SED = window.SED;

  SED.StepRegistry.register({
    types: ["dialogue", "narration"],

    validate(step) {
      const errors = [];

      if (!step.text) {
        errors.push(step.type + " step missing text.");
      }

      return errors;
    },

    start(step, context, runtime) {
      runtime.phase = "waitForMessageSlot";
    },

    update(step, context, runtime) {
      if (runtime.phase === "waitForMessageSlot") {
        if ($gameMessage.isBusy()) {
          return false;
        }

        if (step.faceName) {
          $gameMessage.setFaceImage(String(step.faceName), Number(step.faceIndex || 0));
        }

        if (step.speaker && $gameMessage.setSpeakerName) {
          $gameMessage.setSpeakerName(String(step.speaker));
        }

        $gameMessage.add(String(step.text));
        runtime.phase = "waitForMessageClose";
        return false;
      }

      if (runtime.phase === "waitForMessageClose") {
        return !$gameMessage.isBusy();
      }

      return true;
    }
  });

  SED.registerModule("Step_Dialogue", "0.1.0");
})();
