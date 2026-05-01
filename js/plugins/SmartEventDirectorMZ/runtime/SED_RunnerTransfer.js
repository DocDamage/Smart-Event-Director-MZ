(() => {
  "use strict";

  const SED = window.SED;
  if (!SED.Runner) return;

  Object.assign(SED.Runner, {
    _onTransferReserved(mapId, x, y, d, fadeType) {
      SED.Logger.info("Map transfer reserved during scene:", this._scene.sceneId, "-> map", mapId);
      this._transferResumeData = {
        sceneId: this._scene.sceneId,
        queueIndex: this._queue.currentIndex(),
        contextLocals: SED.Util.cloneJson(this._context.local || {})
      };
      if (this._queue instanceof SED.GraphQueue) {
        this._transferResumeData.nodeId = this._queue.currentNodeId();
      }
    }
  });

  const _Game_Player_reserveTransfer = Game_Player.prototype.reserveTransfer;
  Game_Player.prototype.reserveTransfer = function(mapId, x, y, d, fadeType) {
    _Game_Player_reserveTransfer.apply(this, arguments);
    if (SED.Runner && SED.Runner.isBusy()) {
      SED.Runner._onTransferReserved(mapId, x, y, d, fadeType);
    }
  };

  const _Scene_Map_onTransferEnd = Scene_Map.prototype.onTransferEnd;
  Scene_Map.prototype.onTransferEnd = function() {
    _Scene_Map_onTransferEnd.apply(this, arguments);
    if (SED.Runner && SED.Runner._transferResumeData) {
      const data = SED.Runner._transferResumeData;
      SED.Runner._transferResumeData = null;
      SED.Runner.resume(data.sceneId, data.queueIndex, data.nodeId || null);
      if (SED.Runner._context && data.contextLocals) {
        for (const key in data.contextLocals) {
          SED.Runner._context.setLocal(key, data.contextLocals[key]);
        }
      }
    }
  };

  SED.registerModule("RunnerTransfer", "1.0.0");
})();
