(() => {
  "use strict";

  const SED = window.SED;

  // Runtime state: map of target (string) -> numeric point value
  const state = Object.create(null);

  function getPoints(target) {
    const key = String(target);
    return typeof state[key] === "number" ? state[key] : 0;
  }

  function setPoints(target, value) {
    const key = String(target);
    state[key] = Number(value) || 0;
    SED.Logger.info("RelationshipState.setPoints:", key, "=", state[key]);
  }

  function addPoints(target, delta) {
    const key = String(target);
    const current = typeof state[key] === "number" ? state[key] : 0;
    state[key] = current + (Number(delta) || 0);
    SED.Logger.info("RelationshipState.addPoints:", key, "->", state[key]);
  }

  function getRelationships() {
    const result = Object.create(null);
    for (const key in state) {
      if (Object.prototype.hasOwnProperty.call(state, key)) {
        result[key] = state[key];
      }
    }
    return result;
  }

  function clear() {
    for (const key in state) {
      if (Object.prototype.hasOwnProperty.call(state, key)) {
        delete state[key];
      }
    }
  }

  SED.RelationshipState = {
    getPoints,
    setPoints,
    addPoints,
    getRelationships,
    clear
  };

  SED.registerModule("RelationshipState", "0.3.0");
})();
