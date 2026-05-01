(() => {
  "use strict";

  const SED = window.SED;

  const Triggers = {
    _lastMapId: 0,
    _switchStates: Object.create(null),
    _triggeredOnce: new Set(),
    _configs: Object.create(null),

    register(sceneId, triggers) {
      if (!sceneId || !Array.isArray(triggers)) return;
      this._configs[String(sceneId)] = triggers.slice();
    },

    unregister(sceneId) {
      delete this._configs[String(sceneId)];
    },

    checkMapEnter(trigger) {
      if (!SceneManager._scene || SceneManager._scene.constructor !== Scene_Map) return false;
      if ($gameMap.mapId() !== trigger.mapId) return false;
      return this._lastMapId !== trigger.mapId;
    },

    checkProximity(trigger) {
      const event = $gameMap.event(trigger.eventId);
      if (!event) return false;
      const dx = $gamePlayer.x - event.x;
      const dy = $gamePlayer.y - event.y;
      return Math.sqrt(dx * dx + dy * dy) <= trigger.distance;
    },

    checkSwitchOn(trigger) {
      const current = $gameSwitches.value(trigger.switchId);
      const last = this._switchStates[trigger.switchId];
      return last === false && current === true;
    },

    checkSwitchOff(trigger) {
      const current = $gameSwitches.value(trigger.switchId);
      const last = this._switchStates[trigger.switchId];
      return last === true && current === false;
    },

    update() {
      if (!SceneManager._scene || SceneManager._scene.constructor !== Scene_Map) return;
      if (!$gameMap || !$gamePlayer) return;

      for (const sceneId in this._configs) {
        const triggers = this._configs[sceneId];
        for (let i = 0; i < triggers.length; i++) {
          const trigger = triggers[i];
          const onceKey = sceneId + ":" + i;

          if (trigger.once && this._triggeredOnce.has(onceKey)) continue;

          let passed = false;
          switch (trigger.type) {
            case "mapEnter": passed = this.checkMapEnter(trigger); break;
            case "proximity": passed = this.checkProximity(trigger); break;
            case "switchOn": passed = this.checkSwitchOn(trigger); break;
            case "switchOff": passed = this.checkSwitchOff(trigger); break;
          }

          if (passed && !SED.Runner.isBusy()) {
            SED.Runner.play(sceneId, {});
            if (trigger.once) {
              this._triggeredOnce.add(onceKey);
            }
          }
        }
      }

      this._lastMapId = $gameMap.mapId();

      for (const sceneId in this._configs) {
        const triggers = this._configs[sceneId];
        for (const trigger of triggers) {
          if (trigger.type === "switchOn" || trigger.type === "switchOff") {
            const switchId = trigger.switchId;
            if (switchId !== undefined) {
              this._switchStates[switchId] = $gameSwitches.value(switchId);
            }
          }
        }
      }
    }
  };

  SED.Triggers = Triggers;
  SED.registerModule("Triggers", "1.2.0");

  if (SED.UpdateDispatcher) {
    SED.UpdateDispatcher.register("Triggers", {
      update: function() { if (SED.Triggers && SED.Triggers.update) SED.Triggers.update(); },
      priority: 30,
      contexts: ["map"]
    });
  }
})();
