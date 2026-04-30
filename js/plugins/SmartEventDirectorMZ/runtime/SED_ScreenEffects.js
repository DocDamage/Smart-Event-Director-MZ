(() => {
  "use strict";

  const SED = window.SED;

  const Easing = {
    linear(t) { return t; },
    easeIn(t) { return t * t; },
    easeOut(t) { return 1 - (1 - t) * (1 - t); },
    easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  };

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

    shake(intensity, duration, decay) {
      this._shakeIntensity = Number(intensity || 5);
      this._shakeDuration = Math.max(1, Number(duration || 30));
      this._shakeDecay = Math.max(0, Number(decay || 0));
      this._shakeTimer = this._shakeDuration;

      const power = Math.max(0, Math.min(Math.round(this._shakeIntensity), 9));
      const speed = Math.max(1, Math.min(Math.round(this._shakeIntensity), 9));
      $gameScreen.startShake(power, speed, this._shakeDuration);
    },

    zoomTo(zoom, duration, easing) {
      this._zoomStart = ($gameScreen && $gameScreen._zoomScale) || 1;
      this._zoomTarget = Number(zoom || 1);
      this._zoomDuration = Math.max(1, Number(duration || 30));
      this._zoomTimer = this._zoomDuration;
      this._zoomEasing = String(easing || "linear");
    },

    reset(duration) {
      this.zoomTo(1.0, duration, "easeOut");
    },

    update() {
      if (this._zoomTimer > 0) {
        this._zoomTimer--;
        const t = 1 - (this._zoomTimer / this._zoomDuration);
        const easeFn = Easing[this._zoomEasing] || Easing.linear;
        const value = this._zoomStart + (this._zoomTarget - this._zoomStart) * easeFn(t);
        if ($gameScreen) {
          $gameScreen._zoomScale = value;
        }
      }

      if (this._shakeTimer > 0) {
        this._shakeTimer--;
        if (this._shakeDecay > 0 && this._shakeTimer > 0) {
          const progress = 1 - (this._shakeTimer / this._shakeDuration);
          const currentIntensity = this._shakeIntensity * (1 - progress * this._shakeDecay);
          const power = Math.max(0, Math.min(Math.round(currentIntensity), 9));
          if ($gameScreen && power > 0) {
            $gameScreen._shakePower = power;
          }
        }
      }
    }
  };

  SED.ScreenEffects = ScreenEffects;
  SED.registerModule("ScreenEffects", "1.0.0");
})();
