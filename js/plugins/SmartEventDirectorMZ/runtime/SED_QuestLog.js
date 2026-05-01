(() => {
  "use strict";

  const SED = window.SED;

  SED.QuestLog = {
    open: function() {
      SceneManager.push(Scene_SED_QuestLog);
    }
  };

  SED.registerModule("QuestLog", "1.0.0");
})();
