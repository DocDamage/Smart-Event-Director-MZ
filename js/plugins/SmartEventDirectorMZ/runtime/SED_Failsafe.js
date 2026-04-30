(() => {
  "use strict";

  const SED = window.SED;

  function recover(reason) {
    reason = reason || "unknown";

    if (SED.Logger) {
      SED.Logger.warn("Failsafe recovery:", reason);
    }

    if (SED.Locks) {
      SED.Locks.forceUnlockAll();
    }

    if ($gameScreen) {
      $gameScreen.startFadeIn(1);
    }

    if (SED.Runner && SED.Runner._forceIdle) {
      SED.Runner._forceIdle();
    }
  }

  SED.Failsafe = {
    recover
  };

  SED.registerModule("Failsafe", "0.1.0");
})();
