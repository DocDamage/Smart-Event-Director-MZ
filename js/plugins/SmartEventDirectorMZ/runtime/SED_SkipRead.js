(() => {
  "use strict";

  const SED = window.SED;
  const seen = new Set();
  let _enabled = true;
  let _fastSpeed = 0;

  function hash(text, speaker) {
    const str = String(speaker || "") + "::" + String(text || "");
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h) + str.charCodeAt(i);
      h |= 0;
    }
    return String(h);
  }

  function markSeen(text, speaker) {
    seen.add(hash(text, speaker));
  }

  function isSeen(text, speaker) {
    return seen.has(hash(text, speaker));
  }

  function shouldSkip(step) {
    if (!_enabled) return false;
    if (!step || step.type !== "dialogue") return false;
    return isSeen(step.text, step.speaker);
  }

  function enable() {
    _enabled = true;
  }

  function disable() {
    _enabled = false;
  }

  function setFastSpeed(frames) {
    _fastSpeed = Math.max(0, Number(frames || 0));
  }

  function getFastSpeed() {
    return _fastSpeed;
  }

  function toJSON() {
    return Array.from(seen);
  }

  function fromJSON(data) {
    seen.clear();
    if (Array.isArray(data)) {
      data.forEach(id => seen.add(String(id)));
    }
  }

  SED.SkipRead = {
    hash,
    markSeen,
    isSeen,
    shouldSkip,
    enable,
    disable,
    setFastSpeed,
    getFastSpeed,
    toJSON,
    fromJSON
  };

  SED.registerModule("SkipRead", "2.0.0");
})();
