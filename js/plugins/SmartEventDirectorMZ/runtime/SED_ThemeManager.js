(() => {
  "use strict";

  const SED = window.SED;

  const _themes = Object.create(null);
  let _currentThemeId = null;

  const _orig = {
    message: {},
    choice: {}
  };

  function saveOriginal(target, method, proto) {
    if (!_orig[target][method]) {
      _orig[target][method] = proto[method];
    }
  }

  function applyWindowSkin(skinName) {
    saveOriginal("message", "loadWindowskin", Window_Message.prototype);
    Window_Message.prototype.loadWindowskin = function() {
      this.windowskin = ImageManager.loadSystem(skinName);
    };
    saveOriginal("choice", "loadWindowskin", Window_ChoiceList.prototype);
    Window_ChoiceList.prototype.loadWindowskin = function() {
      this.windowskin = ImageManager.loadSystem(skinName);
    };
  }

  function applyFontSettings(fontFace, fontSize) {
    saveOriginal("message", "resetFontSettings", Window_Message.prototype);
    Window_Message.prototype.resetFontSettings = function() {
      _orig.message.resetFontSettings.apply(this, arguments);
      if (fontFace) this.contents.fontFace = fontFace;
      if (fontSize) this.contents.fontSize = fontSize;
    };
    saveOriginal("choice", "resetFontSettings", Window_ChoiceList.prototype);
    Window_ChoiceList.prototype.resetFontSettings = function() {
      _orig.choice.resetFontSettings.apply(this, arguments);
      if (fontFace) this.contents.fontFace = fontFace;
      if (fontSize) this.contents.fontSize = fontSize;
    };
  }

  function applyTextColor(rgb) {
    const colorStr = "rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")";
    saveOriginal("message", "resetTextColor", Window_Message.prototype);
    Window_Message.prototype.resetTextColor = function() {
      _orig.message.resetTextColor.apply(this, arguments);
      this.changeTextColor(colorStr);
    };
    saveOriginal("choice", "resetTextColor", Window_ChoiceList.prototype);
    Window_ChoiceList.prototype.resetTextColor = function() {
      _orig.choice.resetTextColor.apply(this, arguments);
      this.changeTextColor(colorStr);
    };
  }

  function applyChoicePosition(position) {
    saveOriginal("choice", "updatePlacement", Window_ChoiceList.prototype);
    Window_ChoiceList.prototype.updatePlacement = function() {
      _orig.choice.updatePlacement.apply(this, arguments);
      if (position === "top") {
        this.y = this._messageWindow.y - this.height;
      } else if (position === "bottom") {
        this.y = this._messageWindow.y + this._messageWindow.height;
      }
    };
  }

  function register(themeId, config) {
    _themes[String(themeId)] = config;
  }

  function apply(themeId) {
    const config = _themes[String(themeId)];
    if (!config) return;
    reset();

    if (config.windowSkin) {
      applyWindowSkin(config.windowSkin);
    }
    if (config.fontFace || config.fontSize) {
      applyFontSettings(config.fontFace, config.fontSize);
    }
    if (config.textColor) {
      applyTextColor(config.textColor);
    }
    if (config.choicePosition && config.choicePosition !== "default") {
      applyChoicePosition(config.choicePosition);
    }

    _currentThemeId = themeId;
  }

  function reset() {
    for (const method in _orig.message) {
      Window_Message.prototype[method] = _orig.message[method];
    }
    for (const method in _orig.choice) {
      Window_ChoiceList.prototype[method] = _orig.choice[method];
    }
    _currentThemeId = null;
  }

  SED.ThemeManager = {
    register,
    apply,
    reset
  };

  SED.registerModule("ThemeManager", "1.1.0");
})();
