(() => {
  "use strict";

  const SED = window.SED;

  const _busts = new Map();
  let _bustLayer = null;
  let _lastScene = null;
  let _focused = null;

  // Self-register with UpdateDispatcher for base-scene context
  if (SED.UpdateDispatcher) {
    SED.UpdateDispatcher.register("BustManager", {
      update: function() { if (SED.BustManager) SED.BustManager.update(); },
      priority: 50,
      contexts: ["base"]
    });
  }

  function targetX(position) {
    const w = Graphics.boxWidth;
    const cx = w / 2;
    switch (position) {
      case "left": return cx - w * 0.30;
      case "right": return cx + w * 0.30;
      case "center": return cx;
      case "offscreenLeft": return -w * 0.25;
      case "offscreenRight": return w + w * 0.25;
      default: return cx;
    }
  }

  function targetY() {
    return Graphics.boxHeight;
  }

  function resolveBustName(character, emotion) {
    if (emotion && emotion !== "neutral") {
      return character + "_" + emotion;
    }
    return character;
  }

  function createBustSprite(character, emotion) {
    const name = resolveBustName(character, emotion);
    const bitmap = ImageManager.loadBitmap("img/pictures/", name);
    const sprite = new Sprite(bitmap);
    sprite.anchor.x = 0.5;
    sprite.anchor.y = 1.0;
    sprite.x = targetX("center");
    sprite.y = targetY();
    return sprite;
  }

  function getBustLayer() {
    const scene = SceneManager._scene;
    if (!scene) return null;
    if (_lastScene !== scene || !_bustLayer || !_bustLayer.parent) {
      _lastScene = scene;
      if (_bustLayer && _bustLayer.parent) {
        _bustLayer.parent.removeChild(_bustLayer);
      }
      _bustLayer = new Sprite();
      _bustLayer.name = "SED_BustLayer";
      _busts.clear();
      _focused = null;
    }
    if (_bustLayer.parent !== scene) {
      scene.addChild(_bustLayer);
    }
    const idx = scene.children.indexOf(_bustLayer);
    if (idx >= 0 && idx < scene.children.length - 1) {
      scene.setChildIndex(_bustLayer, scene.children.length - 1);
    }
    return _bustLayer;
  }

  SED.BustManager = {
    _busts: _busts,

    show(character, emotion, position, enterAnimation) {
      const existing = _busts.get(character);
      if (existing && existing.parent) {
        existing.parent.removeChild(existing);
      }
      _busts.delete(character);

      const sprite = createBustSprite(character, emotion);
      sprite._sedBust = {
        character,
        emotion,
        position,
        targetX: targetX(position),
        targetY: targetY(),
        enterAnimation: enterAnimation || "fadeIn",
        enterProgress: 0,
        enterDuration: SED.Constants.BUST_ENTER_DURATION,
        exiting: false,
        exitAnimation: null,
        exitProgress: 0,
        exitDuration: SED.Constants.BUST_EXIT_DURATION
      };

      if (enterAnimation === "slideLeft") {
        sprite.x = targetX("offscreenRight");
        sprite.opacity = 255;
      } else if (enterAnimation === "slideRight") {
        sprite.x = targetX("offscreenLeft");
        sprite.opacity = 255;
      } else {
        sprite.x = sprite._sedBust.targetX;
        sprite.opacity = 0;
      }

      _busts.set(character, sprite);
      getBustLayer().addChild(sprite);
    },

    hide(character, exitAnimation) {
      const sprite = _busts.get(character);
      if (!sprite) return;
      sprite._sedBust.exiting = true;
      sprite._sedBust.exitAnimation = exitAnimation || "fadeOut";
      sprite._sedBust.exitProgress = 0;
    },

    setEmotion(character, emotion) {
      const sprite = _busts.get(character);
      if (!sprite) return;
      const name = resolveBustName(character, emotion);
      sprite.bitmap = ImageManager.loadBitmap("img/pictures/", name);
      sprite._sedBust.emotion = emotion;
    },

    focus(character) {
      _focused = character;
    },

    clear() {
      _busts.forEach((sprite) => {
        if (sprite.parent) sprite.parent.removeChild(sprite);
      });
      _busts.clear();
      _focused = null;
    },

    update() {
      const layer = getBustLayer();
      if (!layer) return;
      _busts.forEach((sprite, character) => {
        const data = sprite._sedBust;
        let baseOpacity = 255;

        if (data.exiting) {
          data.exitProgress++;
          const t = Math.min(data.exitProgress / data.exitDuration, 1);
          if (data.exitAnimation === "slideOutLeft") {
            sprite.x = data.targetX + (targetX("offscreenLeft") - data.targetX) * t;
            baseOpacity = 255 * (1 - t);
          } else if (data.exitAnimation === "slideOutRight") {
            sprite.x = data.targetX + (targetX("offscreenRight") - data.targetX) * t;
            baseOpacity = 255 * (1 - t);
          } else {
            sprite.x = data.targetX;
            baseOpacity = 255 * (1 - t);
          }
          if (data.exitProgress >= data.exitDuration) {
            if (sprite.parent) sprite.parent.removeChild(sprite);
            _busts.delete(character);
            return;
          }
        } else if (data.enterProgress < data.enterDuration) {
          data.enterProgress++;
          const t = Math.min(data.enterProgress / data.enterDuration, 1);
          if (data.enterAnimation === "slideLeft") {
            sprite.x = targetX("offscreenRight") + (data.targetX - targetX("offscreenRight")) * t;
            baseOpacity = 255;
          } else if (data.enterAnimation === "slideRight") {
            sprite.x = targetX("offscreenLeft") + (data.targetX - targetX("offscreenLeft")) * t;
            baseOpacity = 255;
          } else {
            sprite.x = data.targetX;
            baseOpacity = 255 * t;
          }
        } else {
          sprite.x = data.targetX;
          baseOpacity = 255;
        }

        if (!data.exiting && _focused && character !== _focused) {
          baseOpacity = Math.min(baseOpacity, SED.Constants.UNFOCUSED_OPACITY);
        }
        sprite.opacity = baseOpacity;
      });
    }
  };

  SED.registerModule("BustManager", "1.0.0");
})();
