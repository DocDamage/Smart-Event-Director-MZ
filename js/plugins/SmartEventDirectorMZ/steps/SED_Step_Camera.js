(() => {
  "use strict";

  const SED = window.SED;

  SED.StepRegistry.register({
    types: ["camera"],

    validate(step) {
      const errors = [];
      const validActions = ["scroll", "focus", "reset", "shake", "flash", "tint"];

      if (validActions.indexOf(step.action) === -1) {
        errors.push("camera step unknown action: " + step.action + ". Valid: " + validActions.join(", "));
      }

      return errors;
    },

    start(step, context, runtime) {
      const action = String(step.action || "");

      if (action === "scroll") {
        const x = Number(step.x || 0);
        const y = Number(step.y || 0);
        const duration = Math.max(0, Number(step.duration || 30));

        $gameMap.startScroll(x, y, duration);

        if (step.wait !== false) {
          runtime.wait = true;
        } else {
          runtime.wait = false;
        }
      } else if (action === "focus") {
        const x = Number(step.x || 0);
        const y = Number(step.y || 0);
        const duration = Math.max(0, Number(step.duration || 30));

        $gameMap.screenTileX = x;
        $gameMap.screenTileY = y;

        runtime.wait = false;
      } else if (action === "reset") {
        $gameMap.startScroll(0, 0, Math.max(0, Number(step.duration || 30)));

        if (step.wait !== false) {
          runtime.wait = true;
        } else {
          runtime.wait = false;
        }
      } else if (action === "shake") {
        const power = Number(step.power || 5);
        const speed = Number(step.speed || 5);
        const duration = Math.max(0, Number(step.duration || 30));

        $gameScreen.startShake(power, speed, duration);

        if (step.wait !== false) {
          runtime.wait = true;
          runtime.endFrame = Graphics.frameCount + duration;
        } else {
          runtime.wait = false;
        }
      } else if (action === "flash") {
        const color = step.color || [255, 255, 255, 128];
        const duration = Math.max(0, Number(step.duration || 30));

        $gameScreen.startFlash(color, duration);

        if (step.wait !== false) {
          runtime.wait = true;
          runtime.endFrame = Graphics.frameCount + duration;
        } else {
          runtime.wait = false;
        }
      } else if (action === "tint") {
        const tone = step.tone || [0, 0, 0, 0];
        const duration = Math.max(0, Number(step.duration || 30));

        $gameScreen.startTone(tone, duration);

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

      if (step.action === "scroll" || step.action === "reset") {
        return !$gameMap.isScrolling();
      }

      if (runtime.endFrame !== undefined) {
        return Graphics.frameCount >= runtime.endFrame;
      }

      return true;
    }
  });

  SED.registerModule("Step_Camera", "0.2.0");
})();
