(() => {
  "use strict";

  const SED = window.SED;

  // ---------------------------------------------------------------------------
  // Window_SED_RelationshipList
  // ---------------------------------------------------------------------------

  function Window_SED_RelationshipList() {
    this.initialize(...arguments);
  }

  Window_SED_RelationshipList.prototype = Object.create(Window_Selectable.prototype);
  Window_SED_RelationshipList.prototype.constructor = Window_SED_RelationshipList;

  Window_SED_RelationshipList.prototype.initialize = function(rect) {
    Window_Selectable.prototype.initialize.call(this, rect);
    this.refresh();
  };

  Window_SED_RelationshipList.prototype.maxItems = function() {
    const rels = this._getRelationships();
    return rels.length > 0 ? rels.length : 1;
  };

  Window_SED_RelationshipList.prototype._getRelationships = function() {
    if (SED.RelationshipState && typeof SED.RelationshipState.getRelationships === "function") {
      const data = SED.RelationshipState.getRelationships();
      const list = [];
      for (const name in data) {
        if (Object.prototype.hasOwnProperty.call(data, name)) {
          list.push({ name: name, value: data[name] });
        }
      }
      return list.sort(function(a, b) { return a.name.localeCompare(b.name); });
    }
    return [];
  };

  Window_SED_RelationshipList.prototype.drawItem = function(index) {
    const rels = this._getRelationships();
    const rect = this.itemLineRect(index);

    if (rels.length === 0) {
      this.changePaintOpacity(false);
      this.drawText("No relationships recorded.", rect.x, rect.y, rect.width, "center");
      this.changePaintOpacity(true);
      return;
    }

    const rel = rels[index];
    if (!rel) return;

    const nameWidth = this.textWidth(rel.name);
    const valueText = String(rel.value);
    const valueWidth = this.textWidth(valueText);
    const padding = this.itemPadding();
    const maxWidth = rect.width - padding * 2;

    // Color coding
    if (rel.value < 0) {
      this.changeTextColor(ColorManager.textColor(10));
    } else if (rel.value === 0) {
      this.changeTextColor(ColorManager.textColor(7));
    } else {
      this.resetTextColor();
    }

    // Left: name
    this.drawText(rel.name, rect.x + padding, rect.y, maxWidth, "left");

    // Right: value
    this.drawText(valueText, rect.x + padding, rect.y, maxWidth, "right");

    this.resetTextColor();
  };

  Window_SED_RelationshipList.prototype.isCursorMovable = function() {
    return false;
  };

  Window_SED_RelationshipList.prototype.isOkEnabled = function() {
    return false;
  };

  // ---------------------------------------------------------------------------
  // Scene_SED_RelationshipViewer
  // ---------------------------------------------------------------------------

  function Scene_SED_RelationshipViewer() {
    this.initialize(...arguments);
  }

  Scene_SED_RelationshipViewer.prototype = Object.create(Scene_MenuBase.prototype);
  Scene_SED_RelationshipViewer.prototype.constructor = Scene_SED_RelationshipViewer;

  Scene_SED_RelationshipViewer.prototype.create = function() {
    Scene_MenuBase.prototype.create.call(this);
    this.createRelationshipWindow();
  };

  Scene_SED_RelationshipViewer.prototype.createRelationshipWindow = function() {
    const rect = new Rectangle(0, 0, Graphics.boxWidth, Graphics.boxHeight);
    this._relationshipWindow = new Window_SED_RelationshipList(rect);
    this.addWindow(this._relationshipWindow);
  };

  Scene_SED_RelationshipViewer.prototype.update = function() {
    Scene_MenuBase.prototype.update.call(this);
    if (this.isCancelTriggered()) {
      this.popScene();
    }
  };

  Scene_SED_RelationshipViewer.prototype.isCancelTriggered = function() {
    return Input.isTriggered("cancel") || TouchInput.isCancelled();
  };

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  SED.RelationshipViewer = {
    open: function() {
      SceneManager.push(Scene_SED_RelationshipViewer);
    }
  };

  SED.registerModule("RelationshipViewer", "0.5.0");
})();
