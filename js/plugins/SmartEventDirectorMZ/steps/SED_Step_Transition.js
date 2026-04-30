(() => {
  "use strict";

  const SED = window.SED;

  const VALID_EFFECTS = ["fade", "fadeWhite", "wipe", "mosaic", "instant"];

  SED.StepRegistry.register({
    types: ["transition"],

    validate(step) {
      const errors = [];
      const effect = step.effect || "fade";

      if (!VALID_EFFECTS.includes(effect)) {
        errors.push("transition effect must be one of: " + VALID_EFFECTS.join(", ") + ".");
      }

      if (Number(step.duration || 0) < 0) {
        errors.push("transition duration must be >= 0.");
      }

      if (step.color !== undefined) {
        if (!Array.isArray(step.color) || step.color.length !== 4) {
          errors.push("transition color must be an array [r, g, b, a].");
        } else {
          for (let i = 0; i < 4; i++) {
            if (!Number.isFinite(step.color[i])) {
              errors.push("transition color values must be numbers.");
              break;
            }
          }
        }
      }

      return errors;
    },

    start(step, context, runtime) {
      const effect = step.effect || "fade";
      const duration = Math.max(0, Number(step.duration || 30));
      runtime.wait = step.wait !== false;
      runtime.effect = effect;
      runtime.duration = duration;

      if (effect === "instant") {
        return;
      }

      if (effect === "fadeWhite") {
        const color = Array.isArray(step.color) && step.color.length === 4
          ? step.color
          : [255, 255, 255, 255];
        $gameScreen.startTone(color, duration);
        runtime.phase = "fadeOut";
        runtime.fadeOutEnd = Graphics.frameCount + duration;
        return;
      }

      // fade, wipe, mosaic — fall back to standard fade out/in
      $gameScreen.startFadeOut(duration);
      runtime.phase = "fadeOut";
      runtime.fadeOutEnd = Graphics.frameCount + duration;
    },

    update(step, context, runtime) {
      if (runtime.effect === "instant") {
        return true;
      }

      if (!runtime.wait) {
        return true;
      }

      if (runtime.phase === "fadeOut") {
        if (Graphics.frameCount >= runtime.fadeOutEnd) {
          if (runtime.effect === "fadeWhite") {
            $gameScreen.startTone([0, 0, 0, 0], runtime.duration);
          } else {
            $gameScreen.startFadeIn(runtime.duration);
          }
          runtime.phase = "fadeIn";
          runtime.fadeInEnd = Graphics.frameCount + runtime.duration;
        }
        return false;
      }

      if (runtime.phase === "fadeIn") {
        return Graphics.frameCount >= runtime.fadeInEnd;
      }

      return true;
    },

    cancel(step, context, runtime) {
      if (runtime.effect === "fadeWhite") {
        $gameScreen.startTone([0, 0, 0, 0], 1);
      } else if (runtime.effect !== "instant") {
        $gameScreen.startFadeIn(1);
      }
    }
  });

  SED.registerModule("Step_Transition", "0.1.0");
})();
