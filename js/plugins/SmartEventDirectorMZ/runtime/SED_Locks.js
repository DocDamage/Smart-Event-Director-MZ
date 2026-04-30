(() => {
  "use strict";

  const SED = window.SED;

  const state = {
    player: 0
  };

  function lockPlayer() {
    state.player += 1;
  }

  function unlockPlayer() {
    state.player = Math.max(0, state.player - 1);
  }

  function forceUnlockAll() {
    state.player = 0;
  }

  function isPlayerLocked() {
    return state.player > 0;
  }

  const _Game_Player_canMove = Game_Player.prototype.canMove;
  Game_Player.prototype.canMove = function() {
    if (SED.Locks && SED.Locks.isPlayerLocked()) {
      return false;
    }

    return _Game_Player_canMove.apply(this, arguments);
  };

  SED.Locks = {
    lockPlayer,
    unlockPlayer,
    forceUnlockAll,
    isPlayerLocked
  };

  SED.registerModule("Locks", "0.1.0");
})();
