(() => {
  "use strict";

  const SED = window.SED;

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

  window.Window_SED_QuestCategory = Window_SED_QuestCategory;
  SED.registerModule("Window_QuestCategory", "1.0.0");
})();
