(() => {
  "use strict";

  const SED = window.SED;

  function Scene_SED_QuestLog() {
    this.initialize(...arguments);
  }

  Scene_SED_QuestLog.prototype = Object.create(Scene_MenuBase.prototype);
  Scene_SED_QuestLog.prototype.constructor = Scene_SED_QuestLog;

  Scene_SED_QuestLog.prototype.create = function() {
    Scene_MenuBase.prototype.create.call(this);
    this.createCategoryWindow();
    this.createQuestListWindow();
    this.createDetailWindow();
  };

  Scene_SED_QuestLog.prototype.createCategoryWindow = function() {
    const ww = Math.floor(Graphics.boxWidth * 0.38);
    const wh = typeof this.calcWindowHeight === "function"
      ? this.calcWindowHeight(1, true)
      : 60;
    const rect = new Rectangle(0, 0, ww, wh);
    this._categoryWindow = new Window_SED_QuestCategory(rect);
    this._categoryWindow.setHandler("ok", this.onCategoryOk.bind(this));
    this._categoryWindow.setHandler("cancel", this.onCategoryCancel.bind(this));
    this.addWindow(this._categoryWindow);
  };

  Scene_SED_QuestLog.prototype.createQuestListWindow = function() {
    const ww = Math.floor(Graphics.boxWidth * 0.38);
    const wy = this._categoryWindow.height;
    const wh = Graphics.boxHeight - wy;
    const rect = new Rectangle(0, wy, ww, wh);
    this._listWindow = new Window_SED_QuestList(rect);
    this._listWindow.setHandler("ok", this.onListOk.bind(this));
    this._listWindow.setHandler("cancel", this.onListCancel.bind(this));
    this.addWindow(this._listWindow);
  };

  Scene_SED_QuestLog.prototype.createDetailWindow = function() {
    const wx = Math.floor(Graphics.boxWidth * 0.38);
    const ww = Graphics.boxWidth - wx;
    const rect = new Rectangle(wx, 0, ww, Graphics.boxHeight);
    this._detailWindow = new Window_SED_QuestDetail(rect);
    this.addWindow(this._detailWindow);
  };

  Scene_SED_QuestLog.prototype.start = function() {
    Scene_MenuBase.prototype.start.call(this);
    this._categoryWindow.select(0);
    this._categoryWindow.activate();
    this._listWindow.select(Math.max(0, this._listWindow.index()));
    this.refreshDetail();
  };

  Scene_SED_QuestLog.prototype.onCategoryChange = function(symbol) {
    this._listWindow.setCategory(symbol);
    this.refreshDetail();
  };

  Scene_SED_QuestLog.prototype.onCategoryOk = function() {
    this._listWindow.activate();
    if (this._listWindow.maxItems() > 0) {
      this._listWindow.select(0);
    }
  };

  Scene_SED_QuestLog.prototype.onCategoryCancel = function() {
    this.popScene();
  };

  Scene_SED_QuestLog.prototype.onListOk = function() {
    this._listWindow.activate();
  };

  Scene_SED_QuestLog.prototype.onListCancel = function() {
    this._listWindow.deselect();
    this._categoryWindow.activate();
  };

  Scene_SED_QuestLog.prototype.refreshDetail = function() {
    const item = this._listWindow.currentItem();
    this._detailWindow.setItem(item);
  };

  window.Scene_SED_QuestLog = Scene_SED_QuestLog;
  SED.registerModule("Scene_QuestLog", "1.0.0");
})();
