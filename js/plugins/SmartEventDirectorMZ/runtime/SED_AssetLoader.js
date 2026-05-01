(() => {
  "use strict";

  const SED = window.SED;

  const pending = [];

  function preloadImage(path) {
    return new Promise((resolve) => {
      const bitmap = ImageManager.reserveBitmap(path);
      if (bitmap.isReady()) {
        resolve();
      } else {
        bitmap.addLoadListener(() => resolve());
      }
    });
  }

  function preloadAudio(name, type) {
    return new Promise((resolve) => {
      const buffer = AudioManager.createBuffer(type || "bgm", name);
      if (buffer.isReady && buffer.isReady()) {
        resolve();
      } else if (buffer._isLoaded) {
        resolve();
      } else {
        const original = buffer._onLoad;
        buffer._onLoad = function() {
          if (original) original.apply(this, arguments);
          resolve();
        };
      }
    });
  }

  function preload(config) {
    const promises = [];

    if (config.images && Array.isArray(config.images)) {
      for (const path of config.images) {
        promises.push(preloadImage(path));
      }
    }

    if (config.audio && Array.isArray(config.audio)) {
      for (const item of config.audio) {
        if (typeof item === "string") {
          promises.push(preloadAudio(item, "bgm"));
        } else {
          promises.push(preloadAudio(item.name, item.type));
        }
      }
    }

    return Promise.all(promises);
  }

  function isBusy() {
    return pending.length > 0;
  }

  function waitForAll() {
    return Promise.all(pending).then(() => {
      pending.length = 0;
    });
  }

  SED.AssetLoader = {
    preload,
    preloadImage,
    preloadAudio,
    isBusy,
    waitForAll
  };

  SED.registerModule("AssetLoader", "1.1.0");
})();
