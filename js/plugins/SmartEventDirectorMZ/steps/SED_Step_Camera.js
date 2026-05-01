(() => {
  "use strict";

  const SED = window.SED;

  SED.StepRegistry.register({
    types: ["camera"],

    validate(step) {
      const errors = [];
      const validActions = ["scroll", "focus", "reset", "shake", "zoomTo", "flash", "tint"];

      if (validActions.indexOf(step.action) === -1) {
        errors.push("camera step unknown action: " + step.action + ". Valid: " + validActions.join(", "));
      }

      return errors;
    },

    start(step, context, runtime) {
      const action = String(step.action || "");
      const easing = String(step.easing || "linear");

      if (action === "scroll") {
        const x = Number(step.x || 0);
        const y = Number(step.y || 0);
        const duration = Math.max(1, Number(step.duration || SED.Constants.DEFAULT_EFFECT_DURATION));

        if (SED.Tween && step.easing && step.easing !== "linear") {
          SED.Tween.to($gameMap, { displayX: x, displayY: y }, duration, easing);
          if (step.wait !== false) {
            runtime.wait = true;
            runtime.endFrame = Graphics.frameCount + duration;
          }
        } else {
          $gameMap.startScroll(x, y, duration);
          if (step.wait !== false) {
            runtime.wait = true;
          }
        }
      } else if (action === "focus") {
        const eventId = Number(step.eventId || 0);
        const duration = Math.max(1, Number(step.duration || SED.Constants.DEFAULT_EFFECT_DURATION));
        const event = eventId > 0 ? $gameMap.event(eventId) : (eventId === -1 ? $gamePlayer : null);

        if (event) {
          if (SED.Tween && step.easing && step.easing !== "linear") {
            SED.Tween.to($gameMap, { displayX: event.x, displayY: event.y }, duration, easing);
            if (step.wait !== false) {
              runtime.wait = true;
              runtime.endFrame = Graphics.frameCount + duration;
            }
          } else {
            $gameMap.screenTileX = event.x;
            $gameMap.screenTileY = event.y;
            runtime.wait = false;
          }
        }
      } else if (action === "reset") {
        const duration = Math.max(1, Number(step.duration || SED.Constants.DEFAULT_EFFECT_DURATION));

        if (SED.Tween && step.easing && step.easing !== "linear") {
          SED.Tween.to($gameMap, { displayX: $gamePlayer.x, displayY: $gamePlayer.y }, duration, easing);
          if (step.wait !== false) {
            runtime.wait = true;
            runtime.endFrame = Graphics.frameCount + duration;
          }
        } else {
          $gameMap.startScroll(0, 0, duration);
          if (step.wait !== false) {
            runtime.wait = true;
          }
        }
      } else if (action === "shake") {
        const intensity = Number(step.intensity || step.power || 5);
        const duration = Math.max(1, Number(step.duration || SED.Constants.DEFAULT_EFFECT_DURATION));
        const decay = Number(step.decay || 0);

        if (SED.ScreenEffects && SED.ScreenEffects.shake) {
          SED.ScreenEffects.shake(intensity, duration, decay);
        } else {
          const power = Math.max(0, Math.min(Math.round(intensity), 9));
          const speed = Math.max(1, Math.min(Math.round(intensity), 9));
          $gameScreen.startShake(power, speed, duration);
        }

        if (step.wait !== false) {
          runtime.wait = true;
          runtime.endFrame = Graphics.frameCount + duration;
        } else {
          runtime.wait = false;
        }
      } else if (action === "zoomTo") {
        const zoom = Number(step.zoom || 1);
        const duration = Math.max(1, Number(step.duration || SED.Constants.DEFAULT_EFFECT_DURATION));

        if (SED.ScreenEffects && SED.ScreenEffects.zoomTo) {
          SED.ScreenEffects.zoomTo(zoom, duration, easing);
        } else if (SED.Tween && step.easing && step.easing !== "linear") {
          SED.Tween.to($gameScreen, { _zoomScale: zoom }, duration, easing);
        } else {
          if ($gameScreen) { $gameScreen._zoomScale = zoom; }
        }

        if (step.wait !== false) {
          runtime.wait = true;
          runtime.endFrame = Graphics.frameCount + duration;
        } else {
          runtime.wait = false;
        }
      } else if (action === "flash") {
        const color = step.color || [255, 255, 255, 128];
        const duration = Math.max(0, Number(step.duration || SED.Constants.DEFAULT_EFFECT_DURATION));

        $gameScreen.startFlash(color, duration);

        if (step.wait !== false) {
          runtime.wait = true;
          runtime.endFrame = Graphics.frameCount + duration;
        } else {
          runtime.wait = false;
        }
      } else if (action === "tint") {
        const tone = step.tone || [0, 0, 0, 0];
        const duration = Math.max(0, Number(step.duration || SED.Constants.DEFAULT_EFFECT_DURATION));

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
        if (runtime.endFrame !== undefined) {
          return Graphics.frameCount >= runtime.endFrame;
        }
        return !$gameMap.isScrolling();
      }

      if (runtime.endFrame !== undefined) {
        return Graphics.frameCount >= runtime.endFrame;
      }

      return true;
    }
  });

  SED.registerModule("Step_Camera", "0.4.0");
})();
