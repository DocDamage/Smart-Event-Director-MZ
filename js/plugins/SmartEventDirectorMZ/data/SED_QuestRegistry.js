(() => {
  "use strict";

  const SED = window.SED;
  const quests = Object.create(null);

  function register(questData) {
    const id = String(questData.questId || "");

    if (!id) {
      throw new Error("Cannot register quest without questId.");
    }

    if (quests[id]) {
      throw new Error("Duplicate questId: " + id);
    }

    // Validate quest structure
    if (!questData.title) {
      throw new Error("Quest " + id + " missing title.");
    }

    if (questData.objectives && !Array.isArray(questData.objectives)) {
      throw new Error("Quest " + id + " objectives must be an array.");
    }

    quests[id] = questData;
  }

  function get(questId) {
    return quests[String(questId)] || null;
  }

  function has(questId) {
    return !!get(questId);
  }

  function list() {
    return Object.keys(quests);
  }

  function clear() {
    for (const key of Object.keys(quests)) {
      delete quests[key];
    }
  }

  function reload(questData) {
    const id = String(questData.questId || "");

    if (!id) {
      throw new Error("Cannot reload quest without questId.");
    }

    if (quests[id]) {
      delete quests[id];
    }

    register(questData);
  }

  SED.QuestRegistry = {
    register,
    get,
    has,
    list,
    clear,
    reload
  };

  SED.registerModule("QuestRegistry", "0.3.0");
})();
