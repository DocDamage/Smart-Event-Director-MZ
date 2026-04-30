(() => {
  "use strict";

  const SED = window.SED;

  function registerFade(type, methodName) {
    SED.StepRegistry.register({
      types: [type],

      validate(step) {
        const errors = [];
        if (Number(step.duration || 0) < 0) {
          errors.push(type + " duration must be >= 0.");
        }
        return errors;
      },

      start(step, context, runtime) {
        const duration = Math.max(0, Number(step.duration || 30));
        runtime.wait = step.wait !== false;
        runtime.endFrame = Graphics.frameCount + duration;

        $gameScreen[methodName](duration);
      },

      update(step, context, runtime) {
        if (!runtime.wait) return true;
        return Graphics.frameCount >= runtime.endFrame;
      }
    });
  }

  registerFade("fadeOut", "startFadeOut");
  registerFade("fadeIn", "startFadeIn");

  SED.registerModule("Step_Fade", "0.1.0");
})();
