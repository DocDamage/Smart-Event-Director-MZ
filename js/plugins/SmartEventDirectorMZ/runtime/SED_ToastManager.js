(() => {
  "use strict";

  const SED = window.SED;

  SED.ToastManager = {
    create(config) {
      const queue = [];
      let activeToast = null;
      let sprite = null;

      const c = config || {};
      const width = c.width || 400;
      const height = c.height || 100;
      const maxQueue = c.maxQueue || 5;
      const defaultDuration = c.defaultDuration || SED.Constants.TOAST_DEFAULT_DURATION;
      const zIndex = c.zIndex || 9998;

      function getDuration() {
        const dur = Number(c.durationParam ? (SED.Params || {})[c.durationParam] : 0);
        return Number.isFinite(dur) && dur > 0 ? dur : defaultDuration;
      }

      function ensureSprite() {
        if (!sprite) {
          sprite = new Sprite();
          sprite.bitmap = new Bitmap(width, height);
          sprite.z = zIndex;
          sprite.visible = false;
        }
        return sprite;
      }

      function show(data) {
        if (queue.length >= maxQueue) {
          queue.shift();
        }
        queue.push({
          data: data || {},
          timer: getDuration(),
          opacity: 0,
          slideProgress: 1,
          phase: "fadeIn"
        });
      }

      function update() {
        const s = ensureSprite();
        const pos = c.getPosition ? c.getPosition(width, height) : { x: 0, y: 0 };
        s.baseX = pos.x;
        s.baseY = pos.y;

        if (!activeToast && queue.length > 0) {
          activeToast = queue.shift();
          activeToast.timer = getDuration();
          activeToast.opacity = 0;
          activeToast.slideProgress = 1;
          activeToast.phase = "fadeIn";
          s.visible = true;
          if (c.onShow) c.onShow(activeToast);
        }

        if (!activeToast) {
          s.visible = false;
          return;
        }

        const anim = c.animation || "none";
        const slideVec = c.getSlideVector ? c.getSlideVector() : { x: 0, y: 0 };
        const fadeStep = SED.Constants ? SED.Constants.TOAST_FADE_STEP : 15;

        if (activeToast.phase === "fadeIn") {
          if (anim === "none") {
            activeToast.opacity = 255;
            activeToast.slideProgress = 0;
          } else {
            activeToast.opacity = Math.min(255, activeToast.opacity + fadeStep);
            if (anim === "slide") {
              activeToast.slideProgress = Math.max(0, activeToast.slideProgress - 0.08);
            } else {
              activeToast.slideProgress = 0;
            }
          }
          if (activeToast.opacity >= 255 && activeToast.slideProgress <= 0) {
            activeToast.phase = "hold";
          }
        }

        if (activeToast.phase === "hold") {
          activeToast.timer--;
          if (activeToast.timer <= 60) {
            activeToast.phase = "fadeOut";
          }
        }

        if (activeToast.phase === "fadeOut") {
          if (anim === "none") {
            activeToast.opacity = 0;
            activeToast.slideProgress = 1;
          } else {
            activeToast.opacity = Math.max(0, activeToast.opacity - fadeStep);
            if (anim === "slide") {
              activeToast.slideProgress = Math.min(1, activeToast.slideProgress + 0.08);
            } else {
              activeToast.slideProgress = 0;
            }
          }
          if (activeToast.opacity <= 0 && (anim !== "slide" || activeToast.slideProgress >= 1)) {
            activeToast = null;
            s.visible = false;
          }
        }

        if (activeToast) {
          s.x = s.baseX + slideVec.x * activeToast.slideProgress;
          s.y = s.baseY + slideVec.y * activeToast.slideProgress;
        }
      }

      function draw() {
        const s = sprite;
        if (!s || !s.visible || !activeToast) return;
        if (!SceneManager._scene) return;

        const scene = SceneManager._scene;
        const cacheKey = c.cacheKey || "_sedToastSprite";
        if (!scene[cacheKey]) {
          scene[cacheKey] = s;
          if (scene.addChild) scene.addChild(s);
        }

        if (c.draw) {
          c.draw(s.bitmap, activeToast.data, activeToast.opacity, width, height);
        }
      }

      return {
        show,
        update,
        draw
      };
    }
  };

  SED.registerModule("ToastManager", "1.0.0");
})();
