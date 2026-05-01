(() => {
  "use strict";

  const SED = window.SED;

  function getParams() {
    return SED.Params || {};
  }

  function getDuration() {
    const dur = Number(getParams().questToastDuration);
    return Number.isFinite(dur) && dur > 0 ? dur : SED.Constants.TOAST_DEFAULT_DURATION;
  }

  function getPosition(w, h) {
    const pos = getParams().questToastPosition || "topRight";
    const margin = 20;
    switch (pos) {
      case "topLeft":
        return { x: margin, y: margin };
      case "topRight":
        return { x: Graphics.width - w - margin, y: margin };
      case "bottomLeft":
        return { x: margin, y: Graphics.height - h - margin };
      case "bottomRight":
        return { x: Graphics.width - w - margin, y: Graphics.height - h - margin };
      case "center":
        return { x: (Graphics.width - w) / 2, y: (Graphics.height - h) / 2 };
      default:
        return { x: Graphics.width - w - margin, y: margin };
    }
  }

  function getSlideVector() {
    const pos = getParams().questToastPosition || "topRight";
    const dist = 120;
    switch (pos) {
      case "topLeft":
      case "topRight":
        return { x: 0, y: -dist };
      case "bottomLeft":
      case "bottomRight":
        return { x: 0, y: dist };
      case "center":
        return { x: dist, y: 0 };
      default:
        return { x: 0, y: -dist };
    }
  }

  function getAnimation() {
    return getParams().questToastAnimation || "slide";
  }

  function playToastSound() {
    const seName = getParams().questToastSound || "";
    if (seName && AudioManager && AudioManager.playSe) {
      AudioManager.playSe({ name: seName, volume: 90, pitch: 100, pan: 0 });
    }
  }

  function drawToast(bitmap, data, opacity, width, height) {
    const alpha = opacity / 255;
    let bgColor = "rgba(50, 50, 50, " + (0.8 * alpha) + ")";
    if (data.type === "quest_started") {
      bgColor = "rgba(0, 80, 150, " + (0.8 * alpha) + ")";
    } else if (data.type === "quest_completed") {
      bgColor = "rgba(0, 120, 50, " + (0.8 * alpha) + ")";
    } else if (data.type === "quest_failed") {
      bgColor = "rgba(150, 30, 30, " + (0.8 * alpha) + ")";
    } else if (data.type === "relationship") {
      bgColor = "rgba(120, 40, 120, " + (0.8 * alpha) + ")";
    }

    bitmap.clear();
    bitmap.fillRect(0, 0, width, height, bgColor);
    bitmap.textSize = 16;
    bitmap.textColor = "rgba(255, 255, 255, " + alpha + ")";
    bitmap.drawText(data.message || "", 10, 10, width - 20, 30, "center");

    if (data.title && data.type !== "relationship") {
      bitmap.textSize = 13;
      bitmap.textColor = "rgba(200, 220, 255, " + alpha + ")";
      bitmap.drawText(data.title, 10, 45, width - 20, 20, "center");
    }
  }

  const toast = SED.ToastManager.create({
    width: 400,
    height: 120,
    zIndex: 9999,
    defaultDuration: SED.Constants.TOAST_DEFAULT_DURATION,
    durationParam: "questToastDuration",
    getPosition: getPosition,
    getSlideVector: getSlideVector,
    animation: getAnimation(),
    cacheKey: "_sedQuestToastSprite",
    onShow: playToastSound,
    draw: drawToast
  });

  function show(type, questId, title, message) {
    toast.show({
      type: String(type || "info"),
      questId: String(questId || ""),
      title: String(title || ""),
      message: String(message || "")
    });
  }

  function notifyQuestStarted(questId) {
    const qData = SED.QuestRegistry.get(questId);
    const title = qData ? qData.title : questId;
    show("quest_started", questId, title, "Quest Started: " + title);
  }

  function notifyQuestCompleted(questId) {
    const qData = SED.QuestRegistry.get(questId);
    const title = qData ? qData.title : questId;
    show("quest_completed", questId, title, "Quest Complete: " + title);
  }

  function notifyQuestFailed(questId) {
    const qData = SED.QuestRegistry.get(questId);
    const title = qData ? qData.title : questId;
    show("quest_failed", questId, title, "Quest Failed: " + title);
  }

  function notifyObjectiveUpdated(questId, objective) {
    const qData = SED.QuestRegistry.get(questId);
    const title = qData ? qData.title : questId;
    const objText = objective || "Objective Updated";
    show("objective_update", questId, title, objText + " - Complete!");
  }

  function notifyRelationshipChanged(target, delta, total) {
    const sign = delta >= 0 ? "+" : "";
    const message = target + ": " + sign + delta + " (" + total + " total)";
    show("relationship", "", target, message);
  }

  // Hook into quest events
  const _startQuest = SED.QuestState.startQuest;
  if (_startQuest) {
    SED.QuestState.startQuest = function(questId) {
      const result = _startQuest.apply(this, arguments);
      if (result) {
        notifyQuestStarted(questId);
      }
      return result;
    };
  }

  const _completeQuest = SED.QuestState.completeQuest;
  if (_completeQuest) {
    SED.QuestState.completeQuest = function(questId) {
      const result = _completeQuest.apply(this, arguments);
      if (result) {
        notifyQuestCompleted(questId);
      }
      return result;
    };
  }

  const _failQuest = SED.QuestState.failQuest;
  if (_failQuest) {
    SED.QuestState.failQuest = function(questId) {
      const result = _failQuest.apply(this, arguments);
      if (result) {
        notifyQuestFailed(questId);
      }
      return result;
    };
  }

  // Hook into relationship changes
  const _addPoints = SED.RelationshipState.addPoints;
  if (_addPoints) {
    SED.RelationshipState.addPoints = function(target, amount) {
      const oldVal = SED.RelationshipState.getPoints(target);
      _addPoints.apply(this, arguments);
      const newVal = SED.RelationshipState.getPoints(target);
      const delta = newVal - oldVal;
      if (delta !== 0) {
        setTimeout(function() {
          notifyRelationshipChanged(target, delta, newVal);
        }, 100);
      }
    };
  }

  SED.QuestToast = {
    show,
    notifyQuestStarted,
    notifyQuestCompleted,
    notifyQuestFailed,
    notifyObjectiveUpdated,
    update: toast.update,
    draw: toast.draw
  };

  SED.registerModule("QuestToast", "0.5.0");

  if (SED.UpdateDispatcher) {
    SED.UpdateDispatcher.register("QuestToast", {
      update: function() { if (SED.QuestToast && SED.QuestToast.update) SED.QuestToast.update(); },
      draw: function() { if (SED.QuestToast && SED.QuestToast.draw) SED.QuestToast.draw(); },
      priority: 100,
      contexts: ["map"]
    });
  }
})();
