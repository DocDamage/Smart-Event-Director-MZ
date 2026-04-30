(() => {
  "use strict";

  const SED = window.SED;

  SED.StepRegistry.register({
    types: ["return"],

    validate() {
      return [];
    },

    start(step, context, runtime) {
      runtime.done = false;

      if (SED.Runner && SED.Runner._callStack && SED.Runner._callStack.length > 0) {
        SED.Runner._completeScene();
        runtime.done = true;
      } else {
        runtime.done = true;
      }
    },

    update(step, context, runtime) {
      return runtime.done;
    }
  });

  SED.registerModule("Step_Return", "1.1.0");
})();
