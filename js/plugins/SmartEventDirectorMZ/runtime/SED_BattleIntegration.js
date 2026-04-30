(() => {
  "use strict";

  const SED = window.SED;

  // Patch Scene_Battle to update SED runner
  const _Scene_Battle_update = Scene_Battle.prototype.update;
  Scene_Battle.prototype.update = function() {
    _Scene_Battle_update.apply(this, arguments);
    if (SED.Runner && SED.Runner.update) {
      SED.Runner.update();
    }
  };

  // Stop any SED scene when battle ends to prevent leaks
  const _Scene_Battle_stop = Scene_Battle.prototype.stop;
  Scene_Battle.prototype.stop = function() {
    if (SED.Runner && SED.Runner.isBusy && SED.Runner.isBusy()) {
      SED.Runner.stop("battleEnd");
    }
    _Scene_Battle_stop.apply(this, arguments);
  };

  // Support sedScene wait mode in battle interpreters
  const _Game_Interpreter_updateWaitMode = Game_Interpreter.prototype.updateWaitMode;
  Game_Interpreter.prototype.updateWaitMode = function() {
    if (this._waitMode === "sedScene") {
      if (SED.Runner && SED.Runner.isBusy && SED.Runner.isBusy()) {
        return true;
      }
      this._waitMode = "";
      return false;
    }
    return _Game_Interpreter_updateWaitMode.apply(this, arguments);
  };

  SED.registerModule("BattleIntegration", "1.1.0");
})();
