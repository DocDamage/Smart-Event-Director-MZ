(() => {
  "use strict";

  const SED = window.SED;
  const PLUGIN_NAME = SED.pluginName || "SmartEventDirectorMZ";

  // Core scene commands
  PluginManager.registerCommand(PLUGIN_NAME, "PlayScene", function(args) {
    const sceneId = String(args.sceneId || "");
    const wait = String(args.wait || "true") === "true";

    if (!sceneId) {
      console.error("SED PlayScene missing sceneId.");
      return;
    }

    if (!SED.Runner) {
      console.error("SED Runner is not loaded.");
      return;
    }

    SED.Runner.play(sceneId, {
      interpreter: this,
      callerEventId: typeof this.eventId === "function" ? this.eventId() : 0
    });

    if (wait && this.setWaitMode) {
      this.setWaitMode("sedScene");
    }
  });

  PluginManager.registerCommand(PLUGIN_NAME, "StopScene", function() {
    if (SED.Runner) SED.Runner.stop("pluginCommand");
  });

  PluginManager.registerCommand(PLUGIN_NAME, "SkipScene", function() {
    if (SED.Runner) SED.Runner.skip();
  });

  PluginManager.registerCommand(PLUGIN_NAME, "RecoverScene", function() {
    if (SED.Failsafe) SED.Failsafe.recover("pluginCommand");
  });

  PluginManager.registerCommand(PLUGIN_NAME, "ToggleDebug", function() {
    if (SED.DebugOverlay) SED.DebugOverlay.toggle();
  });

  // Relationship commands
  PluginManager.registerCommand(PLUGIN_NAME, "SetRelationship", function(args) {
    const target = String(args.target || "");
    const value = Number(args.value || 0);
    if (target && SED.RelationshipState) {
      SED.RelationshipState.setPoints(target, value);
    }
  });

  PluginManager.registerCommand(PLUGIN_NAME, "AddRelationship", function(args) {
    const target = String(args.target || "");
    const value = Number(args.value || 0);
    if (target && SED.RelationshipState) {
      SED.RelationshipState.addPoints(target, value);
    }
  });

  // Quest commands
  PluginManager.registerCommand(PLUGIN_NAME, "StartQuest", function(args) {
    const questId = String(args.questId || "");
    if (questId && SED.QuestState) {
      SED.QuestState.startQuest(questId);
    }
  });

  PluginManager.registerCommand(PLUGIN_NAME, "CompleteQuest", function(args) {
    const questId = String(args.questId || "");
    if (questId && SED.QuestState) {
      SED.QuestState.completeQuest(questId);
    }
  });

  PluginManager.registerCommand(PLUGIN_NAME, "FailQuest", function(args) {
    const questId = String(args.questId || "");
    if (questId && SED.QuestState) {
      SED.QuestState.failQuest(questId);
    }
  });

  PluginManager.registerCommand(PLUGIN_NAME, "UpdateObjective", function(args) {
    const questId = String(args.questId || "");
    const objective = String(args.objective || "");
    const completed = String(args.completed || "true") === "true";
    if (questId && objective && SED.QuestState) {
      SED.QuestState.updateObjective(questId, objective, completed);
    }
  });

  // UI commands
  PluginManager.registerCommand(PLUGIN_NAME, "OpenQuestLog", function() {
    if (SED.QuestLog && SED.QuestLog.open) {
      SED.QuestLog.open();
    }
  });

  PluginManager.registerCommand(PLUGIN_NAME, "OpenRelationshipViewer", function() {
    if (SED.RelationshipViewer && SED.RelationshipViewer.open) {
      SED.RelationshipViewer.open();
    }
  });

  // Menu integration
  const _Window_MenuCommand_makeCommandList = Window_MenuCommand.prototype.makeCommandList;
  Window_MenuCommand.prototype.makeCommandList = function() {
    _Window_MenuCommand_makeCommandList.apply(this, arguments);

    if (SED.Params && SED.Params.enableQuestLog !== false) {
      this.addCommand("Quest Log", "questLog", true);
    }

    if (SED.Params && SED.Params.enableRelationshipViewer) {
      this.addCommand("Relationships", "relationships", true);
    }
  };

  const _Scene_Menu_createCommandWindow = Scene_Menu.prototype.createCommandWindow;
  Scene_Menu.prototype.createCommandWindow = function() {
    _Scene_Menu_createCommandWindow.apply(this, arguments);
    this._commandWindow.setHandler("questLog", this.commandQuestLog.bind(this));
    this._commandWindow.setHandler("relationships", this.commandRelationships.bind(this));
  };

  Scene_Menu.prototype.commandQuestLog = function() {
    if (SED.QuestLog && SED.QuestLog.open) {
      SED.QuestLog.open();
    }
  };

  Scene_Menu.prototype.commandRelationships = function() {
    if (SED.RelationshipViewer && SED.RelationshipViewer.open) {
      SED.RelationshipViewer.open();
    }
  };

  SED.registerModule("PluginCommands", "0.4.0");
})();
