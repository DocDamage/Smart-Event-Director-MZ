(() => {
  "use strict";

  const SED = window.SED;

  const state = {
    playedScenes: Object.create(null),
    completedScenes: Object.create(null),
    choices: Object.create(null),
    flags: Object.create(null)
  };

  let resumeData = null;

  function markPlayed(sceneId) {
    state.playedScenes[String(sceneId)] = true;
  }

  function markCompleted(sceneId) {
    state.completedScenes[String(sceneId)] = true;
  }

  function getPlayed(sceneId) {
    return !!state.playedScenes[String(sceneId)];
  }

  function getCompleted(sceneId) {
    return !!state.completedScenes[String(sceneId)];
  }

  function setChoice(key, value) {
    state.choices[String(key)] = value;
  }

  function getChoice(key) {
    return state.choices[String(key)];
  }

  function toJSON() {
    const sedData = {
      version: 4,
      playedScenes: state.playedScenes,
      completedScenes: state.completedScenes,
      choices: state.choices,
      flags: state.flags
    };

    // v0.3: Include quest and relationship state
    if (SED.QuestState && SED.QuestState.getAllQuestStates) {
      sedData.quests = SED.QuestState.getAllQuestStates();
    }

    if (SED.RelationshipState && SED.RelationshipState.getRelationships) {
      sedData.relationships = SED.RelationshipState.getRelationships();
    }

    // v0.4: Include active scene state if runner is busy
    if (SED.Runner && SED.Runner.isBusy && SED.Runner.isBusy()) {
      sedData.activeScene = SED.Runner.getState();
    }

    // Achievement state
    if (SED.AchievementState && SED.AchievementState.toJSON) {
      sedData.achievements = SED.AchievementState.toJSON();
    }

    // v2.0: SkipRead history
    if (SED.SkipRead && SED.SkipRead.toJSON) {
      sedData.skipRead = SED.SkipRead.toJSON();
    }

    return sedData;
  }

  function fromJSON(data) {
    data = data || {};

    state.playedScenes = data.playedScenes || Object.create(null);
    state.completedScenes = data.completedScenes || Object.create(null);
    state.choices = data.choices || Object.create(null);
    state.flags = data.flags || Object.create(null);

    // v0.4: Restore active scene resume data
    resumeData = data.activeScene || null;

    // Clear existing runtime state before restoring to prevent session leakage
    if (SED.QuestState && SED.QuestState.clear) {
      SED.QuestState.clear();
    }
    if (SED.RelationshipState && SED.RelationshipState.clear) {
      SED.RelationshipState.clear();
    }

    // v0.3: Restore quest state from save data
    if (data.quests && SED.QuestState && SED.QuestState._getRawState) {
      const questStates = data.quests;
      for (const questId in questStates) {
        if (Object.prototype.hasOwnProperty.call(questStates, questId)) {
          const qs = questStates[questId];
          const target = SED.QuestState._getRawState(questId);
          if (target) {
            target.questState = qs.questState || 0;
            target.objectives = qs.objectives || Object.create(null);
            target.startedAt = qs.startedAt || 0;
            target.completedAt = qs.completedAt || 0;
            target.failedAt = qs.failedAt || 0;
            target.flags = qs.flags || Object.create(null);
          }
        }
      }
    }

    // v0.3: Restore relationship state from save data
    if (data.relationships && SED.RelationshipState && SED.RelationshipState.getRelationships) {
      const rels = data.relationships;
      for (const target in rels) {
        if (Object.prototype.hasOwnProperty.call(rels, target)) {
          SED.RelationshipState.setPoints(target, rels[target]);
        }
      }
    }

    // Restore achievement state
    if (data.achievements && SED.AchievementState && SED.AchievementState.fromJSON) {
      SED.AchievementState.fromJSON(data.achievements);
    }

    // v2.0: Restore SkipRead history
    if (data.skipRead && SED.SkipRead && SED.SkipRead.fromJSON) {
      SED.SkipRead.fromJSON(data.skipRead);
    }
  }

  const _DataManager_makeSaveContents = DataManager.makeSaveContents;
  DataManager.makeSaveContents = function() {
    const contents = _DataManager_makeSaveContents.apply(this, arguments);
    contents.smartEventDirector = toJSON();
    return contents;
  };

  const _DataManager_extractSaveContents = DataManager.extractSaveContents;
  DataManager.extractSaveContents = function(contents) {
    _DataManager_extractSaveContents.apply(this, arguments);
    fromJSON(contents.smartEventDirector);
  };

  function getResumeData() {
    return resumeData;
  }

  function clearResumeData() {
    resumeData = null;
  }

  SED.Save = {
    markPlayed,
    markCompleted,
    getPlayed,
    getCompleted,
    setChoice,
    getChoice,
    toJSON,
    fromJSON,
    getResumeData,
    clearResumeData
  };

  SED.registerModule("Save", "0.4.0");
})();
