(() => {
  "use strict";

  const SED = window.SED;

  // --- Helpers ---
  function statusText(code) {
    if (code === SED.QuestState.QUEST_STATE.ACTIVE) return "Active";
    if (code === SED.QuestState.QUEST_STATE.COMPLETED) return "Completed";
    if (code === SED.QuestState.QUEST_STATE.FAILED) return "Failed";
    return "Unknown";
  }

  function statusColor(code) {
    if (code === SED.QuestState.QUEST_STATE.ACTIVE) return ColorManager.textColor(0);
    if (code === SED.QuestState.QUEST_STATE.COMPLETED) return "#66FF66";
    if (code === SED.QuestState.QUEST_STATE.FAILED) return "#FF6666";
    return ColorManager.textColor(7);
  }

  // --- Category Window ---
  function Window_SED_QuestCategory() {
    this.initialize(...arguments);
  }

  Window_SED_QuestCategory.prototype = Object.create(Window_Command.prototype);
  Window_SED_QuestCategory.prototype.constructor = Window_SED_QuestCategory;

  Window_SED_QuestCategory.prototype.initialize = function(rect) {
    Window_Command.prototype.initialize.call(this, rect);
  };

  Window_SED_QuestCategory.prototype.makeCommandList = function() {
    this.addCommand("Active", "active", true);
    this.addCommand("Completed", "completed", true);
    this.addCommand("Failed", "failed", true);
  };

  Window_SED_QuestCategory.prototype.maxCols = function() {
    return 3;
  };

  Window_SED_QuestCategory.prototype.select = function(index) {
    Window_Command.prototype.select.call(this, index);
    const scene = SceneManager._scene;
    if (scene instanceof Scene_SED_QuestLog) {
      scene.onCategoryChange(this.currentSymbol());
    }
  };

  // --- Quest List Window ---
  function Window_SED_QuestList() {
    this.initialize(...arguments);
  }

  Window_SED_QuestList.prototype = Object.create(Window_Selectable.prototype);
  Window_SED_QuestList.prototype.constructor = Window_SED_QuestList;

  Window_SED_QuestList.prototype.initialize = function(rect) {
    Window_Selectable.prototype.initialize.call(this, rect);
    this._category = "active";
    this._data = [];
    this.refresh();
  };

  Window_SED_QuestList.prototype.maxItems = function() {
    return this._data.length;
  };

  Window_SED_QuestList.prototype.setCategory = function(category) {
    if (this._category !== category) {
      this._category = category;
      this.refresh();
      this.select(0);
      this.scrollTo(0, 0);
    }
  };

  Window_SED_QuestList.prototype.makeItemList = function() {
    this._data = [];
    if (!SED.QuestRegistry || !SED.QuestState) return;
    const allIds = SED.QuestRegistry.list();
    for (let i = 0; i < allIds.length; i++) {
      const id = allIds[i];
      const status = SED.QuestState.getStatus(id);
      const state = status.questState;
      const qs = SED.QuestState.QUEST_STATE;
      let match = false;
      if (this._category === "active" && state === qs.ACTIVE) match = true;
      else if (this._category === "completed" && state === qs.COMPLETED) match = true;
      else if (this._category === "failed" && state === qs.FAILED) match = true;
      if (match) {
        const data = SED.QuestRegistry.get(id) || {};
        this._data.push({ questId: id, title: data.title || id, data: data, status: status });
      }
    }
  };

  Window_SED_QuestList.prototype.refresh = function() {
    this.makeItemList();
    Window_Selectable.prototype.refresh.call(this);
  };

  Window_SED_QuestList.prototype.drawItem = function(index) {
    const item = this._data[index];
    const rect = this.itemLineRect(index);
    this.resetTextColor();
    this.changePaintOpacity(true);
    this.drawText(item.title, rect.x, rect.y, rect.width, "left");
  };

  Window_SED_QuestList.prototype.currentItem = function() {
    return this._data[this.index()] || null;
  };

  Window_SED_QuestList.prototype.select = function(index) {
    Window_Selectable.prototype.select.call(this, index);
    const scene = SceneManager._scene;
    if (scene instanceof Scene_SED_QuestLog) {
      scene.refreshDetail();
    }
  };

  // --- Detail Window ---
  function Window_SED_QuestDetail() {
    this.initialize(...arguments);
  }

  Window_SED_QuestDetail.prototype = Object.create(Window_Base.prototype);
  Window_SED_QuestDetail.prototype.constructor = Window_SED_QuestDetail;

  Window_SED_QuestDetail.prototype.initialize = function(rect) {
    Window_Base.prototype.initialize.call(this, rect);
    this._item = null;
    this.refresh();
  };

  Window_SED_QuestDetail.prototype.setItem = function(item) {
    if (this._item !== item) {
      this._item = item;
      this.refresh();
    }
  };

  Window_SED_QuestDetail.prototype.refresh = function() {
    this.contents.clear();
    if (!this._item) {
      this.drawText("Select a quest.", 0, 0, this.contentsWidth(), "center");
      return;
    }

    const data = this._item.data;
    const status = this._item.status;
    const lineH = this.lineHeight();
    let y = 0;

    // Title
    this.resetTextColor();
    this.changePaintOpacity(true);
    this.drawText(data.title || this._item.questId, 0, y, this.contentsWidth(), "left");
    y += lineH + 8;

    // Status
    this.changeTextColor(statusColor(status.questState));
    this.drawText("Status: " + statusText(status.questState), 0, y, this.contentsWidth(), "left");
    this.resetTextColor();
    y += lineH + 8;

    // Description
    if (data.description) {
      const desc = SED.Util.interpolateText(data.description);
      const lines = desc.split(/\r\n|\r|\n/);
      for (let i = 0; i < lines.length; i++) {
        this.drawText(lines[i], 0, y, this.contentsWidth(), "left");
        y += lineH;
      }
      y += 8;
    }

    // Objectives header
    this.drawText("Objectives", 0, y, this.contentsWidth(), "left");
    y += lineH + 4;

    if (data.objectives && Array.isArray(data.objectives) && data.objectives.length > 0) {
      for (let i = 0; i < data.objectives.length; i++) {
        const obj = data.objectives[i];
        const key = String(obj.id || obj.key || obj.text);
        const done = !!status.objectives[key];
        const icon = done ? "[X]" : "[ ]";
        const text = String(obj.text || key);
        if (done) {
          this.changeTextColor("#66FF66");
        } else {
          this.resetTextColor();
        }
        this.drawText(icon + " " + text, this.itemPadding(), y, this.contentsWidth() - this.itemPadding() * 2, "left");
        y += lineH;
      }
    } else {
      this.changePaintOpacity(false);
      this.drawText("No objectives.", this.itemPadding(), y, this.contentsWidth() - this.itemPadding() * 2, "left");
      this.changePaintOpacity(true);
    }
  };

  // --- Scene ---
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

  // --- Public API ---
  SED.QuestLog = {
    open: function() {
      SceneManager.push(Scene_SED_QuestLog);
    }
  };

  SED.registerModule("QuestLog", "0.4.0");
})();
