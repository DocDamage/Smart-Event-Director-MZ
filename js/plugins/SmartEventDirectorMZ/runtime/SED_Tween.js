(() => {
  "use strict";

  const SED = window.SED;

  SED.Tween = {
    _tweens: [],
    _idCounter: 1,

    easings: {
      linear(t) {
        return t;
      },
      easeIn(t) {
        return t * t;
      },
      easeOut(t) {
        return t * (2 - t);
      },
      easeInOut(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      },
      easeInQuad(t) {
        return t * t;
      },
      easeOutQuad(t) {
        return t * (2 - t);
      }
    },

    to(obj, properties, duration, easing, onComplete) {
      const tween = {
        _id: this._idCounter++,
        obj: obj,
        start: {},
        end: {},
        duration: Math.max(1, Number(duration) || 1),
        elapsed: 0,
        easing: this.easings[easing] || this.easings.linear,
        onComplete: onComplete || null
      };
      for (const key in properties) {
        if (properties.hasOwnProperty(key)) {
          tween.end[key] = properties[key];
          tween.start[key] = obj[key] !== undefined ? obj[key] : 0;
        }
      }
      this._tweens.push(tween);
      return tween;
    },

    stop(tweenOrId) {
      if (!tweenOrId) return;
      const id = typeof tweenOrId === "number" ? tweenOrId : tweenOrId._id;
      const idx = this._tweens.findIndex(t => t._id === id);
      if (idx >= 0) this._tweens.splice(idx, 1);
    },

    stopAllForObject(obj) {
      for (let i = this._tweens.length - 1; i >= 0; i--) {
        if (this._tweens[i].obj === obj) {
          this._tweens.splice(i, 1);
        }
      }
    },

    clear() {
      this._tweens.length = 0;
    },

    update() {
      const tweens = this._tweens;
      for (let i = tweens.length - 1; i >= 0; i--) {
        const tween = tweens[i];
        tween.elapsed++;
        const progress = Math.min(1, tween.elapsed / tween.duration);
        const eased = tween.easing(progress);
        const obj = tween.obj;
        for (const key in tween.end) {
          if (tween.end.hasOwnProperty(key)) {
            const start = tween.start[key];
            const end = tween.end[key];
            obj[key] = start + (end - start) * eased;
          }
        }
        if (progress >= 1) {
          if (tween.onComplete) {
            tween.onComplete();
          }
          tweens.splice(i, 1);
        }
      }
    },

    activeCount() {
      return this._tweens.length;
    }
  };

  SED.registerModule("Tween", "1.2.0");

  if (SED.UpdateDispatcher) {
    SED.UpdateDispatcher.register("Tween", {
      update: function() { if (SED.Tween && SED.Tween.update) SED.Tween.update(); },
      priority: 20,
      contexts: ["map"]
    });
  }
})();
