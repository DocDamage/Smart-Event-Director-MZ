(() => {
  "use strict";

  const SED = window.SED;

  const MAX_CHECKPOINTS = 10;
  const checkpoints = [];

  function snapshotSwitches(ids) {
    const snap = Object.create(null);
    if (!ids || !Array.isArray(ids)) return snap;
    for (const id of ids) {
      snap[String(id)] = $gameSwitches.value(Number(id));
    }
    return snap;
  }

  function snapshotVariables(ids) {
    const snap = Object.create(null);
    if (!ids || !Array.isArray(ids)) return snap;
    for (const id of ids) {
      snap[String(id)] = $gameVariables.value(Number(id));
    }
    return snap;
  }

  function restoreSwitches(snap) {
    if (!snap) return;
    for (const id in snap) {
      if (Object.prototype.hasOwnProperty.call(snap, id)) {
        $gameSwitches.setValue(Number(id), snap[id]);
      }
    }
  }

  function restoreVariables(snap) {
    if (!snap) return;
    for (const id in snap) {
      if (Object.prototype.hasOwnProperty.call(snap, id)) {
        $gameVariables.setValue(Number(id), snap[id]);
      }
    }
  }

  function save(id) {
    if (!SED.Runner || !SED.Runner.isBusy || !SED.Runner.isBusy()) {
      SED.Logger.warn("Checkpoint.save: no active scene.");
      return false;
    }

    const state = SED.Runner.getState();
    if (!state) return false;

    const cpIds = SED.Params && SED.Params.checkpointSwitchIds ? SED.Params.checkpointSwitchIds : [];
    const cpVarIds = SED.Params && SED.Params.checkpointVariableIds ? SED.Params.checkpointVariableIds : [];

    const entry = {
      id: id || String(Date.now()),
      frame: Graphics.frameCount,
      sceneId: state.sceneId,
      queueIndex: state.queueIndex,
      contextLocals: state.contextLocals,
      switches: snapshotSwitches(cpIds),
      variables: snapshotVariables(cpVarIds),
      choices: SED.Util.cloneJson(SED.Save.toJSON ? SED.Save.toJSON().choices : {}),
      flags: SED.Util.cloneJson(SED.Save.toJSON ? SED.Save.toJSON().flags : {})
    };

    checkpoints.push(entry);
    if (checkpoints.length > MAX_CHECKPOINTS) {
      checkpoints.shift();
    }

    SED.Logger.info("Checkpoint saved:", entry.id, "scene:", entry.sceneId, "index:", entry.queueIndex);
    return true;
  }

  function restore(id) {
    let entry = null;

    if (id) {
      for (let i = checkpoints.length - 1; i >= 0; i--) {
        if (checkpoints[i].id === id) {
          entry = checkpoints[i];
          break;
        }
      }
    } else {
      entry = checkpoints.length > 0 ? checkpoints[checkpoints.length - 1] : null;
    }

    if (!entry) {
      SED.Logger.warn("Checkpoint.restore: no checkpoint found.");
      return false;
    }

    if (SED.Runner && SED.Runner.isBusy && SED.Runner.isBusy()) {
      SED.Runner.stop("checkpointRestore");
    }

    restoreSwitches(entry.switches);
    restoreVariables(entry.variables);

    if (SED.Save && SED.Save.fromJSON) {
      SED.Save.fromJSON({ choices: entry.choices, flags: entry.flags });
    }

    const success = SED.Runner.resume(entry.sceneId, entry.queueIndex);
    if (success && SED.Runner._context && entry.contextLocals) {
      for (const key in entry.contextLocals) {
        SED.Runner._context.setLocal(key, entry.contextLocals[key]);
      }
    }

    SED.Logger.info("Checkpoint restored:", entry.id, "scene:", entry.sceneId);
    return success;
  }

  function list() {
    return checkpoints.map(cp => ({ id: cp.id, sceneId: cp.sceneId, frame: cp.frame }));
  }

  function clear() {
    checkpoints.length = 0;
  }

  SED.Checkpoint = {
    save,
    restore,
    list,
    clear
  };

  SED.registerModule("Checkpoint", "1.1.0");
})();
