(() => {
  "use strict";

  const SED = window.SED;
  const MAX_SNAPSHOTS = 50;
  const snapshots = [];

  function takeSnapshot() {
    if (!SED.Runner || !SED.Runner.isBusy || !SED.Runner.isBusy()) return;
    const state = SED.Runner.getState();
    if (!state) return;

    const snap = {
      frame: Graphics.frameCount,
      sceneId: state.sceneId,
      nodeId: state.nodeId || null,
      queueIndex: state.queueIndex,
      stepType: state.activeStepType,
      contextLocals: SED.Util.cloneJson(state.contextLocals || {})
    };

    snapshots.push(snap);
    if (snapshots.length > MAX_SNAPSHOTS) {
      snapshots.shift();
    }
  }

  function getSnapshots() {
    return snapshots.slice();
  }

  function clear() {
    snapshots.length = 0;
  }

  function rewindTo(index) {
    const snap = snapshots[index];
    if (!snap) return false;

    if (SED.Runner && SED.Runner.isBusy && SED.Runner.isBusy()) {
      SED.Runner.stop("rewind");
    }

    const success = SED.Runner.resume(snap.sceneId, snap.queueIndex, snap.nodeId);
    if (success && SED.Runner._context && snap.contextLocals) {
      for (const key in snap.contextLocals) {
        SED.Runner._context.setLocal(key, snap.contextLocals[key]);
      }
    }

    // Remove future snapshots
    snapshots.splice(index + 1);

    SED.Logger.info("Rewind to snapshot:", index, "scene:", snap.sceneId, "node:", snap.nodeId);
    return success;
  }

  SED.Rewind = {
    takeSnapshot,
    getSnapshots,
    clear,
    rewindTo
  };

  SED.registerModule("Rewind", "2.0.0");
})();
