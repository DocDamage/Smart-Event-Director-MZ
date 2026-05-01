(() => {
  "use strict";

  const SED = window.SED;

  const InputManager = {
    _ok: false,

    flagOk() {
      this._ok = true;
    },

    consumeOk() {
      if (this._ok) {
        this._ok = false;
        return true;
      }
      return false;
    },

    clear() {
      this._ok = false;
    },

    isOkFlagged() {
      return this._ok;
    }
  };

  SED.InputManager = InputManager;

  // Backward compatibility alias
  SED.InputBuffer = InputManager;

  SED.registerModule("InputManager", "1.0.0");
})();
