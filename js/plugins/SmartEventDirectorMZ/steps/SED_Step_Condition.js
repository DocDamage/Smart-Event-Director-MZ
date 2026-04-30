(() => {
  "use strict";

  const SED = window.SED;

  const VALID_OPERATORS = [
    "switchIs", "variableIs", "variableGte", "variableLte",
    "choiceIs", "scenePlayed", "sceneCompleted", "hasItem", "goldGte",
    "questActive", "questCompleted", "questFailed", "questObjectiveDone",
    "relationshipGte", "relationshipLte", "relationshipIs"
  ];

  SED.StepRegistry.register({
    types: ["condition"],

    validate(step) {
      const errors = [];

      if (VALID_OPERATORS.indexOf(step.operator) === -1) {
        errors.push("condition step unknown operator: " + step.operator);
      }

      if (step.operator === "switchIs" && Number(step.switchId || 0) <= 0) {
        errors.push("condition switchIs needs switchId > 0.");
      }

      if ((step.operator === "variableIs" || step.operator === "variableGte" || step.operator === "variableLte") && Number(step.variableId || 0) <= 0) {
        errors.push("condition " + step.operator + " needs variableId > 0.");
      }

      return errors;
    },

    start(step, context) {
      const result = SED.Util.evaluateCondition(step);

      if (result && step.jumpTrue) {
        context.jump(step.jumpTrue);
      } else if (!result && step.jumpFalse) {
        context.jump(step.jumpFalse);
      } else if (!result && step.elseJump) {
        context.jump(step.elseJump);
      }
    },

    update() {
      return true;
    }
  });

  SED.registerModule("Step_Condition", "1.1.0");
})();
