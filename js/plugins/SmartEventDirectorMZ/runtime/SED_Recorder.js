(() => {
  "use strict";

  const SED = window.SED;

  let _recording = false;
  let _entries = [];
  let _startFrame = 0;

  function start() {
    _recording = true;
    _entries = [];
    _startFrame = Graphics.frameCount;
    SED.Logger.info("Recorder started.");
  }

  function stop() {
    _recording = false;
    SED.Logger.info("Recorder stopped. Entries:", _entries.length);
    return _entries.slice();
  }

  function isRecording() {
    return _recording;
  }

  function log(eventType, data) {
    if (!_recording) return;
    _entries.push({
      frame: Graphics.frameCount - _startFrame,
      timeSec: ((Graphics.frameCount - _startFrame) / 60).toFixed(2),
      type: eventType,
      data: SED.Util.cloneJson(data || {})
    });
  }

  function exportSRT() {
    const lines = [];
    const dialogue = _entries.filter(e => e.type === "dialogue" || e.type === "narration");
    for (let i = 0; i < dialogue.length; i++) {
      const entry = dialogue[i];
      const next = dialogue[i + 1];
      const start = entry.timeSec;
      const end = next ? next.timeSec : (parseFloat(start) + 3).toFixed(2);
      const text = entry.data.speaker ? entry.data.speaker + ": " + entry.data.text : entry.data.text;
      lines.push(String(i + 1));
      lines.push(formatSrtTime(start) + " --> " + formatSrtTime(end));
      lines.push(text);
      lines.push("");
    }
    return lines.join("\n");
  }

  function formatSrtTime(secStr) {
    const total = parseFloat(secStr);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = Math.floor(total % 60);
    const millis = Math.round((total % 1) * 1000);
    return pad(hours) + ":" + pad(minutes) + ":" + pad(secs) + "," + pad3(millis);
  }

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function pad3(n) {
    if (n < 10) return "00" + n;
    if (n < 100) return "0" + n;
    return String(n);
  }

  function clear() {
    _entries = [];
  }

  SED.Recorder = {
    start,
    stop,
    isRecording,
    log,
    exportSRT,
    clear,
    getEntries() { return _entries.slice(); }
  };

  SED.registerModule("Recorder", "2.0.0");
})();
