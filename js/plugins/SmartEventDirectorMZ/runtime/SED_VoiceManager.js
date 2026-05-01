(() => {
  "use strict";

  const SED = window.SED;

  let _activeVoiceName = null;
  let _ducked = false;
  let _savedBgmVolume = null;

  SED.VoiceManager = {
    play(name) {
      this.stop();
      this.duckBgm();
      _activeVoiceName = name;
      AudioManager.playSe({ name, volume: 90, pitch: 100, pan: 0 });
    },

    stop() {
      if (_activeVoiceName) {
        AudioManager.stopSe();
        _activeVoiceName = null;
      }
    },

    duckBgm() {
      if (_ducked) return;
      _savedBgmVolume = AudioManager.bgmVolume;
      AudioManager.bgmVolume = Math.floor(_savedBgmVolume * 0.3);
      _ducked = true;
    },

    restoreBgm() {
      if (!_ducked) return;
      AudioManager.bgmVolume = _savedBgmVolume;
      _savedBgmVolume = null;
      _ducked = false;
    }
  };

  SED.registerModule("VoiceManager", "1.0.0");
})();
