(() => {
  "use strict";

  const SED = window.SED;

  const CODE_MAP = {
    moveDown: 1,
    moveLeft: 2,
    moveRight: 3,
    moveUp: 4,
    moveLowerLeft: 5,
    moveLowerRight: 6,
    moveUpperLeft: 7,
    moveUpperRight: 8,
    moveRandom: 9,
    moveTowardPlayer: 10,
    moveAwayFromPlayer: 11,
    stepForward: 12,
    stepBackward: 13,
    jump: 14,
    wait: 15,
    turnDown: 16,
    turnLeft: 17,
    turnRight: 18,
    turnUp: 19,
    turnRight90: 20,
    turnLeft90: 21,
    turn180: 22,
    turnRightOrLeft90: 23,
    turnRandom: 24,
    turnTowardPlayer: 25,
    turnAwayFromPlayer: 26,
    switchOn: 27,
    switchOff: 28,
    changeSpeed: 29,
    changeFreq: 30,
    walkAnimeOn: 31,
    walkAnimeOff: 32,
    stepAnimeOn: 33,
    stepAnimeOff: 34,
    dirFixOn: 35,
    dirFixOff: 36,
    throughOn: 37,
    throughOff: 38,
    transparentOn: 39,
    transparentOff: 40,
    changeImage: 41,
    changeOpacity: 42,
    changeBlendMode: 43,
    playSE: 44,
    script: 45
  };

  function buildRouteList(commands) {
    const list = [];

    for (const cmd of commands) {
      const code = CODE_MAP[cmd.code];
      if (code === undefined) continue;

      const entry = { code: code };

      switch (cmd.code) {
        case "jump":
          entry.parameters = [Number(cmd.x || 0), Number(cmd.y || 0)];
          break;
        case "wait":
          entry.parameters = [Number(cmd.frames || 0)];
          break;
        case "switchOn":
        case "switchOff":
          entry.parameters = [Number(cmd.switchId || 0)];
          break;
        case "changeSpeed":
          entry.parameters = [Number(cmd.speed || 4)];
          break;
        case "changeFreq":
          entry.parameters = [Number(cmd.freq || 6)];
          break;
        case "changeImage":
          entry.parameters = [String(cmd.characterName || ""), Number(cmd.characterIndex || 0)];
          break;
        case "changeOpacity":
          entry.parameters = [Number(cmd.opacity || 255)];
          break;
        case "changeBlendMode":
          entry.parameters = [Number(cmd.blendMode || 0)];
          break;
        case "playSE":
          entry.parameters = [
            cmd.se || {
              name: String(cmd.name || ""),
              volume: Number(cmd.volume || 90),
              pitch: Number(cmd.pitch || 100),
              pan: Number(cmd.pan || 0)
            }
          ];
          break;
        case "script":
          entry.parameters = [String(cmd.codeString || cmd.script || "")];
          break;
        default:
          break;
      }

      list.push(entry);
    }

    list.push({ code: 0 });

    return list;
  }

  SED.StepRegistry.register({
    types: ["moveRoute"],

    validate(step) {
      const errors = [];

      if (!Array.isArray(step.commands) || step.commands.length === 0) {
        errors.push("moveRoute requires a non-empty commands array.");
      } else {
        for (let i = 0; i < step.commands.length; i++) {
          const cmd = step.commands[i];
          if (!cmd || typeof cmd.code !== "string") {
            errors.push("moveRoute commands[" + i + "] missing code string.");
          } else if (CODE_MAP[cmd.code] === undefined) {
            errors.push("moveRoute commands[" + i + "] unknown code: " + cmd.code);
          }
        }
      }

      return errors;
    },

    start(step, context, runtime) {
      const character = SED.Util.characterFromId(step.eventId, context.interpreter);

      if (!character) {
        throw new Error("moveRoute could not find character: " + step.eventId);
      }

      const route = {
        list: buildRouteList(step.commands),
        repeat: false,
        skippable: false,
        wait: false
      };

      character.forceMoveRoute(route);

      runtime.character = character;
      runtime.wait = step.wait !== false;
      runtime.timeoutFrame = Graphics.frameCount + Number(step.timeoutFrames || 600);

      if (character instanceof Game_Event) {
        runtime.initialPage = character._pageIndex;
      }
    },

    update(step, context, runtime) {
      if (!runtime.wait) {
        return true;
      }

      const character = runtime.character;
      if (character instanceof Game_Event) {
        if (character._erased || !$gameMap.event(character.eventId())) {
          if (step.failBehavior === "continue") {
            SED.Logger.warn("Character erased or missing; continuing.");
            return true;
          }
          throw new Error("Character erased or missing during moveRoute.");
        }
        if (character._pageIndex !== runtime.initialPage) {
          SED.Logger.warn("Event page changed mid-scene: event " + step.eventId);
        }
      }

      if (Graphics.frameCount > runtime.timeoutFrame) {
        if (step.failBehavior === "continue") {
          SED.Logger.warn("moveRoute timeout; continuing.");
          return true;
        }

        throw new Error("moveRoute timeout.");
      }

      return !character.isMoveRouteForcing();
    },

    cancel() {}
  });

  SED.registerModule("Step_MoveRoute", "0.1.0");
})();
