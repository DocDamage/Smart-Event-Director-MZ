(() => {
  "use strict";

  const SED = window.SED;

  const strings = Object.create(null);
  let activeLocale = "en";

  function setLocale(locale) {
    activeLocale = String(locale || "en");
  }

  function getLocale() {
    return activeLocale;
  }

  function loadStrings(table) {
    if (!table || typeof table !== "object") return;
    for (const key in table) {
      if (Object.prototype.hasOwnProperty.call(table, key)) {
        strings[key] = table[key];
      }
    }
  }

  function get(key, fallback) {
    const value = strings[String(key)];
    return value !== undefined ? String(value) : (fallback !== undefined ? fallback : key);
  }

  function resolveStepText(step, textField, keyField) {
    if (step[keyField]) {
      return get(step[keyField], step[textField]);
    }
    return step[textField];
  }

  SED.Locale = {
    setLocale,
    getLocale,
    loadStrings,
    get,
    resolveStepText
  };

  SED.registerModule("Locale", "1.1.0");
})();
