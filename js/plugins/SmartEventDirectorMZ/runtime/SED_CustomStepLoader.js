(() => {
  "use strict";

  const SED = window.SED;

  async function loadCustomSteps() {
    const path = SED.Params && SED.Params.customStepPath;
    if (!path) return;

    try {
      const index = await SED.DataLoader.loadJson(path);
      if (!index || !Array.isArray(index.handlers)) {
        SED.Logger.warn("Custom step index missing handlers array:", path);
        return;
      }

      for (const entry of index.handlers) {
        if (!entry.file) continue;
        await loadScript(entry.file);
        SED.Logger.info("Custom step handler loaded:", entry.name || entry.file);
      }
    } catch (err) {
      SED.Logger.warn("Custom step loader failed:", err.message);
    }
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.onload = () => resolve(src);
      script.onerror = () => reject(new Error("Failed to load custom step: " + src));
      document.body.appendChild(script);
    });
  }

  SED.CustomStepLoader = {
    load: loadCustomSteps
  };

  SED.registerModule("CustomStepLoader", "2.0.0");
})();
