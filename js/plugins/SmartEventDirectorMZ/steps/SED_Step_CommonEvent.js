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

      runtime.snapshot = {
        list: interpreter._list,
        index: interpreter._index,
        indent: interpreter._indent
      };
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

      if (interpreter && runtime.snapshot) {
        interpreter._list = runtime.snapshot.list;
        interpreter._index = runtime.snapshot.index;
        interpreter._indent = runtime.snapshot.indent;
        runtime.snapshot = null;
      }
    }
  });

  SED.registerModule("Step_CommonEvent", "0.2.0");
})();
