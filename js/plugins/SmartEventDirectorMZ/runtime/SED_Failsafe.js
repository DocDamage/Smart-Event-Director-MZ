(() => {
  "use strict";

  const SED = window.SED;

  function recover(reason) {
    reason = reason || "unknown";

    if (SED.bootError && SED.Logger) {
      SED.Logger.error("SED boot error detected:", SED.bootError.message);
    }

    if (SED.Logger) {
      SED.Logger.warn("Failsafe recovery:", reason);
    }

    if (SED.Cleanup && SED.Cleanup.restore) {
      SED.Cleanup.restore();
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

    if (SED.Runner && SED.Runner._transferResumeData) {
      SED.Runner._transferResumeData = null;
    }
  }

  SED.Failsafe = {
    recover
  };

  SED.registerModule("Failsafe", "0.1.0");
})();
