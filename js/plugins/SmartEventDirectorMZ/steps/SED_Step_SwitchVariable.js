(() => {
  "use strict";

  const SED = window.SED;

  SED.StepRegistry.register({
    types: ["switch"],

    validate(step) {
      const errors = [];

      if (Number(step.id) <= 0) {
        errors.push("switch step needs id > 0.");
      }

      return errors;
    },

    start(step) {
      const id = Number(step.id);
      const value = SED.Util.toBool(step.value, true);
      $gameSwitches.setValue(id, value);
    },

    update() {
      return true;
    }
  });

  SED.StepRegistry.register({
    types: ["variable"],

    validate(step) {
      const errors = [];

      if (Number(step.id) <= 0) {
        errors.push("variable step needs id > 0.");
      }

      return errors;
    },

    start(step) {
      const id = Number(step.id);
      const operation = String(step.operation || "set");
      const value = Number(step.value || 0);
      const current = Number($gameVariables.value(id) || 0);

      let next = current;

      if (operation === "set") next = value;
      else if (operation === "add") next = current + value;
      else if (operation === "sub") next = current - value;
      else if (operation === "mul") next = current * value;
      else if (operation === "div") next = value === 0 ? current : current / value;
      else if (operation === "mod") next = value === 0 ? current : current % value;
      else throw new Error("Unknown variable operation: " + operation);

      $gameVariables.setValue(id, next);
    },

    update() {
      return true;
    }
  });

  SED.registerModule("Step_SwitchVariable", "0.1.0");
})();
