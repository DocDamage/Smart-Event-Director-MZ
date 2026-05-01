(() => {
  "use strict";

  const SED = window.SED;

  // ---------------------------------------------------------------------------
  // Window_SED_AchievementViewer
  // ---------------------------------------------------------------------------

  function Window_SED_AchievementViewer() {
    this.initialize(...arguments);
  }

  Window_SED_AchievementViewer.prototype = Object.create(Window_Selectable.prototype);
  Window_SED_AchievementViewer.prototype.constructor = Window_SED_AchievementViewer;

  Window_SED_AchievementViewer.prototype.initialize = function(rect) {
    Window_Selectable.prototype.initialize.call(this, rect);
    this.refresh();
  };

  Window_SED_AchievementViewer.prototype.maxItems = function() {
    if (!SED.AchievementRegistry) return 0;
    return SED.AchievementRegistry.listIds().length;
  };

  Window_SED_AchievementViewer.prototype.itemHeight = function() {
    return 80;
  };

  Window_SED_AchievementViewer.prototype.makeItemList = function() {
    if (!SED.AchievementRegistry) return [];
    return SED.AchievementRegistry.listIds().map(function(id) {
      return SED.AchievementRegistry.get(id);
    }).filter(function(item) {
      return !!item;
    });
  };

  Window_SED_AchievementViewer.prototype.drawItem = function(index) {
    const items = this.makeItemList();
    const data = items[index];
    if (!data) return;

    const rect = this.itemRect(index);
    const achievementId = data.achievementId;
    const unlocked = SED.AchievementState && SED.AchievementState.isUnlocked(achievementId);
    const isSecret = !!data.secret;
    const padding = this.itemPadding();

    let title = data.title || achievementId;
    let description = data.description || "";

    if (!unlocked && isSecret) {
      title = "???";
      description = "???";
    }

    // Background highlight if unlocked
    if (unlocked) {
      this.contents.fillRect(rect.x, rect.y, rect.width, rect.height, "rgba(40, 60, 40, 0.3)");
    } else {
      this.contents.fillRect(rect.x, rect.y, rect.width, rect.height, "rgba(30, 30, 30, 0.3)");
    }

    // Icon area
    const iconSize = 48;
    const iconX = rect.x + padding;
    const iconY = rect.y + (rect.height - iconSize) / 2;

    if (unlocked && data.icon) {
      this.drawText(data.icon, iconX, iconY + 12, iconSize, "center");
    } else {
      this.changePaintOpacity(false);
      this.drawText("?", iconX, iconY + 12, iconSize, "center");
      this.changePaintOpacity(true);
    }

    // Title
    const textX = iconX + iconSize + padding;
    const textW = rect.width - iconSize - padding * 3;

    if (unlocked) {
      this.resetTextColor();
    } else {
      this.changePaintOpacity(false);
    }

    this.drawText(title, textX, rect.y + 8, textW, "left");

    // Secret indicator
    if (unlocked && isSecret) {
      this.changeTextColor(ColorManager.textColor(14));
      this.drawText("*", textX + this.textWidth(title) + 4, rect.y + 8, 20, "left");
      this.resetTextColor();
    }

    // Description
    this.contents.fontSize = 14;
    this.drawText(description, textX, rect.y + 36, textW, "left");
    this.contents.fontSize = this.standardFontSize();

    this.changePaintOpacity(true);
  };

  Window_SED_AchievementViewer.prototype.isCursorMovable = function() {
    return this.maxItems() > 0;
  };

  Window_SED_AchievementViewer.prototype.isOkEnabled = function() {
    return false;
  };

  // ---------------------------------------------------------------------------
  // Scene_SED_AchievementViewer
  // ---------------------------------------------------------------------------

  function Scene_SED_AchievementViewer() {
    this.initialize(...arguments);
  }

  Scene_SED_AchievementViewer.prototype = Object.create(Scene_MenuBase.prototype);
  Scene_SED_AchievementViewer.prototype.constructor = Scene_SED_AchievementViewer;

  Scene_SED_AchievementViewer.prototype.create = function() {
    Scene_MenuBase.prototype.create.call(this);
    this.createAchievementWindow();
  };

  Scene_SED_AchievementViewer.prototype.createAchievementWindow = function() {
    const rect = new Rectangle(0, 0, Graphics.boxWidth, Graphics.boxHeight);
    this._achievementWindow = new Window_SED_AchievementViewer(rect);
    this.addWindow(this._achievementWindow);
  };

  Scene_SED_AchievementViewer.prototype.update = function() {
    Scene_MenuBase.prototype.update.call(this);
    if (this.isCancelTriggered()) {
      this.popScene();
    }
  };

  Scene_SED_AchievementViewer.prototype.isCancelTriggered = function() {
    const cancelKey = SED.Params && SED.Params.achievementViewerCancelKey ? SED.Params.achievementViewerCancelKey : "cancel";
    return Input.isTriggered(cancelKey) || TouchInput.isCancelled();
  };

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  SED.AchievementViewer = {
    open: function() {
      SceneManager.push(Scene_SED_AchievementViewer);
    }
  };

  SED.registerModule("AchievementViewer", "0.1.0");
})();
