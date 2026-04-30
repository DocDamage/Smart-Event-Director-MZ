(() => {
  "use strict";

  const SED = window.SED;

  function cancelIndex(step) {
    if (step.cancel === "none") return -1;
    if (step.cancel === "branch") return -2;

    const n = Number(step.cancel);
    return Number.isFinite(n) ? n : -1;
  }

  SED.StepRegistry.register({
    types: ["choice"],

    validate(step) {
      const errors = [];

      if (!Array.isArray(step.options) || step.options.length === 0) {
        errors.push("choice step needs non-empty options array.");
      }

      if (step.options && step.options.length > 6) {
        errors.push("choice step has more than 6 options. MZ default choice UI may not fit.");
      }

      return errors;
    },

    start(step, context, runtime) {
      runtime.phase = "waitForMessageSlot";
      runtime.resultIndex = null;
      runtime.done = false;
    },

    update(step, context, runtime) {
      if (runtime.phase === "waitForMessageSlot") {
        if ($gameMessage.isBusy()) {
          return false;
        }

        const options = step.options.map(option => String(option.text || ""));
        const defaultIndex = Number(step.defaultIndex || 0);

        if (step.prompt) {
          $gameMessage.add(String(step.prompt));
        }

        $gameMessage.setChoices(options, defaultIndex, cancelIndex(step));

        $gameMessage.setChoiceCallback(index => {
          runtime.resultIndex = index;
          runtime.done = true;
        });

        runtime.phase = "waitForChoice";
        return false;
      }

      if (runtime.phase === "waitForChoice") {
        if (!runtime.done || $gameMessage.isBusy()) {
          return false;
        }

        const index = runtime.resultIndex;
        const option = step.options[index];

        if (step.key) {
          SED.Save.setChoice(step.key, {
            index,
            text: option ? option.text : null
          });
        }

        if (option && option.jump) {
          context.jump(option.jump);
        }

        return true;
      }

      return true;
    },

    cancel(step, context, runtime) {
      runtime.done = true;
    }
  });

  SED.registerModule("Step_Choice", "0.1.0");
})();
