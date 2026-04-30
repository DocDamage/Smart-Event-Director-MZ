(() => {
  "use strict";

  const SED = window.SED;
  const raw = PluginManager.parameters(SED.pluginName);

  function bool(name, fallback) {
    const value = raw[name];
    if (value === undefined || value === "") return fallback;
    return String(value) === "true";
  }

  function number(name, fallback) {
    const value = Number(raw[name]);
    return Number.isFinite(value) ? value : fallback;
  }

  function text(name, fallback) {
    const value = raw[name];
    return value === undefined || value === "" ? fallback : String(value);
  }

  SED.Params = {
    // v0.1 params
    debug: bool("Debug Mode", true),
    dataIndexPath: text("Data Index Path", "data/SmartEventDirector/index.json"),
    defaultSceneTimeout: number("Default Scene Timeout", 3600),

    // v0.2 params
    enableSceneSkip: bool("Enable Scene Skip", true),
    sceneSkipKey: number("Scene Skip Key", 27),       // 27 = Escape keyCode
    enableDebugOverlay: bool("Enable Debug Overlay", false),
    allowSceneQueue: bool("Allow Scene Queue", false),
    defaultSkipPrevention: bool("Default Can Skip", true)
  };

  SED.registerModule("Params", "0.2.0");
})();
