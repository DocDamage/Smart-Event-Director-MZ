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

  function interpolateText(text) {
    if (typeof text !== "string") return String(text || "");

    return text
      .replace(/\\v\[(\d+)\]/g, function(match, n) {
        return String($gameVariables.value(Number(n)));
      })
      .replace(/\\n\[(\d+)\]/g, function(match, n) {
        const actor = $dataActors[Number(n)];
        return actor ? actor.name : "";
      })
      .replace(/\\p\[(\d+)\]/g, function(match, n) {
        const actor = $gameParty.members()[Number(n) - 1];
        return actor ? actor.name() : "";
      })
      .replace(/\\\\/g, "\\");
  }

  SED.Util = {
    toBool,
    toNumber,
    characterFromId,
    directionFromText,
    cloneJson,
    interpolateText
  };

  SED.registerModule("Util", "0.4.0");
})();
