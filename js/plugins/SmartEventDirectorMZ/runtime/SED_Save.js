(() => {
  "use strict";

  const SED = window.SED;

  const state = {
    playedScenes: Object.create(null),
    completedScenes: Object.create(null),
    choices: Object.create(null),
    flags: Object.create(null)
  };

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
    return {
      version: 1,
      playedScenes: state.playedScenes,
      completedScenes: state.completedScenes,
      choices: state.choices,
      flags: state.flags
    };
  }

  function fromJSON(data) {
    data = data || {};

    state.playedScenes = data.playedScenes || Object.create(null);
    state.completedScenes = data.completedScenes || Object.create(null);
    state.choices = data.choices || Object.create(null);
    state.flags = data.flags || Object.create(null);
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

  SED.Save = {
    markPlayed,
    markCompleted,
    getPlayed,
    getCompleted,
    setChoice,
    getChoice,
    toJSON,
    fromJSON
  };

  SED.registerModule("Save", "0.2.0");
})();
