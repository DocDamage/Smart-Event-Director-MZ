(() => {
  "use strict";

  const SED = window.SED;

  const DEFAULT_DURATION = 180;
  const MAX_QUEUE = 5;
  const TOAST_WIDTH = 400;
  const TOAST_HEIGHT = 120;

  const queue = [];
  let activeToast = null;
  let _sprite = null;

  function getParams() {
    return SED.Params || {};
  }

  function getDuration() {
    const dur = Number(getParams().questToastDuration);
    return Number.isFinite(dur) && dur > 0 ? dur : DEFAULT_DURATION;
  }

  function getPosition() {
    const pos = getParams().questToastPosition || "topRight";
    const margin = 20;
    switch (pos) {
      case "topLeft":
        return { x: margin, y: margin };
      case "topRight":
        return { x: Graphics.width - TOAST_WIDTH - margin, y: margin };
      case "bottomLeft":
        return { x: margin, y: Graphics.height - TOAST_HEIGHT - margin };
      case "bottomRight":
        return { x: Graphics.width - TOAST_WIDTH - margin, y: Graphics.height - TOAST_HEIGHT - margin };
      case "center":
        return { x: (Graphics.width - TOAST_WIDTH) / 2, y: (Graphics.height - TOAST_HEIGHT) / 2 };
      default:
        return { x: Graphics.width - TOAST_WIDTH - margin, y: margin };
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

  function show(type, questId, title, message) {
    if (queue.length >= MAX_QUEUE) {
      queue.shift();
    }

    queue.push({
      type: String(type || "info"),
      questId: String(questId || ""),
      title: String(title || ""),
      message: String(message || ""),
      timer: getDuration(),
      opacity: 0,
      slideProgress: 1,
      phase: "fadeIn"
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

  function update() {
    if (!_sprite) {
      _sprite = new Sprite();
      _sprite.bitmap = new Bitmap(TOAST_WIDTH, TOAST_HEIGHT);
      _sprite.z = 9999;
      _sprite.visible = false;
    }

    const pos = getPosition();
    _sprite.baseX = pos.x;
    _sprite.baseY = pos.y;

    const anim = getAnimation();
    const slideVec = getSlideVector();

    // Process queue
    if (!activeToast && queue.length > 0) {
      activeToast = queue.shift();
      activeToast.timer = getDuration();
      activeToast.opacity = 0;
      activeToast.slideProgress = 1;
      activeToast.phase = "fadeIn";
      _sprite.visible = true;
      playToastSound();
    }

    if (!activeToast) {
      _sprite.visible = false;
      return;
    }

    // Fade in
    if (activeToast.phase === "fadeIn") {
      if (anim === "none") {
        activeToast.opacity = 255;
        activeToast.slideProgress = 0;
      } else {
        activeToast.opacity = Math.min(255, activeToast.opacity + 15);
        if (anim === "slide") {
          activeToast.slideProgress = Math.max(0, activeToast.slideProgress - 0.08);
        } else {
          activeToast.slideProgress = 0;
        }
      }

      if (activeToast.opacity >= 255 && activeToast.slideProgress <= 0) {
        activeToast.opacity = 255;
        activeToast.slideProgress = 0;
        activeToast.phase = "hold";
      }
    }

    // Hold
    if (activeToast.phase === "hold") {
      activeToast.timer--;
      if (activeToast.timer <= 60) {
        activeToast.phase = "fadeOut";
      }
    }

    // Fade out
    if (activeToast.phase === "fadeOut") {
      if (anim === "none") {
        activeToast.opacity = 0;
        activeToast.slideProgress = 1;
      } else {
        activeToast.opacity = Math.max(0, activeToast.opacity - 15);
        if (anim === "slide") {
          activeToast.slideProgress = Math.min(1, activeToast.slideProgress + 0.08);
        } else {
          activeToast.slideProgress = 0;
        }
      }

      if (activeToast.opacity <= 0 && (anim !== "slide" || activeToast.slideProgress >= 1)) {
        activeToast.opacity = 0;
        activeToast = null;
        _sprite.visible = false;
      }
    }

    // Apply transform
    if (activeToast) {
      _sprite.x = _sprite.baseX + slideVec.x * activeToast.slideProgress;
      _sprite.y = _sprite.baseY + slideVec.y * activeToast.slideProgress;
    }
  }

  function draw() {
    if (!_sprite || !_sprite.visible || !activeToast) return;
    if (!SceneManager._scene) return;

    // Ensure sprite is added to the scene
    const scene = SceneManager._scene;
    if (!scene._sedQuestToastSprite) {
      scene._sedQuestToastSprite = _sprite;
      if (scene.addChild) {
        scene.addChild(_sprite);
      }
    }

    const toast = activeToast;
    const bitmap = _sprite.bitmap;
    bitmap.clear();

    const alpha = toast.opacity / 255;

    // Background color based on type
    let bgColor = "rgba(50, 50, 50, " + (0.8 * alpha) + ")";
    if (toast.type === "quest_started") {
      bgColor = "rgba(0, 80, 150, " + (0.8 * alpha) + ")";
    } else if (toast.type === "quest_completed") {
      bgColor = "rgba(0, 120, 50, " + (0.8 * alpha) + ")";
    } else if (toast.type === "quest_failed") {
      bgColor = "rgba(150, 30, 30, " + (0.8 * alpha) + ")";
    } else if (toast.type === "relationship") {
      bgColor = "rgba(120, 40, 120, " + (0.8 * alpha) + ")";
    }

    bitmap.fillRect(0, 0, TOAST_WIDTH, TOAST_HEIGHT, bgColor);
    bitmap.textSize = 16;
    bitmap.textColor = "rgba(255, 255, 255, " + alpha + ")";

    // Draw title
    bitmap.drawText(toast.message, 10, 10, 380, 30, "center");

    // Draw quest title if present
    if (toast.title && toast.type !== "relationship") {
      bitmap.textSize = 13;
      bitmap.textColor = "rgba(200, 220, 255, " + alpha + ")";
      bitmap.drawText(toast.title, 10, 45, 380, 20, "center");
    }
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
        // Use a small delay to avoid drawing during scene transitions
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
    update,
    draw
  };

  SED.registerModule("QuestToast", "0.4.0");
})();
