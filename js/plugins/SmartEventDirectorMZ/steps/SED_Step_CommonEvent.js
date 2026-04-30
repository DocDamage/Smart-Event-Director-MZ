(() => {
  "use strict";

  const SED = window.SED;

  SED.StepRegistry.register({
    types: ["commonEvent"],

    validate(step) {
      const errors = [];

      if (Number(step.id || 0) <= 0) {
        errors.push("commonEvent step needs id > 0.");
      }

      return errors;
    },

    start(step, context, runtime) {
      const id = Number(step.id);
      const wait = step.wait !== false;

      runtime.wait = wait;
      runtime.eventId = id;
      runtime.phase = "setup";

      const interpreter = context.interpreter;

      if (!interpreter) {
        throw new Error("commonEvent step requires a Game_Interpreter context.");
      }
    },

    update(step, context, runtime) {
      if (runtime.phase === "setup") {
        const interpreter = context.interpreter;

        interpreter._comments = [];
        interpreter._indent = 0;

        interpreter.setupReservedCommonEvent(runtime.eventId);

        if (!runtime.wait) {
          return true;
        }

        runtime.phase = "waiting";
        return false;
      }

      if (runtime.phase === "waiting") {
        const interpreter = context.interpreter;

        if (interpreter._list && interpreter._index < interpreter._list.length) {
          interpreter.update();
          return false;
        }

        return true;
      }

      return true;
    },

    cancel(step, context, runtime) {
      const interpreter = context.interpreter;

      if (interpreter) {
        interpreter._list = null;
        interpreter._index = 0;
      }
    }
  });

  SED.registerModule("Step_CommonEvent", "0.2.0");
})();
