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
  let _profilerLines = [];

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

  // Memory tracking
  function getMemoryInfo() {
    const info = { usedJSHeapSize: 0, totalJSHeapSize: 0, jsHeapSizeLimit: 0 };
    if (typeof performance !== "undefined" && performance.memory) {
      info.usedJSHeapSize = performance.memory.usedJSHeapSize;
      info.totalJSHeapSize = performance.memory.totalJSHeapSize;
      info.jsHeapSizeLimit = performance.memory.jsHeapSizeLimit;
    }
    return info;
  }

  function formatBytes(bytes) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  let _memoryBaseline = 0;
  function recordMemoryBaseline() {
    const mem = getMemoryInfo();
    _memoryBaseline = mem.usedJSHeapSize;
  }

  function checkMemoryGrowth() {
    const mem = getMemoryInfo();
    if (mem.usedJSHeapSize === 0) return null;
    const growth = mem.usedJSHeapSize - _memoryBaseline;
    return {
      baseline: _memoryBaseline,
      current: mem.usedJSHeapSize,
      growth: growth,
      growthFormatted: formatBytes(growth),
      currentFormatted: formatBytes(mem.usedJSHeapSize)
    };
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

  // EventBus subscribers
  function onRunnerUpdateStart() {
    if (!enabled) return;
    this._profilerFrameStart = _now();
  }

  function onRunnerUpdateEnd() {
    if (!enabled || this._profilerFrameStart === undefined) return;
    recordFrame(_now() - this._profilerFrameStart);
    this._profilerFrameStart = undefined;
  }

  function onRunnerStepStart(data) {
    if (!enabled) return;
    stepStartTime = _now();
    stepStartType = data && data.type ? data.type : null;
  }

  function onRunnerStepEnd() {
    if (!enabled || stepStartType === null) return;
    recordStep(stepStartType, _now() - stepStartTime);
    stepStartTime = null;
    stepStartType = null;
    sceneSteps++;
  }

  function onRunnerSceneComplete(data) {
    if (!enabled || !data || !data.sceneId) return;
    recordScene(data.sceneId, Graphics.frameCount - sceneStartFrame, sceneSteps);
  }

  function onRunnerStop(data) {
    if (!enabled) return;
    if (stepStartType !== null) {
      recordStep(stepStartType, _now() - stepStartTime);
      stepStartTime = null;
      stepStartType = null;
    }
    if (sceneId !== null) {
      recordScene(sceneId, Graphics.frameCount - sceneStartFrame, sceneSteps);
    }
  }

  function onRunnerPlay(data) {
    if (!enabled || !data || !data.sceneId) return;
    sceneId = data.sceneId;
    sceneStartFrame = Graphics.frameCount;
    sceneSteps = 0;
  }

  function onRunnerSceneFail() {
    if (!enabled) return;
    if (stepStartType !== null) {
      recordStep(stepStartType, _now() - stepStartTime);
      stepStartTime = null;
      stepStartType = null;
    }
    if (sceneId !== null) {
      recordScene(sceneId, Graphics.frameCount - sceneStartFrame, sceneSteps);
    }
  }

  function buildOverlayLines() {
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
    _profilerLines = a;
  }

  function drawProfiler() {
    const a = _profilerLines;
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
  }

  SED.Profiler = {
    getFrameStats: getFrameStats,
    getStepStats: getStepStats,
    getSceneStats: getSceneStats,
    reset: reset,
    isEnabled: isEnabled,
    setEnabled: setEnabled,
    recordFrame: recordFrame,
    recordStep: recordStep,
    recordScene: recordScene,
    buildOverlayLines: buildOverlayLines,
    drawProfiler: drawProfiler,
    getMemoryInfo: getMemoryInfo,
    formatBytes: formatBytes,
    recordMemoryBaseline: recordMemoryBaseline,
    checkMemoryGrowth: checkMemoryGrowth
  };

  // Subscribe to EventBus lifecycle events
  if (SED.EventBus) {
    SED.EventBus.on(SED.EventBus.Events.RUNNER_UPDATE_START, onRunnerUpdateStart.bind(SED.Runner || {}));
    SED.EventBus.on(SED.EventBus.Events.RUNNER_UPDATE_END, onRunnerUpdateEnd.bind(SED.Runner || {}));
    SED.EventBus.on(SED.EventBus.Events.RUNNER_STEP_START, onRunnerStepStart);
    SED.EventBus.on(SED.EventBus.Events.RUNNER_STEP_END, onRunnerStepEnd);
    SED.EventBus.on(SED.EventBus.Events.RUNNER_SCENE_COMPLETE, onRunnerSceneComplete);
    SED.EventBus.on(SED.EventBus.Events.RUNNER_STOP, onRunnerStop);
    SED.EventBus.on(SED.EventBus.Events.RUNNER_PLAY, onRunnerPlay);
    SED.EventBus.on(SED.EventBus.Events.RUNNER_SCENE_FAIL, onRunnerSceneFail);
    SED.EventBus.on(SED.EventBus.Events.OVERLAY_UPDATE, buildOverlayLines);
    SED.EventBus.on(SED.EventBus.Events.OVERLAY_DRAW, drawProfiler);
  }

  SED.registerModule("Profiler", "1.0.0");
})();
