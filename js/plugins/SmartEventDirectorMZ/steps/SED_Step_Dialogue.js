(() => {
  "use strict";

  const SED = window.SED;

  SED.StepRegistry.register({
    types: ["dialogue", "narration"],

    validate(step) {
      const errors = [];

      if (!step.text && !step.textKey) {
        errors.push(step.type + " step missing text or textKey.");
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
      if (SED.InputManager) {
        SED.InputManager.clear();
      }
      // Prevent immediate message advancement from the key press that triggered this scene
      if (Input && Input.clear) {
        Input.clear();
      }
      if (SED.TextEffects) {
        SED.TextEffects.pushOverride(step.textSpeed, step.autoAdvance);
      }
      if (step.voice && SED.VoiceManager) {
        SED.VoiceManager.play(step.voice);
      }
      if (step.theme && SED.ThemeManager) {
        SED.ThemeManager.apply(step.theme);
        runtime._themeApplied = true;
      }
      if (SED.EventBus) {
        SED.EventBus.emit("stepStart", { type: step.type, step: step, context: context });
      }
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

        if (step.bust !== undefined && SED.BustManager) {
          if (step.bust) {
            SED.BustManager.setEmotion(step.bust, step.emotion || "neutral");
            SED.BustManager.focus(step.bust);
          } else {
            SED.BustManager.focus(null);
          }
        }

        let displayText = String(step.text || "");
        const emotionMatch = displayText.match(/\[(\w+)\]/);
        if (emotionMatch && step.bust && SED.BustManager) {
          SED.BustManager.setEmotion(step.bust, emotionMatch[1]);
          displayText = displayText.replace(emotionMatch[0], "").trim();
        }

        $gameMessage.add(displayText);

        // v2.1: consume any pending OK flag after message submission
        if (SED.InputManager) {
          SED.InputManager.consumeOk();
        }

        if (SED.DialogueLog && SED.DialogueLog.addEntry) {
          SED.DialogueLog.addEntry({
            speaker: step.speaker || null,
            text: step.text || "",
            faceName: step.faceName || null,
            faceIndex: Number(step.faceIndex || 0)
          });
        }
        if (SED.NVLMode) {
          SED.NVLMode.addToBacklog(step.speaker, displayText);
        }
        if (SED.SkipRead) {
          SED.SkipRead.markSeen(step.text, step.speaker);
        }
        if (SED.SkipRead && SED.SkipRead.shouldSkip(step) && SED.TextEffects) {
          SED.TextEffects.pushOverride(0, 1);
        }

        runtime.phase = "waitForMessageClose";
        return false;
      }

      if (runtime.phase === "waitForMessageClose") {
        const done = !$gameMessage.isBusy();
        if (done && SED.TextEffects) {
          SED.TextEffects.clearOverride();
        }
        if (done && SED.VoiceManager) {
          SED.VoiceManager.restoreBgm();
        }
        if (done && runtime._themeApplied && SED.ThemeManager) {
          SED.ThemeManager.reset();
          runtime._themeApplied = false;
        }
        return done;
      }

      return true;
    }
  });

  SED.registerModule("Step_Dialogue", "1.1.0");
})();
