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

  async function loadRegistryEntries(files, pathPrefix, validateFn, registerFn, label) {
    const errors = [];

    if (!Array.isArray(files)) {
      return errors;
    }

    for (const file of files) {
      try {
        const data = await loadJson(pathPrefix + file);
        const validationErrors = validateFn ? validateFn(data, file) : [];

        if (validationErrors.length > 0) {
          errors.push(label + " validation failed: " + file + " — " + validationErrors.join("; "));
          continue;
        }

        registerFn(data);
      } catch (error) {
        if (isLoadError(error)) {
          errors.push(label + " file missing: " + file);
        } else if (isJsonParseError(error)) {
          errors.push(label + " JSON invalid: " + file + " — " + error.message);
        } else {
          errors.push(label + " error: " + file + " — " + error.message);
        }
      }
    }

    return errors;
  }

  async function loadQuests(questFiles) {
    const errors = await loadRegistryEntries(
      questFiles,
      "data/SmartEventDirector/quests/",
      function(data, file) {
        if (!data.questId || !data.title) {
          return ["missing questId or title"];
        }
        return [];
      },
      function(data) {
        SED.QuestRegistry.register(data);
      },
      "SED quest"
    );

    if (errors.length > 0) {
      SED.Logger.warn("SED load warnings:\n" + errors.join("\n"));
    }

    const loadedScenes = Array.isArray(index.scenes) ? index.scenes.length : 0;
    const loadedQuests = Array.isArray(index.quests) ? index.quests.length : 0;
    const loadedAchievements = Array.isArray(index.achievements) ? index.achievements.length : 0;
    SED.Logger.info("SED loaded:", loadedScenes, "scenes,", loadedQuests, "quests,", loadedAchievements, "achievements.");
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
    const sceneErrors = await loadRegistryEntries(
      index.scenes,
      "data/SmartEventDirector/scenes/",
      function(scene, file) {
        return SED.SceneValidator.validateScene(scene);
      },
      function(scene) {
        SED.SceneRegistry.register(scene);
      },
      "SED scene"
    );
    errors.push.apply(errors, sceneErrors);

    // Load quests
    if (Array.isArray(index.quests)) {
      try {
        await loadQuests(index.quests);
      } catch (error) {
        errors.push.apply(errors, error.message.split("\n"));
      }
    }

    // Load achievements
    const achievementErrors = await loadRegistryEntries(
      index.achievements,
      "data/SmartEventDirector/achievements/",
      function(data, file) {
        if (!data.achievementId) {
          return ["missing achievementId"];
        }
        return [];
      },
      function(data) {
        SED.AchievementRegistry.register(data);
      },
      "SED achievement"
    );
    errors.push.apply(errors, achievementErrors);

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
