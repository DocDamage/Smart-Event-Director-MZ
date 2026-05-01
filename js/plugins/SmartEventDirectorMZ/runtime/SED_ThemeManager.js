(() => {
  "use strict";

  const SED = window.SED;

  const _themes = Object.create(null);
  let _activeTheme = null;

  function register(themeId, config) {
    _themes[String(themeId)] = config;
  }

  function getActiveTheme() {
    return _activeTheme ? _themes[_activeTheme] : null;
  }

  function apply(themeId) {
    const config = _themes[String(themeId)];
    if (!config) return;
    _activeTheme = themeId;
  }

  function reset() {
    _activeTheme = null;
  }

  // Formal theme hooks: single prototype delegation patches applied once at load time
  const _messageLoadWindowskin = Window_Message.prototype.loadWindowskin;
  Window_Message.prototype.loadWindowskin = function() {
    const theme = getActiveTheme();
    if (theme && theme.windowSkin) {
      this.windowskin = ImageManager.loadSystem(theme.windowSkin);
    } else {
      _messageLoadWindowskin.apply(this, arguments);
    }
  };

  const _messageResetFontSettings = Window_Message.prototype.resetFontSettings;
  Window_Message.prototype.resetFontSettings = function() {
    _messageResetFontSettings.apply(this, arguments);
    const theme = getActiveTheme();
    if (theme) {
      if (theme.fontFace && this.contents) this.contents.fontFace = theme.fontFace;
      if (theme.fontSize && this.contents) this.contents.fontSize = theme.fontSize;
    }
  };

  const _messageResetTextColor = Window_Message.prototype.resetTextColor;
  Window_Message.prototype.resetTextColor = function() {
    _messageResetTextColor.apply(this, arguments);
    const theme = getActiveTheme();
    if (theme && theme.textColor) {
      const colorStr = "rgb(" + theme.textColor[0] + "," + theme.textColor[1] + "," + theme.textColor[2] + ")";
      this.changeTextColor(colorStr);
    }
  };

  const _choiceLoadWindowskin = Window_ChoiceList.prototype.loadWindowskin;
  Window_ChoiceList.prototype.loadWindowskin = function() {
    const theme = getActiveTheme();
    if (theme && theme.windowSkin) {
      this.windowskin = ImageManager.loadSystem(theme.windowSkin);
    } else {
      _choiceLoadWindowskin.apply(this, arguments);
    }
  };

  const _choiceResetFontSettings = Window_ChoiceList.prototype.resetFontSettings;
  Window_ChoiceList.prototype.resetFontSettings = function() {
    _choiceResetFontSettings.apply(this, arguments);
    const theme = getActiveTheme();
    if (theme) {
      if (theme.fontFace && this.contents) this.contents.fontFace = theme.fontFace;
      if (theme.fontSize && this.contents) this.contents.fontSize = theme.fontSize;
    }
  };

  const _choiceResetTextColor = Window_ChoiceList.prototype.resetTextColor;
  Window_ChoiceList.prototype.resetTextColor = function() {
    _choiceResetTextColor.apply(this, arguments);
    const theme = getActiveTheme();
    if (theme && theme.textColor) {
      const colorStr = "rgb(" + theme.textColor[0] + "," + theme.textColor[1] + "," + theme.textColor[2] + ")";
      this.changeTextColor(colorStr);
    }
  };

  const _choiceUpdatePlacement = Window_ChoiceList.prototype.updatePlacement;
  Window_ChoiceList.prototype.updatePlacement = function() {
    _choiceUpdatePlacement.apply(this, arguments);
    const theme = getActiveTheme();
    if (theme && theme.choicePosition) {
      const position = theme.choicePosition;
      if (position === "top") {
        this.y = this._messageWindow.y - this.height;
      } else if (position === "bottom") {
        this.y = this._messageWindow.y + this._messageWindow.height;
      }
    }
  };

  SED.ThemeManager = {
    register,
    apply,
    reset,
    getActiveTheme
  };

  SED.registerModule("ThemeManager", "2.0.0");
})();
