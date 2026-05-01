(() => {
  "use strict";

  const SED = window.SED;

  const _unlocked = new Set();
  const _timestamps = Object.create(null);

  function unlock(id) {
    const achievementId = String(id || "");
    if (!achievementId) return false;

    if (_unlocked.has(achievementId)) {
      return false;
    }

    _unlocked.add(achievementId);
    _timestamps[achievementId] = Graphics.frameCount;
    return true;
  }

  function isUnlocked(id) {
    return _unlocked.has(String(id || ""));
  }

  function getUnlockTime(id) {
    const achievementId = String(id || "");
    return _timestamps[achievementId] !== undefined ? _timestamps[achievementId] : null;
  }

  function getAll() {
    const result = [];
    const allIds = SED.AchievementRegistry ? SED.AchievementRegistry.listIds() : [];

    for (let i = 0; i < allIds.length; i++) {
      const achievementId = allIds[i];
      result.push({
        id: achievementId,
        unlocked: _unlocked.has(achievementId),
        timestamp: _timestamps[achievementId] || null
      });
    }

    return result;
  }

  function toJSON() {
    const data = Object.create(null);
    for (const id of _unlocked) {
      data[id] = _timestamps[id] || 0;
    }
    return data;
  }

  function fromJSON(data) {
    _unlocked.clear();
    for (const key of Object.keys(_timestamps)) {
      delete _timestamps[key];
    }

    if (!data || typeof data !== "object") return;

    for (const id in data) {
      if (Object.prototype.hasOwnProperty.call(data, id)) {
        _unlocked.add(id);
        _timestamps[id] = Number(data[id]) || 0;
      }
    }
  }

  function clear() {
    _unlocked.clear();
    for (const key of Object.keys(_timestamps)) {
      delete _timestamps[key];
    }
  }

  SED.AchievementState = {
    unlock,
    isUnlocked,
    getUnlockTime,
    getAll,
    toJSON,
    fromJSON,
    clear
  };

  SED.registerModule("AchievementState", "0.1.0");
})();
