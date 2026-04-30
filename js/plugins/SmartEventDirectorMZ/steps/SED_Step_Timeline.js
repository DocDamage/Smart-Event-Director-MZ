(() => {
  "use strict";

  const SED = window.SED;

  SED.StepRegistry.register({
    types: ["timeline"],

    validate(step) {
      const errors = [];
      if (step.target !== "camera") {
        errors.push("timeline step target must be 'camera'");
      }
      if (!Array.isArray(step.keyframes) || step.keyframes.length < 2) {
        errors.push("timeline step requires at least 2 keyframes");
      }
      return errors;
    },

    start(step, context, runtime) {
      const keyframes = (step.keyframes || []).slice().sort((a, b) => a.frame - b.frame);
      if (keyframes.length < 2 || step.target !== "camera") {
        runtime.done = true;
        return;
      }

      runtime.done = false;

      const defaults = {
        x: $gameMap.displayX !== undefined ? $gameMap.displayX : ($gameMap._displayX || 0),
        y: $gameMap.displayY !== undefined ? $gameMap.displayY : ($gameMap._displayY || 0),
        zoom: $gameScreen._zoomScale || 1
      };

      const chain = (index) => {
        if (index >= keyframes.length - 1) {
          runtime.done = true;
          return;
        }
        const from = keyframes[index];
        const to = keyframes[index + 1];
        const duration = Math.max(1, to.frame - from.frame);
        const easing = to.easing || step.easing || "linear";

        if (index === 0) {
          if (from.x !== undefined) $gameMap.displayX = from.x;
          else if (to.x !== undefined) $gameMap.displayX = defaults.x;
          if (from.y !== undefined) $gameMap.displayY = from.y;
          else if (to.y !== undefined) $gameMap.displayY = defaults.y;
          if (from.zoom !== undefined) $gameScreen._zoomScale = from.zoom;
          else if (to.zoom !== undefined) $gameScreen._zoomScale = defaults.zoom;
        }

        const mapProps = {};
        if (to.x !== undefined) mapProps.displayX = to.x;
        if (to.y !== undefined) mapProps.displayY = to.y;

        if (Object.keys(mapProps).length > 0 && to.zoom !== undefined) {
          SED.Tween.to($gameMap, mapProps, duration, easing, () => chain(index + 1));
          SED.Tween.to($gameScreen, { _zoomScale: to.zoom }, duration, easing);
        } else if (Object.keys(mapProps).length > 0) {
          SED.Tween.to($gameMap, mapProps, duration, easing, () => chain(index + 1));
        } else if (to.zoom !== undefined) {
          SED.Tween.to($gameScreen, { _zoomScale: to.zoom }, duration, easing, () => chain(index + 1));
        } else {
          chain(index + 1);
        }
      };

      chain(0);
      if (step.wait !== false) runtime.wait = true;
    },

    update(step, context, runtime) {
      if (!runtime.wait) return true;
      return runtime.done === true;
    }
  });

  SED.registerModule("Step_Timeline", "1.0.0");
})();
