(() => {
  "use strict";

  const SED = window.SED;

  let _snapshot = null;

  function snapshotPictures() {
    const pictures = Object.create(null);
    const maxPictures = $gameScreen.maxPictures ? $gameScreen.maxPictures() : 100;

    for (let id = 1; id <= maxPictures; id++) {
      const pic = $gameScreen.picture(id);
      if (pic && pic.name && pic.name()) {
        pictures[id] = {
          name: pic.name(),
          origin: pic.origin(),
          x: pic.x(),
          y: pic.y(),
          scaleX: pic.scaleX(),
          scaleY: pic.scaleY(),
          opacity: pic.opacity(),
          blendMode: pic.blendMode()
        };
      }
    }

    return pictures;
  }

  function restorePictures(pictures) {
    const maxPictures = $gameScreen.maxPictures ? $gameScreen.maxPictures() : 100;

    for (let id = 1; id <= maxPictures; id++) {
      const wasShown = pictures && Object.prototype.hasOwnProperty.call(pictures, id);
      const isShown = $gameScreen.picture(id) !== null && $gameScreen.picture(id) !== undefined;

      if (!wasShown && isShown) {
        $gameScreen.erasePicture(id);
      } else if (wasShown) {
        const data = pictures[id];
        $gameScreen.showPicture(
          id,
          data.name,
          data.origin,
          data.x,
          data.y,
          data.scaleX,
          data.scaleY,
          data.opacity,
          data.blendMode
        );
      }
    }
  }

  function snapshot() {
    _snapshot = {
      bgm: AudioManager.saveBgm ? AudioManager.saveBgm() : null,
      bgs: AudioManager.saveBgs ? AudioManager.saveBgs() : null,
      pictures: snapshotPictures()
    };
  }

  function restore() {
    if (!_snapshot) return;

    if (_snapshot.bgm && AudioManager.replayBgm) {
      AudioManager.replayBgm(_snapshot.bgm);
    }

    if (_snapshot.bgs && AudioManager.replayBgs) {
      AudioManager.replayBgs(_snapshot.bgs);
    }

    if (AudioManager.stopMe) {
      AudioManager.stopMe();
    }

    restorePictures(_snapshot.pictures);
  }

  function clear() {
    _snapshot = null;
  }

  SED.Cleanup = {
    snapshot,
    restore,
    clear
  };

  SED.registerModule("Cleanup", "0.1.0");
})();
