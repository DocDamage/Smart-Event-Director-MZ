(() => {
  "use strict";

  const SED = window.SED;

  const MAX_ENTRIES = 100;
  const entries = [];
  let _visible = false;
  let _window = null;

  function addEntry(data) {
    const entry = {
      speaker: data.speaker || null,
      text: String(data.text || ""),
      faceName: data.faceName || null,
      faceIndex: Number(data.faceIndex || 0),
      timestamp: Graphics.frameCount
    };

    entries.push(entry);
    if (entries.length > MAX_ENTRIES) {
      entries.shift();
    }

    if (_window) {
      _window.refresh();
    }

    // v1.1: Also push to History for state snapshots
    if (SED.History && SED.History.addEntry) {
      SED.History.addEntry(data);
    }
  }

  function clear() {
    entries.length = 0;
    if (_window) {
      _window.refresh();
    }
  }

  function getEntries() {
    return entries.slice();
  }

  function isVisible() {
    return _visible;
  }

  function setVisible(value) {
    _visible = !!value;
    if (!_window) return;

    if (_visible) {
      _window.show();
      _window.activate();
      _window.refresh();
    } else {
      _window.hide();
      _window.deactivate();
    }
  }

  function toggle() {
    setVisible(!_visible);
  }

  function draw() {
    // Window handles its own rendering.
  }

  // ---- Window ----

  function Window_SED_DialogueLog() {
    this.initialize(...arguments);
  }

  Window_SED_DialogueLog.prototype = Object.create(Window_Selectable.prototype);
  Window_SED_DialogueLog.prototype.constructor = Window_SED_DialogueLog;

  Window_SED_DialogueLog.prototype.initialize = function(rect) {
    Window_Selectable.prototype.initialize.call(this, rect);
    this._closeText = "Press Cancel to close";
    this.backOpacity = 180;
    this.opacity = 255;
    this.setHandler("cancel", () => setVisible(false));
    this.refresh();
  };

  Window_SED_DialogueLog.prototype.maxItems = function() {
    return getEntries().length;
  };

  Window_SED_DialogueLog.prototype.itemHeight = function() {
    return 48;
  };

  Window_SED_DialogueLog.prototype.drawItem = function(index) {
    const entry = getEntries()[index];
    const rect = this.itemRect(index);
    let x = rect.x;
    const y = rect.y + 4;

    this.resetTextColor();
    this.changePaintOpacity(true);

    if (entry.faceName) {
      this.drawSmallFace(entry.faceName, entry.faceIndex, x, y, 40, 40);
      x += 48;
    }

    const text = entry.speaker ? entry.speaker + ": " + entry.text : entry.text;
    this.drawText(text, x, y, rect.width - (x - rect.x), "left");
  };

  Window_SED_DialogueLog.prototype.drawSmallFace = function(faceName, faceIndex, x, y, w, h) {
    const bitmap = ImageManager.loadFace(faceName);
    const pw = ImageManager.faceWidth;
    const ph = ImageManager.faceHeight;
    const sx = (faceIndex % 4) * pw;
    const sy = Math.floor(faceIndex / 4) * ph;

    if (bitmap.isReady()) {
      this.contents.blt(bitmap, sx, sy, pw, ph, x, y, w, h);
    } else {
      bitmap.addLoadListener(() => this.refresh());
    }
  };

  Window_SED_DialogueLog.prototype.paint = function() {
    Window_Selectable.prototype.paint.call(this);
    const y = this.contentsHeight() - this.lineHeight();
    this.drawText(this._closeText, 0, y, this.contentsWidth(), "center");
  };

  // ---- Scene Integration ----

  function createWindows(scene) {
    if (_window) return;
    const w = Math.min(600, Graphics.boxWidth - 40);
    const h = Math.min(400, Graphics.boxHeight - 40);
    const x = (Graphics.boxWidth - w) / 2;
    const y = (Graphics.boxHeight - h) / 2;
    const rect = new Rectangle(x, y, w, h);
    _window = new Window_SED_DialogueLog(rect);
    _window.hide();
    _window.deactivate();
    scene.addWindow(_window);
  }

  function update() {
    const logKey = SED.Params && SED.Params.dialogueLogKeyName ? SED.Params.dialogueLogKeyName : "pageup";
    if (Input.isTriggered(logKey)) {
      if (entries.length > 0) {
        toggle();
      }
    }

    if (_window) {
      if (_visible && !_window.active) {
        _window.activate();
      } else if (!_visible && _window.active) {
        _window.deactivate();
      }
    }
  }

  const _Scene_Map_createAllWindows = Scene_Map.prototype.createAllWindows;
  Scene_Map.prototype.createAllWindows = function() {
    _Scene_Map_createAllWindows.apply(this, arguments);
    createWindows(this);
  };

  // Clear log on game load
  const _DataManager_loadGame = DataManager.loadGame;
  DataManager.loadGame = function(savefileId) {
    const result = _DataManager_loadGame.apply(this, arguments);

    if (result && typeof result.then === "function") {
      return result.then(success => {
        if (success) clear();
        return success;
      });
    }

    if (result) clear();
    return result;
  };

  SED.DialogueLog = {
    addEntry,
    clear,
    getEntries,
    isVisible,
    setVisible,
    toggle,
    draw,
    createWindow: createWindows,
    createWindows,
    update
  };

  SED.registerModule("DialogueLog", "1.1.0");
})();
