(() => {
  "use strict";

  const SED = window.SED;
  const scenes = Object.create(null);

  function register(scene) {
    const id = String(scene.sceneId || "");

    if (!id) {
      throw new Error("Cannot register scene without sceneId.");
    }

    if (scenes[id]) {
      throw new Error("Duplicate sceneId: " + id);
    }

    scenes[id] = scene;
  }

  function get(sceneId) {
    return scenes[String(sceneId)] || null;
  }

  function has(sceneId) {
    return !!get(sceneId);
  }

  function list() {
    return Object.keys(scenes);
  }

  function unregister(sceneId) {
    delete scenes[String(sceneId)];
  }

  function reload(scene) {
    const id = String(scene.sceneId || "");

    if (id) {
      unregister(id);
    }

    register(scene);
  }

  function clear() {
    for (const key of Object.keys(scenes)) {
      delete scenes[key];
    }
  }

  SED.SceneRegistry = {
    register,
    unregister,
    reload,
    get,
    has,
    list,
    clear
  };

  SED.registerModule("SceneRegistry", "0.1.0");
})();
