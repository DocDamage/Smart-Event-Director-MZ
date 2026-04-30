(() => {
  "use strict";

  const SED = window.SED;

  const DEFAULT_DURATION = 180;
  const MAX_QUEUE = 5;
  const TOAST_WIDTH = 400;
  const TOAST_HEIGHT = 100;

  const queue = [];
  let activeToast = null;
  let _sprite = null;

  function getDuration() {
    const dur = Number((SED.Params || {}).achievementToastDuration);
    return Number.isFinite(dur) && dur > 0 ? dur : DEFAULT_DURATION;
  }

  function getPosition() {
    const margin = 20;
    return {
      x: (Graphics.width - TOAST_WIDTH) / 2,
      y: margin
    };
  }

  function playToastSound() {
    const seName = (SED.Params || {}).achievementToastSound || "";
    if (seName && AudioManager && AudioManager.playSe) {
      AudioManager.playSe({ name: seName, volume: 90, pitch: 100, pan: 0 });
    }
  }

  function show(achievementId, title, icon) {
    if (queue.length >= MAX_QUEUE) {
      queue.shift();
    }

    queue.push({
      achievementId: String(achievementId || ""),
      title: String(title || ""),
      icon: icon || null,
      timer: getDuration(),
      opacity: 0,
      phase: "fadeIn"
    });
  }

  function update() {
    if (!_sprite) {
      _sprite = new Sprite();
      _sprite.bitmap = new Bitmap(TOAST_WIDTH, TOAST_HEIGHT);
      _sprite.z = 9998;
      _sprite.visible = false;
    }

    const pos = getPosition();
    _sprite.baseX = pos.x;
    _sprite.baseY = pos.y;

    if (!activeToast && queue.length > 0) {
      activeToast = queue.shift();
      activeToast.timer = getDuration();
      activeToast.opacity = 0;
      activeToast.phase = "fadeIn";
      _sprite.visible = true;
      playToastSound();
    }

    if (!activeToast) {
      _sprite.visible = false;
      return;
    }

    if (activeToast.phase === "fadeIn") {
      activeToast.opacity = Math.min(255, activeToast.opacity + 15);
      if (activeToast.opacity >= 255) {
        activeToast.phase = "hold";
      }
    }

    if (activeToast.phase === "hold") {
      activeToast.timer--;
      if (activeToast.timer <= 60) {
        activeToast.phase = "fadeOut";
      }
    }

    if (activeToast.phase === "fadeOut") {
      activeToast.opacity = Math.max(0, activeToast.opacity - 15);
      if (activeToast.opacity <= 0) {
        activeToast = null;
        _sprite.visible = false;
      }
    }

    if (activeToast) {
      _sprite.x = _sprite.baseX;
      _sprite.y = _sprite.baseY;
    }
  }

  function draw() {
    if (!_sprite || !_sprite.visible || !activeToast) return;
    if (!SceneManager._scene) return;

    const scene = SceneManager._scene;
    if (!scene._sedAchievementToastSprite) {
      scene._sedAchievementToastSprite = _sprite;
      if (scene.addChild) {
        scene.addChild(_sprite);
      }
    }

    const toast = activeToast;
    const bitmap = _sprite.bitmap;
    bitmap.clear();

    const alpha = toast.opacity / 255;
    const bgColor = "rgba(80, 60, 20, " + (0.85 * alpha) + ")";

    bitmap.fillRect(0, 0, TOAST_WIDTH, TOAST_HEIGHT, bgColor);
    bitmap.textSize = 16;
    bitmap.textColor = "rgba(255, 215, 100, " + alpha + ")";
    bitmap.drawText("Achievement Unlocked!", 10, 10, 380, 30, "center");

    bitmap.textSize = 14;
    bitmap.textColor = "rgba(255, 255, 255, " + alpha + ")";

    const iconText = toast.icon ? "[" + toast.icon + "] " : "";
    bitmap.drawText(iconText + toast.title, 10, 45, 380, 24, "center");
  }

  SED.AchievementToast = {
    show,
    update,
    draw
  };

  SED.registerModule("AchievementToast", "0.1.0");
})();
