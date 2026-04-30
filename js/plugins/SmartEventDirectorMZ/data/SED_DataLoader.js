(() => {
  "use strict";

  const SED = window.SED;

  function loadJson(path) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", path);
      xhr.overrideMimeType("application/json");

      xhr.onload = function() {
        const ok = xhr.status < 400 || xhr.status === 0;

        if (!ok) {
          reject(new Error("Failed to load JSON: " + path + " status=" + xhr.status));
          return;
        }

        try {
          resolve(JSON.parse(xhr.responseText));
        } catch (error) {
          reject(new Error("Invalid JSON in " + path + ": " + error.message));
        }
      };

      xhr.onerror = function() {
        reject(new Error("XHR error loading JSON: " + path));
      };

      xhr.send();
    });
  }

  async function loadAll() {
    const indexPath = SED.Params.dataIndexPath;
    const index = await loadJson(indexPath);

    if (!index || index.schema !== "SED_INDEX_1") {
      throw new Error("Invalid SED index schema.");
    }

    if (!Array.isArray(index.scenes)) {
      throw new Error("SED index must contain scenes array.");
    }

    for (const file of index.scenes) {
      const scenePath = "data/SmartEventDirector/scenes/" + file;
      const scene = await loadJson(scenePath);

      const errors = SED.SceneValidator.validateScene(scene);

      if (errors.length > 0) {
        throw new Error("Scene validation failed for " + file + ": " + errors.join("; "));
      }

      SED.SceneRegistry.register(scene);
    }
  }

  SED.DataLoader = {
    loadJson,
    loadAll
  };

  SED.registerModule("DataLoader", "0.1.0");
})();
