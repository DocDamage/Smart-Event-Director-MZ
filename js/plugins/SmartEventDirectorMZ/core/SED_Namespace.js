(() => {
  "use strict";

  const SED = window.SED = window.SED || {};

  SED.version = "0.2.0";
  SED.modules = SED.modules || {};

  SED.registerModule = function(name, version) {
    if (this.modules[name]) {
      console.warn("SED module loaded twice:", name);
    }

    this.modules[name] = {
      version: version || "0.0.0",
      loadedAt: Date.now()
    };
  };

  SED.assert = function(condition, message) {
    if (!condition) {
      throw new Error("[SED] " + message);
    }
  };

  SED.registerModule("Namespace", "0.2.0");
})();
