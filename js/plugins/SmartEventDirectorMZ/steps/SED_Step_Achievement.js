(() => {
  "use strict";

  const SED = window.SED;

  SED.StepRegistry.register({
    types: ["unlockAchievement"],

    validate(step) {
      const errors = [];
      if (!step.achievementId) {
        errors.push("unlockAchievement step missing achievementId.");
      }
      return errors;
    },

    start(step) {
      const achievementId = String(step.achievementId);
      const newlyUnlocked = SED.AchievementState.unlock(achievementId);

      if (newlyUnlocked) {
        const data = SED.AchievementRegistry.get(achievementId);
        const title = data ? (data.title || achievementId) : achievementId;
        const icon = data ? data.icon : null;

        if (SED.AchievementToast && SED.AchievementToast.show) {
          SED.AchievementToast.show(achievementId, title, icon);
        }
      }
    },

    update() {
      return true;
    }
  });

  SED.registerModule("Step_Achievement", "0.1.0");
})();
