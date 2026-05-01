(() => {
  "use strict";

  const SED = window.SED;

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

    this.resetTextColor();
    this.changePaintOpacity(true);
    this.drawText(data.title || this._item.questId, 0, y, this.contentsWidth(), "left");
    y += lineH + 8;

    this.changeTextColor(statusColor(status.questState));
    this.drawText("Status: " + statusText(status.questState), 0, y, this.contentsWidth(), "left");
    this.resetTextColor();
    y += lineH + 8;

    if (data.description) {
      const desc = SED.Util.interpolateText(data.description);
      const lines = desc.split(/\r\n|\r|\n/);
      for (let i = 0; i < lines.length; i++) {
        this.drawText(lines[i], 0, y, this.contentsWidth(), "left");
        y += lineH;
      }
      y += 8;
    }

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

  window.Window_SED_QuestDetail = Window_SED_QuestDetail;
  SED.registerModule("Window_QuestDetail", "1.0.0");
})();
