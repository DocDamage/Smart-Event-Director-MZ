(() => {
  "use strict";

  const SED = window.SED;

  let overlayVisible = false;
  let textCache = [];

  function isEnabled() {
    return SED.Params && SED.Params.enableDebugOverlay;
  }

  function toggle() {
    overlayVisible = !overlayVisible;
  }

  function show() {
    overlayVisible = true;
  }

  function hide() {
    overlayVisible = false;
  }

  function update() {
    if (!isEnabled() || !overlayVisible) return;

    const runner = SED.Runner;
    const lines = [];

    if (runner.isBusy()) {
      const scene = runner._scene;
      const context = runner._context;
      const queue = runner._queue;
      const step = runner._activeStep;

      lines.push("SED v" + (SED.version || "0.2.0"));
      lines.push("Scene: " + (scene ? scene.sceneId : "?"));
      lines.push("State: " + runner._state);
      lines.push("Step: " + (step ? step.type : "none"));
      lines.push("Index: " + (queue ? queue.currentIndex() : "?") + "/" + (scene && scene.steps ? scene.steps.length : "?"));
      lines.push("Frame: " + Graphics.frameCount);
      lines.push("Locked: " + (SED.Locks && SED.Locks.isPlayerLocked() ? "Yes" : "No"));
      lines.push("Timeout: " + (runner._sceneTimeoutFrame ? Math.max(0, runner._sceneTimeoutFrame - Graphics.frameCount) + " frames left" : "none"));
    } else {
      lines.push("SED v" + (SED.version || "0.2.0"));
      lines.push("Idle");
    }

    // v0.3: Show quest and relationship state
    if (SED.QuestState) {
      const activeQuests = SED.QuestState.getActiveQuests();
      if (activeQuests.length > 0) {
        lines.push("--- Active Quests ---");
        activeQuests.forEach(function(q) {
          const qs = SED.QuestState._getRawState(q.questId);
          if (qs) {
            const doneCount = Object.keys(qs.objectives).filter(function(k) { return qs.objectives[k]; }).length;
            const totalCount = Object.keys(qs.objectives).length;
            lines.push(q.title + " (" + doneCount + "/" + totalCount + ")");
          }
        });
      }
    }

    if (SED.RelationshipState) {
      const rels = SED.RelationshipState.getRelationships();
      const relKeys = Object.keys(rels);
      if (relKeys.length > 0) {
        lines.push("--- Relationships ---");
        relKeys.forEach(function(key) {
          lines.push(key + ": " + rels[key]);
        });
      }
    }

    if (SED.Profiler && SED.Profiler.getFrameStats) {
      const stats = SED.Profiler.getFrameStats();
      if (stats && stats.average) {
        lines.push("Avg Frame: " + stats.average.toFixed(2) + " ms");
      }
    }

    textCache = lines;

    if (SED.EventBus) {
      SED.EventBus.emit(SED.EventBus.Events.OVERLAY_UPDATE);
    }
  }

  function draw() {
    if (!isEnabled() || !overlayVisible) return;
    if (!SceneManager._scene) return;

    const scene = SceneManager._scene;
    const width = Graphics.width;
    const height = textCache.length * 20 + 10;

    if (!scene._sedOverlaySprite) {
      scene._sedOverlaySprite = new Sprite();
      scene._sedOverlaySprite.bitmap = new Bitmap(300, height);
      scene._sedOverlaySprite.x = width - 310;
      scene._sedOverlaySprite.y = 0;
      scene._sedOverlaySprite.z = 10000;

      if (scene.addChild) {
        scene.addChild(scene._sedOverlaySprite);
      }
    }

    const bitmap = scene._sedOverlaySprite.bitmap;
    bitmap.clear();

    bitmap.fillRect(0, 0, 300, height, "rgba(0, 0, 0, 0.6)");

    textCache.forEach(function(text, index) {
      bitmap.textSize = 14;
      bitmap.drawText(text, 5, 5 + index * 20, 290, 18, "left");
    });

    if (SED.EventBus) {
      SED.EventBus.emit(SED.EventBus.Events.OVERLAY_DRAW);
    }
  }

  const _Scene_Map_createDisplayObjects = Scene_Map.prototype.createDisplayObjects;
  Scene_Map.prototype.createDisplayObjects = function() {
    _Scene_Map_createDisplayObjects.apply(this, arguments);

    if (isEnabled() && overlayVisible) {
      const sprite = new Sprite();
      sprite.bitmap = new Bitmap(300, 100);
      sprite.x = Graphics.width - 310;
      sprite.y = 0;
      sprite.z = 10000;
      this._sedOverlaySprite = sprite;
      this.addChild(sprite);
    }
  };

  SED.DebugOverlay = {
    toggle: toggle,
    show: show,
    hide: hide,
    update: update,
    draw: draw
  };

  SED.registerModule("DebugOverlay", "0.2.0");

  if (SED.UpdateDispatcher) {
    SED.UpdateDispatcher.register("DebugOverlay", {
      update: function() { if (SED.DebugOverlay && SED.DebugOverlay.update) SED.DebugOverlay.update(); },
      draw: function() { if (SED.DebugOverlay && SED.DebugOverlay.draw) SED.DebugOverlay.draw(); },
      priority: 200,
      contexts: ["map"]
    });
  }
})();
