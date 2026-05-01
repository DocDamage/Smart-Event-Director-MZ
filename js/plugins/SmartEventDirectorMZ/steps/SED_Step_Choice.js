(() => {
  "use strict";

  const SED = window.SED;

  const _originalIsEnabled = Window_ChoiceList.prototype.isEnabled;

  function cancelIndex(step) {
    if (step.cancel === "none") return -1;
    if (step.cancel === "branch") return -2;

    const n = Number(step.cancel);
    return Number.isFinite(n) ? n : -1;
  }

  function filterOptions(step) {
    const mode = String(step.conditionMode || "hidden");
    const visible = [];
    const disabled = [];
    const mappings = [];

    for (let i = 0; i < step.options.length; i++) {
      const opt = step.options[i];
      const cond = opt.condition;
      const passes = !cond || SED.Util.evaluateCondition(cond);

      if (passes) {
        visible.push(opt);
        disabled.push(false);
        mappings.push(i);
      } else if (mode === "disabled") {
        visible.push(opt);
        disabled.push(true);
        mappings.push(i);
      }
    }

    return { visible, disabled, mappings };
  }

  SED.StepRegistry.register({
    types: ["choice"],

    validate(step) {
      const errors = [];

      if (!Array.isArray(step.options) || step.options.length === 0) {
        errors.push("choice step needs non-empty options array.");
      }

      if (step.options && step.options.length > SED.Constants.MAX_CHOICE_OPTIONS) {
        errors.push("choice step has more than " + SED.Constants.MAX_CHOICE_OPTIONS + " options. MZ default choice UI may not fit.");
      }

      if (step.timeout !== undefined && (!Number.isFinite(step.timeout) || step.timeout < 1)) {
        errors.push("choice step timeout must be a positive number.");
      }

      return errors;
    },

    start(step, context, runtime) {
      runtime.phase = "waitForMessageSlot";
      runtime.resultIndex = null;
      runtime.done = false;
      runtime.filtered = null;
      if (SED.InputManager) {
        SED.InputManager.clear();
      }
    },

    update(step, context, runtime) {
      if (runtime.phase === "waitForMessageSlot") {
        if ($gameMessage.isBusy()) {
          return false;
        }

        runtime.filtered = filterOptions(step);

        if (runtime.filtered.visible.length === 0) {
          throw new Error("Choice step has no visible options after condition filtering.");
        }

        const options = runtime.filtered.visible.map(opt => String(opt.text || ""));
        const disabledFlags = runtime.filtered.disabled;
        const defaultIndex = Number(step.defaultIndex || 0);

        if (step.prompt) {
          $gameMessage.add(String(step.prompt));
        }

        $gameMessage.setChoices(options, defaultIndex, cancelIndex(step));

        if (disabledFlags && disabledFlags.some(Boolean)) {
          Window_ChoiceList.prototype.isEnabled = function(index) {
            const flags = $gameMessage._sedDisabledFlags;
            if (flags && index < flags.length) return !flags[index];
            return _originalIsEnabled.call(this, index);
          };
          $gameMessage._sedDisabledFlags = disabledFlags;
        }

        $gameMessage.setChoiceCallback(index => {
          runtime.resultIndex = index;
          runtime.done = true;
        });

        runtime._needsCleanup = disabledFlags && disabledFlags.some(Boolean);

        if (step.timeout) {
          runtime.timeoutEndFrame = Graphics.frameCount + Number(step.timeout);
        }

        runtime.phase = "waitForChoice";
        return false;
      }

      if (runtime.phase === "waitForChoice") {
        if (runtime.timeoutEndFrame && !runtime.done) {
          if (Graphics.frameCount >= runtime.timeoutEndFrame) {
            const behavior = String(step.timeoutBehavior || "default");
            if (behavior === "jump" && step.timeoutJump) {
              context.jump(step.timeoutJump);
              runtime.done = true;
            } else if (behavior === "cancel") {
              runtime.resultIndex = -1;
              runtime.done = true;
            } else {
              const defIdx = Math.min(Number(step.timeoutDefaultIndex || 0), runtime.filtered.visible.length - 1);
              runtime.resultIndex = defIdx;
              runtime.done = true;
            }
            if (runtime._needsCleanup) {
              Window_ChoiceList.prototype.isEnabled = _originalIsEnabled;
              $gameMessage._sedDisabledFlags = null;
              runtime._needsCleanup = false;
            }
            $gameMessage.clear();
            return true;
          }
        }

        if (!runtime.done || $gameMessage.isBusy()) {
          return false;
        }

        if (runtime._needsCleanup) {
          Window_ChoiceList.prototype.isEnabled = _originalIsEnabled;
          $gameMessage._sedDisabledFlags = null;
          runtime._needsCleanup = false;
        }

        const localIndex = runtime.resultIndex;
        const originalIndex = runtime.filtered.mappings[localIndex];
        const option = step.options[originalIndex];

        if (step.key) {
          SED.Save.setChoice(step.key, {
            index: originalIndex,
            text: option ? option.text : null
          });
        }

        if (option && option.jump) {
          context.jump(option.jump);
        }

        // v1.1: Push choice to History
        if (SED.History && SED.History.addEntry) {
          SED.History.addEntry({
            speaker: step.prompt || "Choice",
            text: option ? option.text : "(cancelled)",
            choice: { key: step.key, index: originalIndex }
          });
        }

        return true;
      }

      return true;
    },

    cancel(step, context, runtime) {
      runtime.done = true;
      if (runtime._needsCleanup) {
        Window_ChoiceList.prototype.isEnabled = _originalIsEnabled;
        $gameMessage._sedDisabledFlags = null;
        runtime._needsCleanup = false;
      }
    }
  });

  SED.registerModule("Step_Choice", "1.1.0");
})();
