(() => {
  "use strict";

  const SED = window.SED;

  function isAt(character, x, y) {
    return character.x === Number(x) && character.y === Number(y);
  }

  SED.StepRegistry.register({
    types: ["moveOneTile"],

    validate(step) {
      const errors = [];

      if (SED.Util.directionFromText(step.direction) === 0) {
        errors.push("moveOneTile needs direction: up/down/left/right or 2/4/6/8.");
      }

      return errors;
    },

    start(step, context, runtime) {
      const character = SED.Util.characterFromId(step.eventId, context.interpreter);

      if (!character) {
        throw new Error("moveOneTile could not find character: " + step.eventId);
      }

      const direction = SED.Util.directionFromText(step.direction);

      runtime.character = character;
      runtime.wait = step.wait !== false;
      runtime.timeoutFrame = Graphics.frameCount + Number(step.timeoutFrames || 120);

      if (character instanceof Game_Event) {
        runtime.initialPage = character._pageIndex;
      }

      character.moveStraight(direction);
    },

    update(step, context, runtime) {
      if (!runtime.wait) return true;

      const character = runtime.character;
      if (character instanceof Game_Event) {
        if (character._erased || !$gameMap.event(character.eventId())) {
          if (step.failBehavior === "continue") {
            SED.Logger.warn("Character erased or missing; continuing.");
            return true;
          }
          throw new Error("Character erased or missing during movement.");
        }
        if (character._pageIndex !== runtime.initialPage) {
          SED.Logger.warn("Event page changed mid-scene: event " + step.eventId);
        }
      }

      if (Graphics.frameCount > runtime.timeoutFrame) {
        throw new Error("moveOneTile timeout.");
      }

      return !character.isMoving();
    }
  });

  SED.StepRegistry.register({
    types: ["moveTo"],

    validate(step) {
      const errors = [];

      if (step.x === undefined || step.y === undefined) {
        errors.push("moveTo needs x and y.");
      }

      return errors;
    },

    start(step, context, runtime) {
      const character = SED.Util.characterFromId(step.eventId, context.interpreter);

      if (!character) {
        throw new Error("moveTo could not find character: " + step.eventId);
      }

      runtime.character = character;
      runtime.wait = step.wait !== false;
      runtime.timeoutFrame = Graphics.frameCount + Number(step.timeoutFrames || 300);
      runtime.lastX = character.x;
      runtime.lastY = character.y;
      runtime.stuckFrames = 0;

      if (character instanceof Game_Event) {
        runtime.initialPage = character._pageIndex;
      }
    },

    update(step, context, runtime) {
      const character = runtime.character;

      if (character instanceof Game_Event) {
        if (character._erased || !$gameMap.event(character.eventId())) {
          if (step.failBehavior === "continue") {
            SED.Logger.warn("Character erased or missing; continuing.");
            return true;
          }
          throw new Error("Character erased or missing during movement.");
        }
        if (character._pageIndex !== runtime.initialPage) {
          SED.Logger.warn("Event page changed mid-scene: event " + step.eventId);
        }
      }

      if (isAt(character, step.x, step.y)) {
        return true;
      }

      if (!runtime.wait) {
        return true;
      }

      if (Graphics.frameCount > runtime.timeoutFrame) {
        if (step.failBehavior === "continue") {
          SED.Logger.warn("moveTo timeout; continuing.");
          return true;
        }

        throw new Error("moveTo timeout.");
      }

      if (character.isMoving()) {
        return false;
      }

      if (character.x === runtime.lastX && character.y === runtime.lastY) {
        runtime.stuckFrames += 1;
      } else {
        runtime.stuckFrames = 0;
        runtime.lastX = character.x;
        runtime.lastY = character.y;
      }

      if (runtime.stuckFrames > 30) {
        if (step.failBehavior === "continue") {
          SED.Logger.warn("moveTo stuck; continuing.");
          return true;
        }

        throw new Error("moveTo stuck.");
      }

      const direction = character.findDirectionTo(Number(step.x), Number(step.y));

      if (direction > 0) {
        character.moveStraight(direction);
      } else {
        runtime.stuckFrames += 1;
      }

      return false;
    }
  });

  SED.registerModule("Step_Movement", "0.1.0");
})();
