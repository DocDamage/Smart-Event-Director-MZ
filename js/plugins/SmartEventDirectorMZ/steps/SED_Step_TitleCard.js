(() => {
  "use strict";

  const SED = window.SED;

  SED.StepRegistry.register({
    types: ["titleCard"],

    validate(step) {
      const errors = [];
      if (!step.title || typeof step.title !== "string") {
        errors.push("titleCard step missing title.");
      }
      if (step.duration !== undefined && Number(step.duration) < 0) {
        errors.push("titleCard duration must be >= 0.");
      }
      if (step.fadeIn !== undefined && Number(step.fadeIn) < 0) {
        errors.push("titleCard fadeIn must be >= 0.");
      }
      if (step.fadeOut !== undefined && Number(step.fadeOut) < 0) {
        errors.push("titleCard fadeOut must be >= 0.");
      }
      return errors;
    },

    start(step, context, runtime) {
      const title = String(step.title || "");
      const subtitle = step.subtitle ? String(step.subtitle) : null;
      const fadeIn = Math.max(0, Number(step.fadeIn || 30));
      const duration = Math.max(0, Number(step.duration || 180));
      const fadeOut = Math.max(0, Number(step.fadeOut || 30));
      const wait = step.wait !== false;
      const now = Graphics.frameCount;

      const rect = new Rectangle(0, 0, Graphics.boxWidth, Graphics.boxHeight);
      const win = new Window_Base(rect);
      win.backOpacity = 200;
      win.opacity = 0;
      win.contentsOpacity = 0;

      // Dark semi-transparent background
      win.contents.fillRect(0, 0, Graphics.boxWidth, Graphics.boxHeight, "rgba(0, 0, 0, 0.5)");

      // Title
      win.contents.fontSize = 48;
      const titleWidth = win.textWidth(title);
      const titleX = Math.floor((Graphics.boxWidth - titleWidth) / 2);
      const titleY = subtitle ? Math.floor(Graphics.boxHeight / 2) - 40 : Math.floor(Graphics.boxHeight / 2) - 20;
      win.drawText(title, titleX, titleY, titleWidth, "left");

      // Subtitle
      if (subtitle) {
        win.contents.fontSize = 24;
        const subWidth = win.textWidth(subtitle);
        const subX = Math.floor((Graphics.boxWidth - subWidth) / 2);
        const subY = titleY + 56;
        win.drawText(subtitle, subX, subY, subWidth, "left");
      }

      win.contents.fontSize = $gameSystem.mainFontSize();

      if (SceneManager._scene && SceneManager._scene.addChild) {
        SceneManager._scene.addChild(win);
      }

      runtime.window = win;
      runtime.phase = wait ? "fadeIn" : "done";
      runtime.fadeInStart = now;
      runtime.fadeInEnd = now + fadeIn;
      runtime.holdEnd = now + fadeIn + duration;
      runtime.fadeOutEnd = now + fadeIn + duration + fadeOut;
      runtime.wait = wait;

      if (!wait) {
        win.contentsOpacity = 255;
      }
    },

    update(step, context, runtime) {
      const win = runtime.window;
      if (!win) return true;

      const fc = Graphics.frameCount;
      const fadeIn = Math.max(1, Number(step.fadeIn || 30));
      const fadeOut = Math.max(1, Number(step.fadeOut || 30));

      if (runtime.phase === "fadeIn") {
        if (fc >= runtime.fadeInEnd) {
          win.contentsOpacity = 255;
          runtime.phase = "hold";
        } else {
          const progress = (fc - runtime.fadeInStart) / fadeIn;
          win.contentsOpacity = Math.floor(255 * progress);
        }
        return false;
      }

      if (runtime.phase === "hold") {
        win.contentsOpacity = 255;
        if (fc >= runtime.holdEnd) {
          runtime.phase = "fadeOut";
        }
        return false;
      }

      if (runtime.phase === "fadeOut") {
        if (fc >= runtime.fadeOutEnd) {
          win.contentsOpacity = 0;
          runtime.phase = "done";
        } else {
          const progress = (fc - runtime.holdEnd) / fadeOut;
          win.contentsOpacity = Math.floor(255 * (1 - progress));
        }
        return false;
      }

      if (runtime.phase === "done") {
        this._removeWindow(win);
        runtime.window = null;
        return true;
      }

      return true;
    },

    cancel(step, context, runtime) {
      if (runtime.window) {
        this._removeWindow(runtime.window);
        runtime.window = null;
      }
    },

    _removeWindow(win) {
      if (win && win.parent) {
        win.parent.removeChild(win);
      }
    }
  });

  SED.registerModule("Step_TitleCard", "0.5.0");
})();
