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

  function loadJsonNoCache(path) {
    const separator = path.indexOf("?") >= 0 ? "&" : "?";
    return loadJson(path + separator + "_t=" + Date.now());
  }

  function isLoadError(error) {
    const msg = error.message || "";
    return msg.indexOf("Failed to load JSON") !== -1 || msg.indexOf("XHR error loading JSON") !== -1;
  }

  function isJsonParseError(error) {
    const msg = error.message || "";
    return msg.indexOf("Invalid JSON") !== -1;
  }

  async function reloadScene(file) {
    const scenePath = "data/SmartEventDirector/scenes/" + file;
    const scene = await loadJsonNoCache(scenePath);

    const errors = SED.SceneValidator.validateScene(scene);

    if (errors.length > 0) {
      throw new Error("Scene validation failed for " + file + ": " + errors.join("; "));
    }

    SED.SceneRegistry.reload(scene);
    return scene;
  }

  async function loadLocale(locale) {
    const indexPath = SED.Params.dataIndexPath;
    const index = await loadJsonNoCache(indexPath);
    if (!index || !index.localeFiles) return null;
    const localeFile = index.localeFiles[locale];
    if (!localeFile) return null;
    return loadJsonNoCache("data/SmartEventDirector/" + localeFile);
  }

  async function reloadAll() {
    const indexPath = SED.Params.dataIndexPath;
    const index = await loadJsonNoCache(indexPath);

    if (!index || index.schema !== "SED_INDEX_1") {
      throw new Error("Invalid SED index schema.");
    }

    if (!Array.isArray(index.scenes)) {
      throw new Error("SED index must contain scenes array.");
    }

    SED.SceneRegistry.clear();

    if (Array.isArray(index.scenes)) {
      for (const file of index.scenes) {
        await reloadScene(file);
      }
    }

    if (SED.QuestRegistry && SED.QuestRegistry.clear) {
      SED.QuestRegistry.clear();
    }

    if (Array.isArray(index.quests)) {
      for (const file of index.quests) {
        const questPath = "data/SmartEventDirector/quests/" + file;
        const questData = await loadJsonNoCache(questPath);

        if (!questData.questId) {
          throw new Error("Quest data missing questId in " + file);
        }

        SED.QuestRegistry.register(questData);
      }
    }

    if (SED.AchievementRegistry && SED.AchievementRegistry.clear) {
      SED.AchievementRegistry.clear();
    }

    if (Array.isArray(index.achievements)) {
      for (const file of index.achievements) {
        const achievementPath = "data/SmartEventDirector/achievements/" + file;
        const achievementData = await loadJsonNoCache(achievementPath);

        if (!achievementData.achievementId) {
          throw new Error("Achievement data missing achievementId in " + file);
        }

        SED.AchievementRegistry.register(achievementData);
      }
    }

    // v1.1: reload locale strings
    if (SED.Locale && SED.Locale.loadStrings) {
      const locale = SED.Params && SED.Params.locale ? SED.Params.locale : "en";
      try {
        const localeData = await loadLocale(locale);
        if (localeData) {
          SED.Locale.loadStrings(localeData);
          SED.Locale.setLocale(locale);
        }
      } catch (e) {
        SED.Logger.warn("Failed to reload locale for:", locale);
      }
    }
  }

  async function loadQuests(questFiles) {
    const errors = [];

    if (!Array.isArray(questFiles)) {
      return;
    }

    for (const file of questFiles) {
      try {
        const questPath = "data/SmartEventDirector/quests/" + file;
        const questData = await loadJson(questPath);

        if (!questData.questId || !questData.title) {
          errors.push("SED quest invalid: " + file);
          continue;
        }

        SED.QuestRegistry.register(questData);
      } catch (error) {
        if (isLoadError(error)) {
          errors.push("SED quest file missing: " + file);
        } else if (isJsonParseError(error)) {
          errors.push("SED quest JSON invalid: " + file);
        } else {
          errors.push("SED quest error: " + file + " — " + error.message);
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join("\n"));
    }
  }

  async function loadAll() {
    const indexPath = SED.Params.dataIndexPath;
    let index;

    try {
      index = await loadJson(indexPath);
    } catch (error) {
      throw new Error(
        "SED data index not found or invalid. Expected file: " + indexPath +
        ". Please ensure data/SmartEventDirector/index.json exists and has schema 'SED_INDEX_1'."
      );
    }

    if (!index || index.schema !== "SED_INDEX_1") {
      throw new Error(
        "SED data index not found or invalid. Expected file: " + indexPath +
        ". Please ensure data/SmartEventDirector/index.json exists and has schema 'SED_INDEX_1'."
      );
    }

    if (!Array.isArray(index.scenes)) {
      throw new Error("SED index must contain scenes array.");
    }

    const errors = [];

    // Load scenes
    if (Array.isArray(index.scenes)) {
      for (const file of index.scenes) {
        try {
          const scenePath = "data/SmartEventDirector/scenes/" + file;
          const scene = await loadJson(scenePath);

          const validationErrors = SED.SceneValidator.validateScene(scene);

          if (validationErrors.length > 0) {
            errors.push("SED scene validation failed: " + file + " — " + validationErrors.join("; "));
            continue;
          }

          SED.SceneRegistry.register(scene);
        } catch (error) {
          if (isLoadError(error)) {
            errors.push("SED scene file missing: " + file);
          } else if (isJsonParseError(error)) {
            errors.push("SED scene JSON invalid: " + file + " — " + error.message);
          } else {
            errors.push("SED scene error: " + file + " — " + error.message);
          }
        }
      }
    }

    // Load quests
    if (Array.isArray(index.quests)) {
      try {
        await loadQuests(index.quests);
      } catch (error) {
        const questErrors = error.message.split("\n");
        for (const qe of questErrors) {
          errors.push(qe);
        }
      }
    }

    // Load achievements
    if (Array.isArray(index.achievements)) {
      for (const file of index.achievements) {
        try {
          const achievementPath = "data/SmartEventDirector/achievements/" + file;
          const achievementData = await loadJson(achievementPath);

          if (!achievementData.achievementId) {
            errors.push("SED achievement invalid: " + file);
            continue;
          }

          SED.AchievementRegistry.register(achievementData);
        } catch (error) {
          if (isLoadError(error)) {
            errors.push("SED achievement file missing: " + file);
          } else if (isJsonParseError(error)) {
            errors.push("SED achievement JSON invalid: " + file + " — " + error.message);
          } else {
            errors.push("SED achievement error: " + file + " — " + error.message);
          }
        }
      }
    }

    // v1.1: Load locale strings
    if (SED.Locale && SED.Locale.loadStrings) {
      const locale = SED.Params && SED.Params.locale ? SED.Params.locale : "en";
      try {
        const localeData = await loadLocale(locale);
        if (localeData) {
          SED.Locale.loadStrings(localeData);
          SED.Locale.setLocale(locale);
        }
      } catch (e) {
        SED.Logger.warn("Failed to load locale for:", locale);
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join("\n"));
    }
  }

  SED.DataLoader = {
    loadJson,
    loadJsonNoCache,
    reloadScene,
    reloadAll,
    loadAll,
    loadQuests,
    loadLocale
  };

  SED.registerModule("DataLoader", "1.1.0");
})();
