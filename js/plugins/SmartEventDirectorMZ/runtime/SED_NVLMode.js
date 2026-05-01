(() => {
  "use strict";

  const SED = window.SED;

  let _window = null;
  let _backlog = [];
  let _active = false;
  let _speaker = "";
  let _text = "";

  function ensureWindow() {
    if (_window) return _window;
    _window = new Window_Base(new Rectangle(0, 0, Graphics.boxWidth, Graphics.boxHeight));
    _window.opacity = 0;
    _window.contentsOpacity = 255;
    _window.hide();
    SceneManager._scene.addChild(_window);
    return _window;
  }

  function activate() {
    _active = true;
    const win = ensureWindow();
    win.show();
    refresh();
  }

  function deactivate() {
    _active = false;
    if (_window) _window.hide();
  }

  function setLine(speaker, text) {
    _speaker = String(speaker || "");
    _text = String(text || "");
    if (_active) refresh();
  }

  function addToBacklog(speaker, text) {
    _backlog.push({ speaker: speaker || "", text: text || "", frame: Graphics.frameCount });
    if (_backlog.length > SED.Constants.NVL_MAX_BACKLOG) _backlog.shift();
  }

  function getBacklog() {
    return _backlog.slice();
  }

  function clearBacklog() {
    _backlog = [];
  }

  function refresh() {
    if (!_window) return;
    const win = _window;
    win.contents.clear();

    const pad = 24;
    const maxW = Graphics.boxWidth - pad * 2;
    const y = Graphics.boxHeight * 0.65;

    if (_speaker) {
      win.contents.fontSize = 24;
      win.contents.textColor = "#ffffff";
      win.contents.drawText(_speaker, pad, y - 40, maxW, 32, "left");
    }

    win.contents.fontSize = 22;
    win.contents.textColor = "#eeeeee";
    const lines = win.wordWrap(_text, maxW);
    let ty = y;
    for (const line of lines) {
      win.contents.drawText(line, pad, ty, maxW, 28, "left");
      ty += 30;
    }
  }

  function isActive() {
    return _active;
  }

  SED.NVLMode = {
    activate,
    deactivate,
    setLine,
    addToBacklog,
    getBacklog,
    clearBacklog,
    isActive
  };

  SED.registerModule("NVLMode", "2.0.0");
})();
