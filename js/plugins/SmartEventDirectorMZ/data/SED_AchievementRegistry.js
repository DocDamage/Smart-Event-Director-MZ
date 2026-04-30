(() => {
  "use strict";

  const SED = window.SED;
  const achievements = Object.create(null);

  function register(data) {
    const id = String(data.achievementId || "");

    if (!id) {
      throw new Error("Cannot register achievement without achievementId.");
    }

    if (achievements[id]) {
      throw new Error("Duplicate achievementId: " + id);
    }

    achievements[id] = data;
  }

  function get(achievementId) {
    return achievements[String(achievementId)] || null;
  }

  function has(achievementId) {
    return !!get(achievementId);
  }

  function listIds() {
    return Object.keys(achievements);
  }

  function clear() {
    for (const key of Object.keys(achievements)) {
      delete achievements[key];
    }
  }

  SED.AchievementRegistry = {
    register,
    get,
    has,
    listIds,
    clear
  };

  SED.registerModule("AchievementRegistry", "0.1.0");
})();
