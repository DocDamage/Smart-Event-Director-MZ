(() => {
  "use strict";

  const SED = window.SED;

  // Quest states
  const QUEST_STATE = {
    NOT_STARTED: 0,
    ACTIVE: 1,
    COMPLETED: 2,
    FAILED: 3
  };

  // Runtime state: map of questId -> quest state object
  const state = Object.create(null);

  function getQuestState(questId) {
    const id = String(questId);
    if (!state[id]) {
      state[id] = {
        questState: QUEST_STATE.NOT_STARTED,
        objectives: Object.create(null),
        startedAt: 0,
        completedAt: 0,
        failedAt: 0,
        flags: Object.create(null)
      };
    }
    return state[id];
  }

  function startQuest(questId) {
    const questData = SED.QuestRegistry.get(questId);
    if (!questData) {
      SED.Logger.error("Quest not found in registry:", questId);
      return false;
    }

    const qs = getQuestState(questId);
    if (qs.questState === QUEST_STATE.ACTIVE) {
      SED.Logger.warn("Quest already active:", questId);
      return false;
    }

    qs.questState = QUEST_STATE.ACTIVE;
    qs.startedAt = Graphics.frameCount;
    qs.completedAt = 0;
    qs.failedAt = 0;

    // Initialize objectives from quest data
    if (Array.isArray(questData.objectives)) {
      questData.objectives.forEach(function(obj) {
        qs.objectives[String(obj.id || obj.key || obj.text)] = false;
      });
    }

    qs.flags = Object.create(null);

    SED.Logger.info("Quest started:", questId);
    return true;
  }

  function updateObjective(questId, objectiveKey, completed) {
    const qs = getQuestState(questId);
    if (qs.questState !== QUEST_STATE.ACTIVE) {
      SED.Logger.warn("Cannot update objective for non-active quest:", questId);
      return false;
    }

    qs.objectives[String(objectiveKey)] = completed !== false;

    // Check if all objectives are complete
    const objectives = qs.objectives;
    let allDone = true;
    for (const key in objectives) {
      if (Object.prototype.hasOwnProperty.call(objectives, key)) {
        if (!objectives[key]) {
          allDone = false;
          break;
        }
      }
    }

    if (allDone && Object.keys(objectives).length > 0) {
      SED.Logger.info("All objectives complete for quest:", questId);
    }

    return true;
  }

  function completeQuest(questId) {
    const qs = getQuestState(questId);
    if (qs.questState !== QUEST_STATE.ACTIVE) {
      SED.Logger.warn("Cannot complete non-active quest:", questId);
      return false;
    }

    qs.questState = QUEST_STATE.COMPLETED;
    qs.completedAt = Graphics.frameCount;

    // Mark all objectives as complete
    for (const key in qs.objectives) {
      if (Object.prototype.hasOwnProperty.call(qs.objectives, key)) {
        qs.objectives[key] = true;
      }
    }

    SED.Logger.info("Quest completed:", questId);
    return true;
  }

  function failQuest(questId) {
    const qs = getQuestState(questId);
    if (qs.questState !== QUEST_STATE.ACTIVE) {
      SED.Logger.warn("Cannot fail non-active quest:", questId);
      return false;
    }

    qs.questState = QUEST_STATE.FAILED;
    qs.failedAt = Graphics.frameCount;

    SED.Logger.info("Quest failed:", questId);
    return true;
  }

  function isActive(questId) {
    const qs = getQuestState(questId);
    return qs.questState === QUEST_STATE.ACTIVE;
  }

  function isCompleted(questId) {
    const qs = getQuestState(questId);
    return qs.questState === QUEST_STATE.COMPLETED;
  }

  function isFailed(questId) {
    const qs = getQuestState(questId);
    return qs.questState === QUEST_STATE.FAILED;
  }

  function getStatus(questId) {
    const qs = getQuestState(questId);
    return {
      questState: qs.questState,
      objectives: SED.Util.cloneJson(qs.objectives),
      startedAt: qs.startedAt,
      completedAt: qs.completedAt,
      failedAt: qs.failedAt,
      flags: SED.Util.cloneJson(qs.flags)
    };
  }

  function setFlag(questId, key, value) {
    const qs = getQuestState(questId);
    qs.flags[String(key)] = value;
  }

  function getFlag(questId, key) {
    const qs = getQuestState(questId);
    return qs.flags[String(key)];
  }

  function getActiveQuests() {
    const result = [];
    for (const id in state) {
      if (Object.prototype.hasOwnProperty.call(state, id)) {
        const qs = state[id];
        if (qs.questState === QUEST_STATE.ACTIVE) {
          result.push({
            questId: id,
            title: (SED.QuestRegistry.get(id) || {}).title || id
          });
        }
      }
    }
    return result;
  }

  function getAllQuestStates() {
    const result = Object.create(null);
    for (const id in state) {
      if (Object.prototype.hasOwnProperty.call(state, id)) {
        result[id] = getStatus(id);
      }
    }
    return result;
  }

  /**
   * Internal: Get the raw state object for save/restore.
   * @private
   */
  function _getRawState(questId) {
    const id = String(questId);
    if (!state[id]) {
      state[id] = {
        questState: QUEST_STATE.NOT_STARTED,
        objectives: Object.create(null),
        startedAt: 0,
        completedAt: 0,
        failedAt: 0,
        flags: Object.create(null)
      };
    }
    return state[id];
  }

  function clear() {
    for (const key of Object.keys(state)) {
      delete state[key];
    }
  }

  SED.QuestState = {
    QUEST_STATE,
    startQuest,
    updateObjective,
    completeQuest,
    failQuest,
    isActive,
    isCompleted,
    isFailed,
    getStatus,
    setFlag,
    getFlag,
    getActiveQuests,
    getAllQuestStates,
    _getRawState,
    clear
  };

  SED.registerModule("QuestState", "0.3.0");
})();
