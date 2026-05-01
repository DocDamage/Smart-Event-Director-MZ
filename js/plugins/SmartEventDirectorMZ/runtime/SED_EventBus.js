(() => {
  "use strict";

  const SED = window.SED;
  const listeners = Object.create(null);

  const Events = {
    RUNNER_UPDATE_START: "runner:updateStart",
    RUNNER_UPDATE_END: "runner:updateEnd",
    RUNNER_STEP_START: "runner:stepStart",
    RUNNER_STEP_END: "runner:stepEnd",
    RUNNER_SCENE_COMPLETE: "runner:sceneComplete",
    RUNNER_SCENE_FAIL: "runner:sceneFail",
    RUNNER_STOP: "runner:stop",
    RUNNER_PLAY: "runner:play",
    OVERLAY_UPDATE: "overlay:update",
    OVERLAY_DRAW: "overlay:draw"
  };

  function on(event, fn) {
    if (typeof event !== "string" || typeof fn !== "function") return;
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(fn);
  }

  function off(event, fn) {
    if (!listeners[event]) return;
    if (!fn) {
      delete listeners[event];
      return;
    }
    const idx = listeners[event].indexOf(fn);
    if (idx >= 0) listeners[event].splice(idx, 1);
  }

  function emit(event, data) {
    const list = listeners[event];
    if (!list) return;
    for (let i = 0; i < list.length; i++) {
      try {
        list[i](data);
      } catch (err) {
        SED.Logger.error("EventBus error in '" + event + "':", err.message);
      }
    }
  }

  function once(event, fn) {
    const wrapper = function(data) {
      off(event, wrapper);
      fn(data);
    };
    on(event, wrapper);
  }

  SED.EventBus = {
    on,
    off,
    once,
    emit,
    Events
  };

  SED.registerModule("EventBus", "2.1.0");
})();
