(() => {
  "use strict";

  const SED = window.SED;

  SED.InputBuffer = {
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
    }
  };

  const _Window_Message_updateInput = Window_Message.prototype.updateInput;
  Window_Message.prototype.updateInput = function() {
    if (SED.Runner && SED.Runner.isBusy() && SED.InputBuffer && Input.isTriggered("ok") && !this.isAnySubWindowActive()) {
      SED.InputBuffer.flagOk();
    }
    return _Window_Message_updateInput.apply(this, arguments);
  };

  const _Window_ChoiceList_update = Window_ChoiceList.prototype.update;
  Window_ChoiceList.prototype.update = function() {
    _Window_ChoiceList_update.apply(this, arguments);
    if (this.active && this.isOpen() && SED.Runner && SED.Runner.isBusy() && SED.InputBuffer && SED.InputBuffer.consumeOk()) {
      this.processOk();
    }
  };

  SED.registerModule("InputBuffer", "0.4.0");
})();
