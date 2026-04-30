(() => {
  "use strict";

  const SED = window.SED;

  let trackerVisible = false;
  let _sprite = null;

  const TRACKER_WIDTH = 280;
  const TRACKER_X_OFFSET = 10;
  const TRACKER_Y_OFFSET = 60;

  function toggle() {
    trackerVisible = !trackerVisible;
  }

  function show() {
    trackerVisible = true;
  }

  function hide() {
    trackerVisible = false;
  }

  function isVisible() {
    return trackerVisible;
  }

  function update() {
    // Nothing dynamic to update each frame currently.
  }

  function draw() {
    if (!trackerVisible) return;
    if (!SceneManager._scene) return;

    const scene = SceneManager._scene;

    if (!_sprite) {
      _sprite = new Sprite();
      _sprite.x = TRACKER_X_OFFSET;
      _sprite.y = TRACKER_Y_OFFSET;
      _sprite.z = 9998;
    }

    if (!scene._sedQuestTrackerSprite) {
      scene._sedQuestTrackerSprite = _sprite;
      if (scene.addChild) {
        scene.addChild(_sprite);
      }
    }

    const activeQuests = SED.QuestState.getActiveQuests();
    if (activeQuests.length === 0) {
      _sprite.visible = false;
      return;
    }

    _sprite.visible = true;

    // Calculate required height
    let height = 30; // header
    activeQuests.forEach(function(q) {
      height += 25; // quest title
      const qData = SED.QuestRegistry.get(q.questId);
      if (qData && Array.isArray(qData.objectives)) {
        height += qData.objectives.length * 20;
      }
    });
    height = Math.min(height, 400);

    const bitmap = _sprite.bitmap;
    if (bitmap.width !== TRACKER_WIDTH || bitmap.height !== height) {
      _sprite.bitmap = new Bitmap(TRACKER_WIDTH, height);
    }
    bitmap.clear();

    // Background
    bitmap.fillRect(0, 0, TRACKER_WIDTH, height, "rgba(0, 0, 0, 0.6)");

    // Header
    bitmap.textSize = 14;
    bitmap.textColor = "#FFD700";
    bitmap.drawText("Active Quests", 5, 5, TRACKER_WIDTH - 10, 22, "center");

    let y = 30;

    activeQuests.forEach(function(q) {
      const qData = SED.QuestRegistry.get(q.questId);
      const qs = SED.QuestState._getRawState(q.questId);

      // Quest title
      bitmap.textSize = 13;
      bitmap.textColor = "#FFFFFF";
      bitmap.drawText(q.title, 10, y, TRACKER_WIDTH - 20, 20, "left");
      y += 22;

      // Objectives
      if (qData && Array.isArray(qData.objectives)) {
        qData.objectives.forEach(function(obj) {
          const objKey = String(obj.id || obj.key || obj.text);
          const done = qs && qs.objectives[objKey];
          const icon = done ? "[X]" : "[ ]";
          const objText = String(obj.text || objKey);

          bitmap.textSize = 11;
          if (done) {
            bitmap.textColor = "#66FF66";
          } else {
            bitmap.textColor = "#CCCCCC";
          }
          bitmap.drawText(icon + " " + objText, 20, y, TRACKER_WIDTH - 30, 18, "left");
          y += 18;
        });
      }
    });
  }

  SED.QuestTracker = {
    toggle,
    show,
    hide,
    isVisible,
    update,
    draw
  };

  SED.registerModule("QuestTracker", "0.3.0");
})();
