(() => {
  "use strict";

  const SED = window.SED;

  const history = [];

  function push(level, args) {
    const item = {
      level,
      frame: Graphics.frameCount,
      message: Array.from(args).map(String).join(" ")
    };

    history.push(item);
    if (history.length > 100) history.shift();

    if (!SED.Params || SED.Params.debug) {
      console[level === "error" ? "error" : "log"]("[SED]", ...args);
    }
  }

  SED.Logger = {
    history,

    info() {
      push("info", arguments);
    },

    warn() {
      push("warn", arguments);
    },

    error() {
      push("error", arguments);
    },

    debug() {
      if (SED.Params && SED.Params.debug) {
        push("debug", arguments);
      }
    }
  };

  SED.registerModule("Logger", "0.1.0");
})();
