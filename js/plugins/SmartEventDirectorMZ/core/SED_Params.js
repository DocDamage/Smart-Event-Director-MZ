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
    sceneSkipKey: number("Scene Skip Key", 27),
    enableDebugOverlay: bool("Enable Debug Overlay", false),
    allowSceneQueue: bool("Allow Scene Queue", false),
    defaultSkipPrevention: bool("Default Can Skip", true),
    enableRelationshipViewer: bool("Enable Relationship Viewer", false),
    enableAchievementViewer: bool("Enable Achievement Viewer", false),

    // v0.4 params
    enableQuestLog: bool("Enable Quest Log", true),

    // v0.4: Quest toast config
    questToastPosition: text("Quest Toast Position", "topRight"),
    questToastDuration: number("Quest Toast Duration", 180),
    questToastAnimation: text("Quest Toast Animation", "slide"),
    questToastSound: text("Quest Toast Sound", ""),

    // v0.4: Keybinds
    sceneSkipKeyName: text("Scene Skip Key Name", "cancel"),
    dialogueLogKeyName: text("Dialogue Log Key Name", "pageup"),
    achievementViewerCancelKey: text("Achievement Viewer Cancel Key", "cancel"),
    relationshipViewerCancelKey: text("Relationship Viewer Cancel Key", "cancel"),

    // v0.4: Developer tooling
    hotReload: bool("Enable Hot Reload", false),

    // v1.1: Localization
    locale: text("Locale", "en"),

    // v1.1: Checkpoint / History snapshot IDs (comma-separated)
    checkpointSwitchIds: SED.Util && SED.Util.parseIdList ? SED.Util.parseIdList(text("Checkpoint Switch IDs", "")) : [],
    checkpointVariableIds: SED.Util && SED.Util.parseIdList ? SED.Util.parseIdList(text("Checkpoint Variable IDs", "")) : [],
    historySwitchIds: SED.Util && SED.Util.parseIdList ? SED.Util.parseIdList(text("History Switch IDs", "")) : [],
    historyVariableIds: SED.Util && SED.Util.parseIdList ? SED.Util.parseIdList(text("History Variable IDs", "")) : []
  };

  function validate() {
    const warnings = [];
    const p = SED.Params;

    if (!p.dataIndexPath || typeof p.dataIndexPath !== "string") {
      warnings.push("Data Index Path must be a non-empty string.");
    }

    if (!Number.isFinite(p.defaultSceneTimeout) || p.defaultSceneTimeout <= 0) {
      warnings.push("Default Scene Timeout must be greater than 0.");
    }

    const validToastPositions = ["topLeft", "topRight", "bottomLeft", "bottomRight", "center"];
    if (!validToastPositions.includes(p.questToastPosition)) {
      warnings.push("Quest Toast Position must be one of: " + validToastPositions.join(", ") + ".");
    }

    if (!Number.isFinite(p.questToastDuration) || p.questToastDuration < 0) {
      warnings.push("Quest Toast Duration must be a non-negative number.");
    }

    const validToastAnimations = ["slide", "fade", "none"];
    if (!validToastAnimations.includes(p.questToastAnimation)) {
      warnings.push("Quest Toast Animation must be one of: " + validToastAnimations.join(", ") + ".");
    }

    if (!Number.isFinite(p.sceneSkipKey)) {
      warnings.push("Scene Skip Key must be a valid number.");
    }

    if (!p.locale || typeof p.locale !== "string" || p.locale.trim() === "") {
      warnings.push("Locale must be a non-empty string.");
    }

    if (warnings.length > 0 && SED.Logger) {
      SED.Logger.warn("Plugin parameter validation warnings:", warnings.join("; "));
    }

    return warnings.length === 0;
  }

  SED.Params.validate = validate;
  SED.Params._raw = raw;

  SED.registerModule("Params", "1.1.0");
})();
