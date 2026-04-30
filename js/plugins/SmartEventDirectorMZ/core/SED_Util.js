(() => {
  "use strict";

  const SED = window.SED;

  function toBool(value, fallback) {
    if (value === undefined || value === null || value === "") return fallback;
    if (typeof value === "boolean") return value;
    return String(value) === "true";
  }

  function toNumber(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function characterFromId(id, interpreter) {
    const characterId = Number(id);

    if (characterId === -1) {
      return $gamePlayer;
    }

    if (characterId === 0 && interpreter && interpreter.character) {
      return interpreter.character(0);
    }

    if (characterId > 0 && $gameMap) {
      return $gameMap.event(characterId);
    }

    return null;
  }

  function directionFromText(value) {
    const map = {
      down: 2,
      left: 4,
      right: 6,
      up: 8
    };

    if (typeof value === "number") return value;
    return map[String(value || "").toLowerCase()] || 0;
  }

  function cloneJson(value) {
    return JSON.parse(JSON.stringify(value));
  }

  SED.Util = {
    toBool,
    toNumber,
    characterFromId,
    directionFromText,
    cloneJson
  };

  SED.registerModule("Util", "0.1.0");
})();
