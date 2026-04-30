(() => {
  "use strict";

  const SED = window.SED;

  function StepQueue(steps) {
    this._steps = steps || [];
    this._index = 0;
    this._labels = this.buildLabels();
  }

  StepQueue.prototype.buildLabels = function() {
    const labels = Object.create(null);

    for (let i = 0; i < this._steps.length; i++) {
      const step = this._steps[i];

      if (step && step.type === "label" && step.name) {
        labels[step.name] = i;
      }
    }

    return labels;
  };

  StepQueue.prototype.currentIndex = function() {
    return this._index;
  };

  StepQueue.prototype.next = function() {
    if (this._index >= this._steps.length) {
      return null;
    }

    const step = this._steps[this._index];
    this._index += 1;
    return step;
  };

  StepQueue.prototype.jumpTo = function(label) {
    const index = this._labels[label];

    if (index === undefined) {
      throw new Error("Missing label: " + label);
    }

    this._index = index + 1;
  };

  StepQueue.prototype.isComplete = function() {
    return this._index >= this._steps.length;
  };

  SED.StepQueue = StepQueue;
  SED.registerModule("StepQueue", "0.1.0");
})();
