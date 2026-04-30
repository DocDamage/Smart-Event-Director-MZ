(() => {
  "use strict";

  const SED = window.SED;

  function evaluateCondition(step) {
    const operator = String(step.operator || "switchIs");

    if (operator === "switchIs") {
      const id = Number(step.switchId);
      const target = step.value !== false;
      return $gameSwitches.value(id) === target;
    }

    if (operator === "variableIs") {
      const id = Number(step.variableId);
      const target = Number(step.value);
      return Number($gameVariables.value(id)) === target;
    }

    if (operator === "variableGte") {
      const id = Number(step.variableId);
      const target = Number(step.value);
      return Number($gameVariables.value(id)) >= target;
    }

    if (operator === "variableLte") {
      const id = Number(step.variableId);
      const target = Number(step.value);
      return Number($gameVariables.value(id)) <= target;
    }

    if (operator === "choiceIs") {
      const key = String(step.choiceKey || "");
      const targetIndex = Number(step.choiceIndex);
      const choice = SED.Save.getChoice(key);
      return choice && Number(choice.index) === targetIndex;
    }

    if (operator === "scenePlayed") {
      return !!SED.Save.getPlayed(String(step.sceneId || ""));
    }

    if (operator === "sceneCompleted") {
      return !!SED.Save.getCompleted(String(step.sceneId || ""));
    }

    if (operator === "hasItem") {
      return $gameParty.hasItem($dataItems[Number(step.itemId || 0)]);
    }

    if (operator === "goldGte") {
      return $gameParty.gold() >= Number(step.value || 0);
    }

    // ===== v0.3: Quest operators =====
    if (operator === "questActive") {
      return SED.QuestState.isActive(String(step.questId || ""));
    }

    if (operator === "questCompleted") {
      return SED.QuestState.isCompleted(String(step.questId || ""));
    }

    if (operator === "questFailed") {
      return SED.QuestState.isFailed(String(step.questId || ""));
    }

    if (operator === "questObjectiveDone") {
      const qs = SED.QuestState._getRawState(String(step.questId || ""));
      return !!(qs.objectives[String(step.objective || "")]);
    }

    // ===== v0.3: Relationship operators =====
    if (operator === "relationshipGte") {
      return SED.RelationshipState.getPoints(String(step.target || "")) >= Number(step.value || 0);
    }

    if (operator === "relationshipLte") {
      return SED.RelationshipState.getPoints(String(step.target || "")) <= Number(step.value || 0);
    }

    if (operator === "relationshipIs") {
      return SED.RelationshipState.getPoints(String(step.target || "")) === Number(step.value || 0);
    }

    return false;
  }

  SED.StepRegistry.register({
    types: ["condition"],

    validate(step) {
      const errors = [];
      const validOperators = [
        "switchIs", "variableIs", "variableGte", "variableLte",
        "choiceIs", "scenePlayed", "sceneCompleted", "hasItem", "goldGte",
        "questActive", "questCompleted", "questFailed", "questObjectiveDone",
        "relationshipGte", "relationshipLte", "relationshipIs"
      ];

      if (validOperators.indexOf(step.operator) === -1) {
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
      const result = evaluateCondition(step);

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

  SED.registerModule("Step_Condition", "0.3.0");
})();
