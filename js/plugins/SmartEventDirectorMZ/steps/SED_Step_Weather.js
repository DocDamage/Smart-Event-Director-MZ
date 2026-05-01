(() => {
  "use strict";

  const SED = window.SED;
  const VALID_TYPES = ["none", "rain", "storm", "snow"];

  SED.StepRegistry.register({
    types: ["weather"],

    validate(step) {
      const errors = [];
      const action = String(step.action || "set");
      const weatherType = String(step.weatherType || "none");
      const power = Number(step.power !== undefined ? step.power : 5);

      if (["set", "clear", "fade"].indexOf(action) === -1) {
        errors.push("weather step unknown action: " + action + ". Valid: set, clear, fade");
      }

      if (VALID_TYPES.indexOf(weatherType) === -1) {
        errors.push("weather step unknown weatherType: " + weatherType + ". Valid: " + VALID_TYPES.join(", "));
      }

      if (power < 0 || power > 9) {
        errors.push("weather step power must be 0-9.");
      }

      if (Number(step.duration || 0) < 0) {
        errors.push("weather step duration must be >= 0.");
      }

      return errors;
    },

    start(step, context, runtime) {
      const action = String(step.action || "set");
      const duration = Math.max(0, Number(step.duration !== undefined ? step.duration : 60));

      let weatherType = String(step.weatherType || "none");
      let power = Number(step.power !== undefined ? step.power : 5);

      if (action === "clear") {
        weatherType = "none";
        power = 0;
      }

      runtime.wait = step.wait !== false;
      runtime.endFrame = Graphics.frameCount + duration;

      $gameScreen.changeWeather(weatherType, power, duration);
    },

    update(step, context, runtime) {
      if (!runtime.wait) return true;
      return Graphics.frameCount >= runtime.endFrame;
    }
  });

  SED.registerModule("Step_Weather", "0.1.0");
})();
