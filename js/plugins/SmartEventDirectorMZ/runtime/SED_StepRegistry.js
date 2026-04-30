(() => {
  "use strict";

  const SED = window.SED;
  const handlers = Object.create(null);

  function register(handler) {
    if (!handler || !Array.isArray(handler.types)) {
      throw new Error("SED step handler must have types array.");
    }

    if (typeof handler.start !== "function") {
      throw new Error("SED step handler must have start().");
    }

    if (typeof handler.update !== "function") {
      throw new Error("SED step handler must have update().");
    }

    for (const type of handler.types) {
      if (handlers[type]) {
        throw new Error("Duplicate SED step handler type: " + type);
      }

      handlers[type] = handler;
    }
  }

  function get(type) {
    return handlers[type] || null;
  }

  function has(type) {
    return !!get(type);
  }

  function listTypes() {
    return Object.keys(handlers);
  }

  SED.StepRegistry = {
    register,
    get,
    has,
    listTypes
  };

  SED.registerModule("StepRegistry", "0.1.0");
})();
