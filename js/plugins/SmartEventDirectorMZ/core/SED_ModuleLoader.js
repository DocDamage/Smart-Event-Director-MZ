(() => {
  "use strict";

  const SED = window.SED;

  const loadedModules = new Set();

  const STEP_MODULE_MAP = Object.create(null);

  function registerStepModule(stepType, filePath) {
    STEP_MODULE_MAP[stepType] = filePath;
  }

  function isLoaded(filePath) {
    return loadedModules.has(filePath);
  }

  function markLoaded(filePath) {
    loadedModules.add(filePath);
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.onload = () => resolve(src);
      script.onerror = () => reject(new Error("Failed to load SED module: " + src));
      document.body.appendChild(script);
    });
  }

  async function loadStepModule(stepType) {
    const filePath = STEP_MODULE_MAP[stepType];
    if (!filePath) return false;
    if (isLoaded(filePath)) return true;

    try {
      const base = "js/plugins/SmartEventDirectorMZ/";
      await loadScript(base + filePath);
      markLoaded(filePath);
      return true;
    } catch (error) {
      SED.Logger.error("Failed to load step module:", filePath, error.message);
      return false;
    }
  }

  async function ensureStepHandler(stepType) {
    if (SED.StepRegistry && SED.StepRegistry.has(stepType)) return true;
    return await loadStepModule(stepType);
  }

  SED.ModuleLoader = {
    registerStepModule,
    isLoaded,
    markLoaded,
    loadScript,
    loadStepModule,
    ensureStepHandler
  };

  SED.registerModule("ModuleLoader", "1.1.0");
})();
