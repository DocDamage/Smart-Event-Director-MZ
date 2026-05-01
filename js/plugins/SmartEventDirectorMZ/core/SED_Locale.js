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

  async function reloadLocale(locale) {
    for (const key in strings) {
      delete strings[key];
    }
    const data = await SED.DataLoader.loadLocale(locale);
    if (data) {
      loadStrings(data);
      setLocale(locale);
    }
  }

  SED.Locale = {
    setLocale,
    getLocale,
    loadStrings,
    get,
    resolveStepText,
    reloadLocale
  };

  SED.registerModule("Locale", "1.1.0");
})();
