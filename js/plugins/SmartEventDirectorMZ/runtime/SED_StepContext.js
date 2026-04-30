(() => {
  "use strict";

  const SED = window.SED;

  function StepContext(scene, options) {
    options = options || {};

    this.scene = scene;
    this.sceneId = scene.sceneId;
    this.interpreter = options.interpreter || null;
    this.callerEventId = options.callerEventId || 0;

    this.startedFrame = Graphics.frameCount;
    this.local = Object.create(null);

    this.requestedJump = null;
    this.requestedStop = false;
  }

  StepContext.prototype.jump = function(label) {
    this.requestedJump = String(label);
  };

  StepContext.prototype.stop = function() {
    this.requestedStop = true;
  };

  StepContext.prototype.setLocal = function(key, value) {
    this.local[String(key)] = value;
  };

  StepContext.prototype.getLocal = function(key) {
    return this.local[String(key)];
  };

  SED.StepContext = StepContext;
  SED.registerModule("StepContext", "0.1.0");
})();
