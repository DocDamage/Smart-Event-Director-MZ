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
      .replace(/\\t\[([^\]]+)\]/g, function(match, key) {
        return SED.Locale && SED.Locale.get ? SED.Locale.get(key, key) : key;
      })
      .replace(/\\\\/g, "\\");
  }

  function interpolateDeep(value) {
    if (typeof value === "string") {
      return interpolateText(value);
    }
    if (Array.isArray(value)) {
      return value.map(interpolateDeep);
    }
    if (value !== null && typeof value === "object") {
      const result = {};
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          result[key] = interpolateDeep(value[key]);
        }
      }
      return result;
    }
    return value;
  }

  function parseIdList(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(Number).filter(Number.isFinite);
    return String(value).split(",").map(s => Number(s.trim())).filter(Number.isFinite);
  }

  function evaluateCondition(condition) {
    if (!condition || !condition.operator) return false;
    const op = String(condition.operator);

    if (op === "switchIs") {
      return $gameSwitches.value(Number(condition.switchId)) === (condition.value !== false);
    }
    if (op === "variableIs") {
      return Number($gameVariables.value(Number(condition.variableId))) === Number(condition.value);
    }
    if (op === "variableGte") {
      return Number($gameVariables.value(Number(condition.variableId))) >= Number(condition.value);
    }
    if (op === "variableLte") {
      return Number($gameVariables.value(Number(condition.variableId))) <= Number(condition.value);
    }
    if (op === "choiceIs") {
      const choice = SED.Save.getChoice(String(condition.choiceKey || ""));
      return choice && Number(choice.index) === Number(condition.choiceIndex);
    }
    if (op === "scenePlayed") {
      return !!SED.Save.getPlayed(String(condition.sceneId || ""));
    }
    if (op === "sceneCompleted") {
      return !!SED.Save.getCompleted(String(condition.sceneId || ""));
    }
    if (op === "hasItem") {
      return $gameParty.hasItem($dataItems[Number(condition.itemId || 0)]);
    }
    if (op === "goldGte") {
      return $gameParty.gold() >= Number(condition.value || 0);
    }
    if (op === "questActive") {
      return SED.QuestState && SED.QuestState.isActive(String(condition.questId || ""));
    }
    if (op === "questCompleted") {
      return SED.QuestState && SED.QuestState.isCompleted(String(condition.questId || ""));
    }
    if (op === "questFailed") {
      return SED.QuestState && SED.QuestState.isFailed(String(condition.questId || ""));
    }
    if (op === "questObjectiveDone") {
      const qs = SED.QuestState && SED.QuestState._getRawState ? SED.QuestState._getRawState(String(condition.questId || "")) : null;
      return !!(qs && qs.objectives[String(condition.objective || "")]);
    }
    if (op === "relationshipGte") {
      return SED.RelationshipState && SED.RelationshipState.getPoints(String(condition.target || "")) >= Number(condition.value || 0);
    }
    if (op === "relationshipLte") {
      return SED.RelationshipState && SED.RelationshipState.getPoints(String(condition.target || "")) <= Number(condition.value || 0);
    }
    if (op === "relationshipIs") {
      return SED.RelationshipState && SED.RelationshipState.getPoints(String(condition.target || "")) === Number(condition.value || 0);
    }

    return false;
  }

  SED.Util = {
    toBool,
    toNumber,
    characterFromId,
    directionFromText,
    cloneJson,
    interpolateText,
    interpolateDeep,
    parseIdList,
    evaluateCondition
  };

  SED.registerModule("Util", "1.1.0");
})();
