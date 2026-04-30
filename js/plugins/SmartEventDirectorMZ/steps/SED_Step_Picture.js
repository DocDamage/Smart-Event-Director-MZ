(() => {
  "use strict";

  const SED = window.SED;

  function getScreenPicture(id) {
    return $gameScreen.picture(Number(id));
  }

  SED.StepRegistry.register({
    types: ["picture"],

    validate(step) {
      const errors = [];
      const validActions = ["show", "move", "erase", "tint"];

      if (validActions.indexOf(step.action) === -1) {
        errors.push("picture step unknown action: " + step.action + ". Valid: " + validActions.join(", "));
      }

      if (Number(step.id || 0) <= 0) {
        errors.push("picture step needs id > 0.");
      }

      if (step.action === "show" && !step.name) {
        errors.push("picture show step needs name.");
      }

      return errors;
    },

    start(step, context, runtime) {
      const id = Number(step.id);
      const action = String(step.action || "");

      if (action === "show") {
        const name = String(step.name || "");
        const origin = Number(step.origin || 0);
        const x = Number(step.x || 0);
        const y = Number(step.y || 0);
        const scaleX = Number(step.scaleX || 100);
        const scaleY = Number(step.scaleY || 100);
        const opacity = Number(step.opacity || 255);
        const blendMode = Number(step.blendMode || 0);

        $gameScreen.showPicture(id, name, origin, x, y, scaleX, scaleY, opacity, blendMode);
      } else if (action === "move") {
        const origin = Number(step.origin || 0);
        const x = Number(step.x || 0);
        const y = Number(step.y || 0);
        const scaleX = Number(step.scaleX || 100);
        const scaleY = Number(step.scaleY || 100);
        const opacity = Number(step.opacity || 255);
        const blendMode = Number(step.blendMode || 0);
        const duration = Math.max(0, Number(step.duration || 30));

        $gameScreen.movePicture(id, origin, x, y, scaleX, scaleY, opacity, blendMode, duration);

        if (step.wait !== false) {
          runtime.wait = true;
          runtime.endFrame = Graphics.frameCount + duration;
        } else {
          runtime.wait = false;
        }
      } else if (action === "erase") {
        $gameScreen.erasePicture(id);
      } else if (action === "tint") {
        const tone = step.tone || [0, 0, 0, 0];
        const duration = Math.max(0, Number(step.duration || 30));

        $gameScreen.tintPicture(id, tone, duration);

        if (step.wait !== false) {
          runtime.wait = true;
          runtime.endFrame = Graphics.frameCount + duration;
        } else {
          runtime.wait = false;
        }
      }
    },

    update(step, context, runtime) {
      if (!runtime.wait) return true;
      return Graphics.frameCount >= runtime.endFrame;
    }
  });

  SED.registerModule("Step_Picture", "0.2.0");
})();
