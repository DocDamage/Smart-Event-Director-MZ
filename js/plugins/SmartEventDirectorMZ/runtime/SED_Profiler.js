(() => {
  "use strict";
  const SED = window.SED;

  let enabled = !!(SED.Params && SED.Params.debug);
  const FRAME_HISTORY = 60;
  const frameTimes = new Array(FRAME_HISTORY).fill(0);
  let frameIndex = 0, frameCount = 0;
  const stepStats = {};
  let stepStartTime = null, stepStartType = null;
  let sceneId = null, sceneStartFrame = 0, sceneSteps = 0, lastSceneStats = null;

  function _now() {
    return typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
  }

  function recordFrame(ms) {
    frameTimes[frameIndex] = ms;
    frameIndex = (frameIndex + 1) % FRAME_HISTORY;
    frameCount++;
    if (frameCount >= FRAME_HISTORY) {
      const avg = getFrameStats().average;
      if (avg > 1.0) SED.Logger.warn("SED Profiler: avg frame time exceeded 1ms (" + avg.toFixed(2) + "ms)");
    }
  }

  function recordStep(type, ms) {
    if (!type) return;
    if (!stepStats[type]) stepStats[type] = { count: 0, total: 0 };
    stepStats[type].count += 1;
    stepStats[type].total += ms;
  }

  function recordScene(id, durationFrames, steps) {
    lastSceneStats = { sceneId: id, duration: durationFrames, stepsRun: steps };
    SED.Logger.info("SED Profiler: scene completed " + id + " in " + durationFrames + " frames, " + steps + " steps");
  }

  function getFrameStats() {
    const len = Math.min(frameCount, FRAME_HISTORY);
    if (len === 0) return { current: 0, average: 0, max: 0 };
    let sum = 0, max = 0;
    for (let i = 0; i < len; i++) { sum += frameTimes[i]; if (frameTimes[i] > max) max = frameTimes[i]; }
    return { current: frameTimes[(frameIndex - 1 + FRAME_HISTORY) % FRAME_HISTORY], average: sum / len, max: max };
  }

  function getStepStats() {
    const result = {};
    for (const type in stepStats) { const s = stepStats[type]; result[type] = s.count > 0 ? s.total / s.count : 0; }
    return result;
  }

  function getSceneStats() {
    return lastSceneStats ? SED.Util.cloneJson(lastSceneStats) : { sceneId: null, duration: 0, stepsRun: 0 };
  }

  function reset() {
    for (let i = 0; i < FRAME_HISTORY; i++) frameTimes[i] = 0;
    frameIndex = 0; frameCount = 0;
    for (const key in stepStats) delete stepStats[key];
    stepStartTime = null; stepStartType = null;
    sceneId = null; sceneStartFrame = 0; sceneSteps = 0; lastSceneStats = null;
  }

  function isEnabled() { return enabled; }
  function setEnabled(value) { enabled = !!value; }

  SED.Profiler = {
    getFrameStats: getFrameStats,
    getStepStats: getStepStats,
    getSceneStats: getSceneStats,
    reset: reset,
    isEnabled: isEnabled,
    setEnabled: setEnabled,
    recordFrame: recordFrame,
    recordStep: recordStep,
    recordScene: recordScene
  };

  if (SED.Runner) {
    const _update = SED.Runner.update;
    SED.Runner.update = function() {
      if (!enabled) return _update.apply(this, arguments);
      const t0 = _now();
      _update.apply(this, arguments);
      recordFrame(_now() - t0);
    };

    const _startNextStep = SED.Runner._startNextStep;
    SED.Runner._startNextStep = function() {
      _startNextStep.apply(this, arguments);
      if (enabled && this._activeStep) { stepStartTime = _now(); stepStartType = this._activeStep.type; }
    };

    const _finishActiveStep = SED.Runner._finishActiveStep;
    SED.Runner._finishActiveStep = function() {
      if (enabled && stepStartType !== null) { recordStep(stepStartType, _now() - stepStartTime); stepStartTime = null; stepStartType = null; sceneSteps++; }
      _finishActiveStep.apply(this, arguments);
    };

    const _completeScene = SED.Runner._completeScene;
    SED.Runner._completeScene = function() {
      if (enabled && sceneId !== null) recordScene(sceneId, Graphics.frameCount - sceneStartFrame, sceneSteps);
      _completeScene.apply(this, arguments);
    };

    const _stop = SED.Runner.stop;
    SED.Runner.stop = function(reason) {
      if (enabled && stepStartType !== null) { recordStep(stepStartType, _now() - stepStartTime); stepStartTime = null; stepStartType = null; }
      if (enabled && sceneId !== null) recordScene(sceneId, Graphics.frameCount - sceneStartFrame, sceneSteps);
      _stop.apply(this, arguments);
    };

    const _skip = SED.Runner.skip;
    SED.Runner.skip = function() {
      if (enabled && stepStartType !== null) { recordStep(stepStartType, _now() - stepStartTime); stepStartTime = null; stepStartType = null; }
      if (enabled && sceneId !== null) recordScene(sceneId, Graphics.frameCount - sceneStartFrame, sceneSteps);
      _skip.apply(this, arguments);
    };

    const _fail = SED.Runner._fail;
    SED.Runner._fail = function(error) {
      if (enabled && stepStartType !== null) { recordStep(stepStartType, _now() - stepStartTime); stepStartTime = null; stepStartType = null; }
      if (enabled && sceneId !== null) recordScene(sceneId, Graphics.frameCount - sceneStartFrame, sceneSteps);
      _fail.apply(this, arguments);
    };

    const _play = SED.Runner.play;
    SED.Runner.play = function(sceneIdArg, options) {
      const result = _play.apply(this, arguments);
      if (enabled && result) { sceneId = sceneIdArg; sceneStartFrame = Graphics.frameCount; sceneSteps = 0; }
      return result;
    };

    const _forceIdle = SED.Runner._forceIdle;
    SED.Runner._forceIdle = function() {
      if (enabled) { stepStartTime = null; stepStartType = null; sceneId = null; sceneStartFrame = 0; sceneSteps = 0; }
      _forceIdle.apply(this, arguments);
    };
  }

  if (SED.DebugOverlay) {
    const _update = SED.DebugOverlay.update;
    SED.DebugOverlay.update = function() {
      _update.apply(this, arguments);
      const a = [];
      if (enabled) {
        const f = getFrameStats();
        a.push("Profiler");
        a.push("Frame: " + f.current.toFixed(2) + "/" + f.average.toFixed(2) + "/" + f.max.toFixed(2) + "ms");
        const s = getStepStats();
        for (const k in s) a.push(k + ": " + s[k].toFixed(2) + "ms");
        const c = getSceneStats();
        if (c.sceneId) a.push("Scene: " + c.sceneId + " " + c.duration + "f " + c.stepsRun + "s");
      }
      SED.DebugOverlay._profilerLines = a;
    };

    const _draw = SED.DebugOverlay.draw;
    SED.DebugOverlay.draw = function() {
      _draw.apply(this, arguments);
      const a = SED.DebugOverlay._profilerLines;
      if (!a || !a.length) return;
      const sc = SceneManager._scene;
      if (!sc) return;
      if (!sc._sedProfilerSprite) {
        const sp = new Sprite(new Bitmap(300, a.length * 20 + 10));
        sp.x = Graphics.width - 310;
        sp.y = 180;
        sp.z = 10001;
        sc._sedProfilerSprite = sp;
        if (sc.addChild) sc.addChild(sp);
      }
      const bm = sc._sedProfilerSprite.bitmap;
      if (bm.height < a.length * 20 + 10) sc._sedProfilerSprite.bitmap = new Bitmap(300, a.length * 20 + 10);
      const b = sc._sedProfilerSprite.bitmap;
      b.clear();
      b.fillRect(0, 0, 300, b.height, "rgba(0,0,0,0.6)");
      a.forEach(function(t, i) { b.drawText(t, 5, 5 + i * 20, 290, 18, "left"); });
    };
  }

  SED.registerModule("Profiler", "0.1.0");
})();
