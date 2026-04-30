(() => {
  "use strict";

  const SED = window.SED;

  let _speed = 0;
  let _autoAdvance = 0;
  let _overrideSpeed = null;
  let _overrideAutoAdvance = null;

  SED.TextEffects = {
    setSpeed(frames) {
      _speed = Number(frames) || 0;
    },

    getSpeed() {
      return _overrideSpeed !== null ? _overrideSpeed : _speed;
    },

    setAutoAdvance(frames) {
      _autoAdvance = Number(frames) || 0;
    },

    getAutoAdvance() {
      return _overrideAutoAdvance !== null ? _overrideAutoAdvance : _autoAdvance;
    },

    pushOverride(speed, autoAdvance) {
      _overrideSpeed = speed !== undefined ? Number(speed) : null;
      _overrideAutoAdvance = autoAdvance !== undefined ? Number(autoAdvance) : null;
    },

    clearOverride() {
      _overrideSpeed = null;
      _overrideAutoAdvance = null;
    }
  };

  const _processCharacter = Window_Message.prototype.processCharacter;
  Window_Message.prototype.processCharacter = function(textState) {
    _processCharacter.apply(this, arguments);
    const speed = SED.TextEffects ? SED.TextEffects.getSpeed() : 0;
    if (speed > 0 && !this._showFast && !this._lineShowFast) {
      this.startWait(speed);
    }
  };

  const _update = Window_Message.prototype.update;
  Window_Message.prototype.update = function() {
    _update.apply(this, arguments);
    const auto = SED.TextEffects ? SED.TextEffects.getAutoAdvance() : 0;
    if (auto > 0 && this.visible && this._pauseSkip && !this._waitCount) {
      if (!this._sedAutoTimer) this._sedAutoTimer = auto;
      this._sedAutoTimer--;
      if (this._sedAutoTimer <= 0) {
        this._sedAutoTimer = 0;
        this.terminateMessage();
      }
    } else {
      this._sedAutoTimer = 0;
    }
  };

  SED.registerModule("TextEffects", "0.4.0");
})();
