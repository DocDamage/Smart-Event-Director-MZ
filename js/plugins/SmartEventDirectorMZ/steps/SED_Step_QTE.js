(() => {
  "use strict";

  const SED = window.SED;

  function showPrompt(text) {
    if (text !== undefined && text !== null && text !== "") {
      $gameMessage.add(String(text));
    }
  }

  function finish(context, runtime, success, step) {
    if (step.storeResult) {
      context.setLocal("qteResult", success);
    }
    if (success && step.successJump) {
      context.jump(step.successJump);
    } else if (!success && step.failJump) {
      context.jump(step.failJump);
    }
    $gameMessage.clear();
    return true;
  }

  SED.StepRegistry.register({
    types: ["qte"],

    validate(step) {
      const errors = [];
      const variant = step.variant;

      if (!variant || ["press", "mash", "sequence"].indexOf(variant) === -1) {
        errors.push("qte step missing or invalid variant.");
      }

      if (variant === "press") {
        if (step.key && typeof step.key !== "string") {
          errors.push("qte press key must be a string.");
        }
      }

      if (variant === "mash") {
        if (step.key && typeof step.key !== "string") {
          errors.push("qte mash key must be a string.");
        }
        if (step.target !== undefined && (!Number.isFinite(step.target) || step.target <= 0)) {
          errors.push("qte mash target must be a positive number.");
        }
      }

      if (variant === "sequence") {
        if (!Array.isArray(step.keys) || step.keys.length === 0) {
          errors.push("qte sequence keys must be a non-empty array.");
        }
      }

      return errors;
    },

    start(step, context, runtime) {
      const variant = step.variant;
      runtime.variant = variant;

      if (variant === "press") {
        runtime.key = step.key || "ok";
        runtime.endFrame = Graphics.frameCount + Math.max(1, Number(step.window || SED.Constants.DEFAULT_QTE_WINDOW));
        showPrompt(step.prompt);
      }

      if (variant === "mash") {
        runtime.key = step.key || "ok";
        runtime.target = Number(step.target || SED.Constants.DEFAULT_QTE_MASH_TARGET);
        runtime.pressCount = 0;
        runtime.endFrame = Graphics.frameCount + Math.max(1, Number(step.timeLimit || SED.Constants.DEFAULT_QTE_TIME_LIMIT));
        showPrompt(step.prompt);
      }

      if (variant === "sequence") {
        runtime.keys = step.keys;
        runtime.index = 0;
        runtime.endFrame = Graphics.frameCount + Math.max(1, Number(step.timeLimit || SED.Constants.DEFAULT_QTE_TIME_LIMIT));
        runtime.keyDeadline = Graphics.frameCount + Math.max(1, Number(step.sequenceWindow || SED.Constants.DEFAULT_QTE_WINDOW));
        const prompts = step.prompts;
        const promptText = Array.isArray(prompts) ? prompts[0] : step.prompt;
        showPrompt(promptText);
      }
    },

    update(step, context, runtime) {
      const variant = runtime.variant;

      if (variant === "press") {
        if (Input.isTriggered(runtime.key)) {
          return finish(context, runtime, true, step);
        }
        if (Graphics.frameCount >= runtime.endFrame) {
          return finish(context, runtime, false, step);
        }
        return false;
      }

      if (variant === "mash") {
        if (Input.isRepeated(runtime.key)) {
          runtime.pressCount++;
          if (runtime.pressCount >= runtime.target) {
            return finish(context, runtime, true, step);
          }
        }
        if (Graphics.frameCount >= runtime.endFrame) {
          return finish(context, runtime, false, step);
        }
        return false;
      }

      if (variant === "sequence") {
        if (Graphics.frameCount >= runtime.endFrame || Graphics.frameCount >= runtime.keyDeadline) {
          return finish(context, runtime, false, step);
        }
        if (Input.isTriggered(runtime.keys[runtime.index])) {
          runtime.index++;
          if (runtime.index >= runtime.keys.length) {
            return finish(context, runtime, true, step);
          }
          runtime.keyDeadline = Graphics.frameCount + Math.max(1, Number(step.sequenceWindow || SED.Constants.DEFAULT_QTE_WINDOW));
          const prompts = step.prompts;
          const promptText = Array.isArray(prompts) ? prompts[runtime.index] : step.prompt;
          $gameMessage.clear();
          showPrompt(promptText);
        }
        return false;
      }

      return true;
    }
  });

  SED.registerModule("Step_QTE", "1.2.0");
})();
