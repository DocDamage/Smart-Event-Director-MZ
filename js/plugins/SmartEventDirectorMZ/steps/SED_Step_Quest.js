(() => {
  "use strict";

  const SED = window.SED;

  // ===== startQuest step =====
  SED.StepRegistry.register({
    types: ["startQuest"],

    validate(step) {
      const errors = [];
      if (!step.questId) {
        errors.push("startQuest step missing questId.");
      }
      return errors;
    },

    start(step) {
      const questId = String(step.questId);
      const success = SED.QuestState.startQuest(questId);

      if (!success) {
        SED.Logger.error("Failed to start quest:", questId);
      }
    },

    update() {
      return true;
    }
  });

  // ===== updateObjective step =====
  SED.StepRegistry.register({
    types: ["updateObjective"],

    validate(step) {
      const errors = [];
      if (!step.questId) errors.push("updateObjective step missing questId.");
      if (!step.objective) errors.push("updateObjective step missing objective key.");
      return errors;
    },

    start(step) {
      const questId = String(step.questId);
      const objective = String(step.objective);
      const completed = step.completed !== false;

      SED.QuestState.updateObjective(questId, objective, completed);
    },

    update() {
      return true;
    }
  });

  // ===== completeQuest step =====
  SED.StepRegistry.register({
    types: ["completeQuest"],

    validate(step) {
      const errors = [];
      if (!step.questId) errors.push("completeQuest step missing questId.");
      return errors;
    },

    start(step) {
      const questId = String(step.questId);
      SED.QuestState.completeQuest(questId);
    },

    update() {
      return true;
    }
  });

  // ===== failQuest step =====
  SED.StepRegistry.register({
    types: ["failQuest"],

    validate(step) {
      const errors = [];
      if (!step.questId) errors.push("failQuest step missing questId.");
      return errors;
    },

    start(step) {
      const questId = String(step.questId);
      SED.QuestState.failQuest(questId);
    },

    update() {
      return true;
    }
  });

  // ===== questReward step =====
  SED.StepRegistry.register({
    types: ["questReward"],

    validate(step) {
      const errors = [];
      if (!step.questId) errors.push("questReward step missing questId.");
      return errors;
    },

    start(step) {
      const questId = String(step.questId);

      // Give gold
      const gold = Number(step.gold || 0);
      if (gold > 0) {
        $gameParty.gainGold(gold);
      }

      // Give items
      if (Array.isArray(step.items)) {
        step.items.forEach(function(item) {
          const itemId = Number(item.id || 0);
          const quantity = Math.max(1, Number(item.quantity || 1));
          if (itemId > 0 && $dataItems[itemId]) {
            $gameParty.gainItem($dataItems[itemId], quantity);
          }
        });
      }

      // Give weapons
      if (Array.isArray(step.weapons)) {
        step.weapons.forEach(function(wpn) {
          const wpnId = Number(wpn.id || 0);
          const quantity = Math.max(1, Number(wpn.quantity || 1));
          if (wpnId > 0 && $dataWeapons[wpnId]) {
            $gameParty.gainItem($dataWeapons[wpnId], quantity);
          }
        });
      }

      // Give armor
      if (Array.isArray(step.armors)) {
        step.armors.forEach(function(arm) {
          const armId = Number(arm.id || 0);
          const quantity = Math.max(1, Number(arm.quantity || 1));
          if (armId > 0 && $dataArmors[armId]) {
            $gameParty.gainItem($dataArmors[armId], quantity);
          }
        });
      }

      // Grant exp
      const exp = Number(step.exp || 0);
      if (exp > 0) {
        $gameParty.allMembers().forEach(function(actor) {
          if (actor && actor.gainExp) {
            actor.gainExp(exp);
          }
        });
      }

      SED.Logger.info("Quest reward given for:", questId);
    },

    update() {
      return true;
    }
  });

  SED.registerModule("Step_Quest", "0.3.0");
})();
