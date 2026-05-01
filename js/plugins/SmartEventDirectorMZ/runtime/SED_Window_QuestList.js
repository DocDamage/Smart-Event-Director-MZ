(() => {
  "use strict";

  const SED = window.SED;

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

  window.Window_SED_QuestList = Window_SED_QuestList;
  SED.registerModule("Window_QuestList", "1.0.0");
})();
