(() => {
  "use strict";

  const SED = window.SED;

  const Easing = {
    linear(t) { return t; },
    easeIn(t) { return t * t; },
    easeOut(t) { return 1 - (1 - t) * (1 - t); },
    easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  };

  let _vignetteSprite = null;
  let _grainSprite = null;
  let _colorMatrixFilter = null;
  let _chromaticFilter = null;

  function ensureOverlayContainer() {
    const scene = SceneManager._scene;
    if (!scene) return null;
    let container = scene._sedOverlay;
    if (!container || container.parent !== scene) {
      container = new Sprite();
      container.name = "SED_ScreenEffectsOverlay";
      scene.addChild(container);
      scene._sedOverlay = container;
    }
    const idx = scene.children.indexOf(container);
    if (idx >= 0 && idx < scene.children.length - 1) {
      scene.setChildIndex(container, scene.children.length - 1);
    }
    return container;
  }

  function createVignetteBitmap() {
    const w = Graphics.width;
    const h = Graphics.height;
    const bitmap = new Bitmap(w, h);
    const ctx = bitmap.context;
    const grad = ctx.createRadialGradient(w / 2, h / 2, w * 0.25, w / 2, h / 2, w * 0.85);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0,1)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    bitmap._baseTexture.update();
    return bitmap;
  }

  function createGrainBitmap() {
    const size = SED.Constants.GRAIN_BITMAP_SIZE;
    const bitmap = new Bitmap(size, size);
    for (let i = 0; i < size * size * SED.Constants.GRAIN_DENSITY; i++) {
      const x = Math.random() * size | 0;
      const y = Math.random() * size | 0;
      const a = Math.random() * 0.25;
      bitmap.setPixel(x, y, [255, 255, 255, a * 255 | 0]);
    }
    bitmap._baseTexture.update();
    return bitmap;
  }

  function applyColorMatrixFilter() {
    const scene = SceneManager._scene;
    if (!scene) return;
    if (!_colorMatrixFilter) {
      _colorMatrixFilter = new PIXI.filters.ColorMatrixFilter();
    }
    const filters = scene.filters || [];
    if (!filters.includes(_colorMatrixFilter)) {
      filters.push(_colorMatrixFilter);
      scene.filters = filters;
    }
    return _colorMatrixFilter;
  }

  function removeColorMatrixFilter() {
    const scene = SceneManager._scene;
    if (!scene || !_colorMatrixFilter) return;
    const filters = (scene.filters || []).filter(f => f !== _colorMatrixFilter);
    scene.filters = filters.length > 0 ? filters : null;
  }

  class ChromaticAberrationFilter extends PIXI.Filter {
    constructor() {
      const fragmentSrc = `
        varying vec2 vTextureCoord;
        uniform sampler2D uSampler;
        uniform float intensity;

        void main(void) {
          vec2 redOffset = vec2(intensity, 0.0);
          vec2 blueOffset = vec2(-intensity, 0.0);
          float r = texture2D(uSampler, vTextureCoord + redOffset).r;
          float g = texture2D(uSampler, vTextureCoord).g;
          float b = texture2D(uSampler, vTextureCoord + blueOffset).b;
          float a = texture2D(uSampler, vTextureCoord).a;
          gl_FragColor = vec4(r, g, b, a);
        }
      `;

      super(undefined, fragmentSrc, { intensity: 0.0 });
    }

    get intensity() {
      return this.uniforms.intensity;
    }

    set intensity(value) {
      this.uniforms.intensity = value;
    }
  }

  function applyChromaticFilter() {
    const scene = SceneManager._scene;
    if (!scene) return;
    if (!_chromaticFilter) {
      _chromaticFilter = new ChromaticAberrationFilter();
    }
    const filters = scene.filters || [];
    if (!filters.includes(_chromaticFilter)) {
      filters.push(_chromaticFilter);
      scene.filters = filters;
    }
    return _chromaticFilter;
  }

  function removeChromaticFilter() {
    const scene = SceneManager._scene;
    if (!scene || !_chromaticFilter) return;
    const filters = (scene.filters || []).filter(f => f !== _chromaticFilter);
    scene.filters = filters.length > 0 ? filters : null;
  }

  const ScreenEffects = {
    _zoomStart: 1,
    _zoomTarget: 1,
    _zoomDuration: 0,
    _zoomTimer: 0,
    _zoomEasing: "linear",

    _shakeIntensity: 0,
    _shakeDuration: 0,
    _shakeDecay: 0,
    _shakeTimer: 0,

    _vignetteIntensity: 0,
    _vignetteTarget: 0,
    _vignetteDuration: 0,
    _vignetteTimer: 0,
    _vignetteEasing: "linear",

    _grainIntensity: 0,
    _grainTarget: 0,
    _grainDuration: 0,
    _grainTimer: 0,

    _colorMatrix: { brightness: 1, contrast: 1, saturation: 1, temperature: 0 },
    _colorMatrixTarget: { brightness: 1, contrast: 1, saturation: 1, temperature: 0 },
    _colorMatrixDuration: 0,
    _colorMatrixTimer: 0,
    _colorMatrixEasing: "linear",

    _chromaticIntensity: 0,
    _chromaticTarget: 0,
    _chromaticDuration: 0,
    _chromaticTimer: 0,
    _chromaticEasing: "linear",

    shake(intensity, duration, decay) {
      this._shakeIntensity = Number(intensity || 5);
      this._shakeDuration = Math.max(1, Number(duration || SED.Constants.DEFAULT_EFFECT_DURATION));
      this._shakeDecay = Math.max(0, Number(decay || 0));
      this._shakeTimer = this._shakeDuration;
      const power = Math.max(0, Math.min(Math.round(this._shakeIntensity), 9));
      const speed = Math.max(1, Math.min(Math.round(this._shakeIntensity), 9));
      $gameScreen.startShake(power, speed, this._shakeDuration);
    },

    zoomTo(zoom, duration, easing) {
      this._zoomStart = ($gameScreen && $gameScreen._zoomScale) || 1;
      this._zoomTarget = Number(zoom || 1);
      this._zoomDuration = Math.max(1, Number(duration || SED.Constants.DEFAULT_EFFECT_DURATION));
      this._zoomTimer = this._zoomDuration;
      this._zoomEasing = String(easing || "linear");
    },

    vignette(intensity, duration, easing) {
      this._vignetteTarget = Math.max(0, Math.min(1, Number(intensity || 0)));
      this._vignetteDuration = Math.max(1, Number(duration || SED.Constants.DEFAULT_EFFECT_DURATION));
      this._vignetteTimer = this._vignetteDuration;
      this._vignetteEasing = String(easing || "linear");
      if (!_vignetteSprite && this._vignetteTarget > 0) {
        const container = ensureOverlayContainer();
        if (container) {
          _vignetteSprite = new Sprite(createVignetteBitmap());
          _vignetteSprite.opacity = 0;
          container.addChild(_vignetteSprite);
        }
      }
    },

    grain(intensity, duration) {
      this._grainTarget = Math.max(0, Math.min(1, Number(intensity || 0)));
      this._grainDuration = Math.max(1, Number(duration || SED.Constants.DEFAULT_EFFECT_DURATION));
      this._grainTimer = this._grainDuration;
      if (!_grainSprite && this._grainTarget > 0) {
        const container = ensureOverlayContainer();
        if (container) {
          _grainSprite = new TilingSprite(createGrainBitmap());
          _grainSprite.move(0, 0, Graphics.width, Graphics.height);
          _grainSprite.blendMode = 1;
          _grainSprite.opacity = 0;
          container.addChild(_grainSprite);
        }
      }
    },

    colorGrade(params, duration, easing) {
      params = params || {};
      this._colorMatrixTarget = {
        brightness: Number(params.brightness !== undefined ? params.brightness : 1),
        contrast: Number(params.contrast !== undefined ? params.contrast : 1),
        saturation: Number(params.saturation !== undefined ? params.saturation : 1),
        temperature: Number(params.temperature !== undefined ? params.temperature : 0)
      };
      this._colorMatrixDuration = Math.max(1, Number(duration || SED.Constants.DEFAULT_EFFECT_DURATION));
      this._colorMatrixTimer = this._colorMatrixDuration;
      this._colorMatrixEasing = String(easing || "linear");
      applyColorMatrixFilter();
    },

    chromaticAberration(intensity, duration, easing) {
      this._chromaticTarget = Math.max(0, Number(intensity || 0));
      this._chromaticDuration = Math.max(1, Number(duration || SED.Constants.DEFAULT_EFFECT_DURATION));
      this._chromaticTimer = this._chromaticDuration;
      this._chromaticEasing = String(easing || "linear");
      if (this._chromaticTarget > 0) {
        applyChromaticFilter();
      }
    },

    reset(duration) {
      this.zoomTo(1.0, duration, "easeOut");
      this.vignette(0, duration, "easeOut");
      this.grain(0, duration);
      this.colorGrade({ brightness: 1, contrast: 1, saturation: 1, temperature: 0 }, duration, "easeOut");
      this.chromaticAberration(0, duration, "easeOut");
    },

    clearAll() {
      this._zoomTimer = 0;
      this._shakeTimer = 0;
      this._vignetteTimer = 0;
      this._grainTimer = 0;
      this._colorMatrixTimer = 0;
      this._chromaticTimer = 0;
      if (_vignetteSprite && _vignetteSprite.parent) _vignetteSprite.parent.removeChild(_vignetteSprite);
      if (_grainSprite && _grainSprite.parent) _grainSprite.parent.removeChild(_grainSprite);
      _vignetteSprite = null;
      _grainSprite = null;
      removeColorMatrixFilter();
      removeChromaticFilter();
    },

    update() {
      if (this._zoomTimer > 0) {
        this._zoomTimer--;
        const t = 1 - (this._zoomTimer / this._zoomDuration);
        const easeFn = Easing[this._zoomEasing] || Easing.linear;
        const value = this._zoomStart + (this._zoomTarget - this._zoomStart) * easeFn(t);
        if ($gameScreen) $gameScreen._zoomScale = value;
      }

      if (this._shakeTimer > 0) {
        this._shakeTimer--;
        if (this._shakeDecay > 0 && this._shakeTimer > 0) {
          const progress = 1 - (this._shakeTimer / this._shakeDuration);
          const currentIntensity = this._shakeIntensity * (1 - progress * this._shakeDecay);
          const power = Math.max(0, Math.min(Math.round(currentIntensity), 9));
          if ($gameScreen && power > 0) $gameScreen._shakePower = power;
        }
      }

      if (this._vignetteTimer > 0) {
        this._vignetteTimer--;
        const t = 1 - (this._vignetteTimer / this._vignetteDuration);
        const easeFn = Easing[this._vignetteEasing] || Easing.linear;
        const value = this._vignetteIntensity + (this._vignetteTarget - this._vignetteIntensity) * easeFn(t);
        if (_vignetteSprite) {
          _vignetteSprite.opacity = Math.round(value * 255);
        }
        if (this._vignetteTimer === 0) this._vignetteIntensity = this._vignetteTarget;
      }

      if (this._grainTimer > 0) {
        this._grainTimer--;
        const t = 1 - (this._grainTimer / this._grainDuration);
        const value = this._grainIntensity + (this._grainTarget - this._grainIntensity) * t;
        if (_grainSprite) {
          _grainSprite.opacity = Math.round(value * 255);
          _grainSprite.origin.x = Math.random() * SED.Constants.GRAIN_BITMAP_SIZE;
          _grainSprite.origin.y = Math.random() * SED.Constants.GRAIN_BITMAP_SIZE;
        }
        if (this._grainTimer === 0) this._grainIntensity = this._grainTarget;
      }

      if (this._colorMatrixTimer > 0) {
        this._colorMatrixTimer--;
        const t = 1 - (this._colorMatrixTimer / this._colorMatrixDuration);
        const easeFn = Easing[this._colorMatrixEasing] || Easing.linear;
        const lerp = (a, b, f) => a + (b - a) * f;
        const ft = easeFn(t);
        const cm = _colorMatrixFilter;
        if (cm) {
          cm.reset();
          const b = lerp(this._colorMatrix.brightness, this._colorMatrixTarget.brightness, ft);
          const c = lerp(this._colorMatrix.contrast, this._colorMatrixTarget.contrast, ft);
          const s = lerp(this._colorMatrix.saturation, this._colorMatrixTarget.saturation, ft);
          const temp = lerp(this._colorMatrix.temperature, this._colorMatrixTarget.temperature, ft);
          cm.brightness(b, false);
          cm.contrast(c, false);
          cm.saturate(s, false);
          if (temp > 0) cm.technicolor(false);
          else if (temp < 0) cm.night(false);
          cm._updateColorMatrix();
        }
        if (this._colorMatrixTimer === 0) {
          this._colorMatrix = { ...this._colorMatrixTarget };
        }
      }

      if (this._chromaticTimer > 0) {
        this._chromaticTimer--;
        const t = 1 - (this._chromaticTimer / this._chromaticDuration);
        const easeFn = Easing[this._chromaticEasing] || Easing.linear;
        const value = this._chromaticIntensity + (this._chromaticTarget - this._chromaticIntensity) * easeFn(t);
        if (value > 0) {
          applyChromaticFilter();
          if (_chromaticFilter) {
            _chromaticFilter.intensity = value * 0.01;
          }
        } else if (_chromaticFilter) {
          removeChromaticFilter();
        }
        if (this._chromaticTimer === 0) {
          this._chromaticIntensity = this._chromaticTarget;
          if (this._chromaticIntensity === 0) {
            removeChromaticFilter();
          }
        }
      }
    }
  };

  SED.ScreenEffects = ScreenEffects;
  SED.registerModule("ScreenEffects", "1.2.0");

  if (SED.UpdateDispatcher) {
    SED.UpdateDispatcher.register("ScreenEffects", {
      update: function() { if (SED.ScreenEffects && SED.ScreenEffects.update) SED.ScreenEffects.update(); },
      priority: 40,
      contexts: ["map"]
    });
  }
})();
