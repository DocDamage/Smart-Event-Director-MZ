(() => {
  "use strict";

  const SED = window.SED;

  // If hot reload is not enabled, expose a no-op so callers don't break.
  if (!SED.Params.debug || !SED.Params.hotReload) {
    SED.HotReload = {
      trigger: function() {}
    };

    SED.registerModule("HotReload", "0.1.0");
    return;
  }

  function trigger() {
    SED.SceneRegistry.clear();

    if (SED.QuestRegistry && SED.QuestRegistry.clear) {
      SED.QuestRegistry.clear();
    }

    if (SED.DataLoader && SED.DataLoader.loadAll) {
      SED.DataLoader.loadAll()
        .then(() => {
          if (SED.Logger) {
            SED.Logger.info("SED data hot-reloaded.");
          }
        })
        .catch((error) => {
          if (SED.Logger) {
            SED.Logger.error("SED hot-reload failed:", error.message);
          }
        });
    }
  }

  SED.HotReload = {
    trigger
  };

  PluginManager.registerCommand(
    SED.pluginName || "SmartEventDirectorMZ",
    "ReloadData",
    function() {
      trigger();

      if (SED.Logger) {
        SED.Logger.info("SED data reloaded.");
      }
    }
  );

  SED.registerModule("HotReload", "0.1.0");
})();
