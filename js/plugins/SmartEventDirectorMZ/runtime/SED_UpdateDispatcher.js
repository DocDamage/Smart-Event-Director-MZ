(() => {
  "use strict";

  const SED = window.SED;

  const UpdateDispatcher = {
    _entries: [],

    register(name, options) {
      if (!name || typeof name !== "string") return;
      options = options || {};

      // Remove existing entry with same name to prevent duplicates
      this._entries = this._entries.filter(e => e.name !== name);

      this._entries.push({
        name: name,
        update: typeof options.update === "function" ? options.update : null,
        draw: typeof options.draw === "function" ? options.draw : null,
        priority: Number(options.priority) || 0,
        contexts: Array.isArray(options.contexts) ? options.contexts : ["map"]
      });

      this._entries.sort((a, b) => a.priority - b.priority);
    },

    unregister(name) {
      this._entries = this._entries.filter(e => e.name !== name);
    },

    update(context) {
      context = context || "map";
      for (let i = 0; i < this._entries.length; i++) {
        const e = this._entries[i];
        if (e.update && e.contexts.indexOf(context) >= 0) {
          try {
            e.update();
          } catch (err) {
            if (SED.Logger) {
              SED.Logger.error("UpdateDispatcher error in '" + e.name + "':", err.message);
            }
          }
        }
      }
    },

    draw(context) {
      context = context || "map";
      for (let i = 0; i < this._entries.length; i++) {
        const e = this._entries[i];
        if (e.draw && e.contexts.indexOf(context) >= 0) {
          try {
            e.draw();
          } catch (err) {
            if (SED.Logger) {
              SED.Logger.error("UpdateDispatcher draw error in '" + e.name + "':", err.message);
            }
          }
        }
      }
    },

    list() {
      return this._entries.map(e => e.name);
    }
  };

  SED.UpdateDispatcher = UpdateDispatcher;
  SED.registerModule("UpdateDispatcher", "1.0.0");
})();
