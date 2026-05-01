(() => {
  "use strict";

  const SED = window.SED;

  function getDuration() {
    const dur = Number((SED.Params || {}).achievementToastDuration);
    return Number.isFinite(dur) && dur > 0 ? dur : SED.Constants.TOAST_DEFAULT_DURATION;
  }

  function getPosition(w, h) {
    const margin = 20;
    return {
      x: (Graphics.width - w) / 2,
      y: margin
    };
  }

  function playToastSound() {
    const seName = (SED.Params || {}).achievementToastSound || "";
    if (seName && AudioManager && AudioManager.playSe) {
      AudioManager.playSe({ name: seName, volume: 90, pitch: 100, pan: 0 });
    }
  }

  function drawToast(bitmap, data, opacity, width, height) {
    const alpha = opacity / 255;
    const bgColor = "rgba(80, 60, 20, " + (0.85 * alpha) + ")";

    bitmap.clear();
    bitmap.fillRect(0, 0, width, height, bgColor);
    bitmap.textSize = 16;
    bitmap.textColor = "rgba(255, 215, 100, " + alpha + ")";
    bitmap.drawText("Achievement Unlocked!", 10, 10, width - 20, 30, "center");

    bitmap.textSize = 14;
    bitmap.textColor = "rgba(255, 255, 255, " + alpha + ")";
    bitmap.drawText(data.title || "", 10, 45, width - 20, 24, "center");
  }

  const toast = SED.ToastManager.create({
    width: 400,
    height: 100,
    zIndex: 9998,
    defaultDuration: SED.Constants.TOAST_DEFAULT_DURATION,
    durationParam: "achievementToastDuration",
    getPosition: getPosition,
    animation: "none",
    cacheKey: "_sedAchievementToastSprite",
    onShow: playToastSound,
    draw: drawToast
  });

  function show(achievementId, title) {
    toast.show({ achievementId: String(achievementId || ""), title: String(title || "") });
  }

  SED.AchievementToast = {
    show,
    update: toast.update,
    draw: toast.draw
  };

  SED.registerModule("AchievementToast", "0.2.0");

  if (SED.UpdateDispatcher) {
    SED.UpdateDispatcher.register("AchievementToast", {
      update: function() { if (SED.AchievementToast && SED.AchievementToast.update) SED.AchievementToast.update(); },
      draw: function() { if (SED.AchievementToast && SED.AchievementToast.draw) SED.AchievementToast.draw(); },
      priority: 110,
      contexts: ["map"]
    });
  }
})();
