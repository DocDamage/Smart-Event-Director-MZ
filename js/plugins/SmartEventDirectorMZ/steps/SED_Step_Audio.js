(() => {
  "use strict";

  const SED = window.SED;

  // Audio changes are tracked by SED.Cleanup and restored on scene stop/fail.

  function playBgm(name, volume, pitch, pan) {
    if (!name) return;
    AudioManager.playBgm({ name: String(name), volume: Number(volume || 90), pitch: Number(pitch || 100), pan: Number(pan || 0) });
  }

  function playBgs(name, volume, pitch, pan) {
    if (!name) return;
    AudioManager.playBgs({ name: String(name), volume: Number(volume || 90), pitch: Number(pitch || 100), pan: Number(pan || 0) });
  }

  function playSe(name, volume, pitch, pan) {
    if (!name) return;
    AudioManager.playSe({ name: String(name), volume: Number(volume || 90), pitch: Number(pitch || 100), pan: Number(pan || 0) });
  }

  function playMe(name, volume, pitch, pan) {
    if (!name) return;
    AudioManager.playMe({ name: String(name), volume: Number(volume || 90), pitch: Number(pitch || 100), pan: Number(pan || 0) });
  }

  SED.StepRegistry.register({
    types: ["audio"],

    validate(step) {
      const errors = [];
      const validActions = ["bgm", "bgs", "se", "me", "stopBgm", "stopBgs", "stopAll"];

      if (validActions.indexOf(step.action) === -1) {
        errors.push("audio step unknown action: " + step.action + ". Valid: " + validActions.join(", "));
      }

      if ((step.action === "bgm" || step.action === "bgs" || step.action === "se" || step.action === "me") && !step.name) {
        errors.push("audio step needs name for action: " + step.action);
      }

      return errors;
    },

    start(step) {
      const action = String(step.action || "");

      if (action === "bgm") playBgm(step.name, step.volume, step.pitch, step.pan);
      else if (action === "bgs") playBgs(step.name, step.volume, step.pitch, step.pan);
      else if (action === "se") playSe(step.name, step.volume, step.pitch, step.pan);
      else if (action === "me") playMe(step.name, step.volume, step.pitch, step.pan);
      else if (action === "stopBgm") AudioManager.stopBgm();
      else if (action === "stopBgs") AudioManager.stopBgs();
      else if (action === "stopAll") {
        AudioManager.stopBgm();
        AudioManager.stopBgs();
        AudioManager.stopMe();
      }
    },

    update() {
      return true;
    }
  });

  SED.registerModule("Step_Audio", "0.2.0");
})();
