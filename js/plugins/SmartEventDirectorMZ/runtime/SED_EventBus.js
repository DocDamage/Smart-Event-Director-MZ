(() => {
  "use strict";

  const SED = window.SED;
  const listeners = Object.create(null);

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
    emit
  };

  SED.registerModule("EventBus", "2.0.0");
})();
