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

      if (step.textSpeed !== undefined && (!Number.isFinite(step.textSpeed) || step.textSpeed < 0)) {
        errors.push(step.type + " step textSpeed must be a non-negative number.");
      }

      if (step.autoAdvance !== undefined && (!Number.isFinite(step.autoAdvance) || step.autoAdvance < 0)) {
        errors.push(step.type + " step autoAdvance must be a non-negative number.");
      }

      return errors;
    },

    start(step, context, runtime) {
      if (SED.InputBuffer) {
        SED.InputBuffer.clear();
      }
      if (SED.TextEffects) {
        SED.TextEffects.pushOverride(step.textSpeed, step.autoAdvance);
      }
      runtime.phase = "waitForMessageSlot";
    },

    update(step, context, runtime) {
      if (runtime.phase === "waitForMessageSlot") {
        if ($gameMessage.isBusy()) {
          return false;
        }

        const speaker = step.speaker ? SED.Util.interpolateText(step.speaker) : null;
        const text = SED.Util.interpolateText(step.text);

        if (step.faceName) {
          $gameMessage.setFaceImage(String(step.faceName), Number(step.faceIndex || 0));
        }

        if (speaker && $gameMessage.setSpeakerName) {
          $gameMessage.setSpeakerName(speaker);
        }

        $gameMessage.add(text);

        if (SED.DialogueLog && SED.DialogueLog.addEntry) {
          SED.DialogueLog.addEntry({
            speaker: speaker,
            text: text,
            faceName: step.faceName || null,
            faceIndex: Number(step.faceIndex || 0)
          });
        }

        runtime.phase = "waitForMessageClose";
        return false;
      }

      if (runtime.phase === "waitForMessageClose") {
        const done = !$gameMessage.isBusy();
        if (done && SED.TextEffects) {
          SED.TextEffects.clearOverride();
        }
        return done;
      }

      return true;
    }
  });

  SED.registerModule("Step_Dialogue", "0.4.0");
})();
