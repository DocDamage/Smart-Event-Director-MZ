(() => {
  "use strict";

  const SED = window.SED;

  const entries = [];
  const MAX_ENTRIES = 100;

  function snapshotState() {
    const cpIds = SED.Params && SED.Params.historySwitchIds ? SED.Params.historySwitchIds : [];
    const cpVarIds = SED.Params && SED.Params.historyVariableIds ? SED.Params.historyVariableIds : [];
    const switches = Object.create(null);
    const variables = Object.create(null);

    if (Array.isArray(cpIds)) {
      for (const id of cpIds) {
        switches[String(id)] = $gameSwitches.value(Number(id));
      }
    }
    if (Array.isArray(cpVarIds)) {
      for (const id of cpVarIds) {
        variables[String(id)] = $gameVariables.value(Number(id));
      }
    }

    return {
      switches,
      variables,
      choices: SED.Util.cloneJson(SED.Save.toJSON ? SED.Save.toJSON().choices : {}),
      quests: SED.QuestState && SED.QuestState.getAllQuestStates ? SED.Util.cloneJson(SED.QuestState.getAllQuestStates()) : {},
      relationships: SED.RelationshipState && SED.RelationshipState.getRelationships ? SED.Util.cloneJson(SED.RelationshipState.getRelationships()) : {}
    };
  }

  function addEntry(data) {
    const entry = {
      frame: Graphics.frameCount,
      speaker: data.speaker || null,
      text: data.text || "",
      faceName: data.faceName || null,
      faceIndex: data.faceIndex || 0,
      choice: data.choice || null,
      state: snapshotState()
    };

    entries.push(entry);
    if (entries.length > MAX_ENTRIES) {
      entries.shift();
    }
  }

  function getEntries() {
    return entries.slice();
  }

  function clear() {
    entries.length = 0;
  }

  function getLatest(n) {
    return entries.slice(-(n || 1));
  }

  SED.History = {
    addEntry,
    getEntries,
    clear,
    getLatest
  };

  SED.registerModule("History", "1.1.0");
})();
