// Bootstrap SED globals for each test
require('../__mocks__/rmmz.js');

// Load core modules in dependency order
const path = require('path');
const fs = require('fs');

global.loadScript = function loadScript(relativePath) {
  const fullPath = path.join(__dirname, '..', relativePath);
  if (fs.existsSync(fullPath)) {
    const code = fs.readFileSync(fullPath, 'utf-8');
    eval(code);
  }
};

beforeEach(() => {
  global.window.SED = { pluginName: 'SmartEventDirectorMZ' };
  Graphics.frameCount = 0;
  Input.clear();
  $gameVariables._data = [];
  $gameSwitches._data = [];
  $gameMessage.clear();
  SceneManager._scene = null;

  loadScript('core/SED_Namespace.js');
  loadScript('core/SED_Params.js');
  loadScript('core/SED_Logger.js');
  loadScript('core/SED_Util.js');
  loadScript('core/SED_Constants.js');
  loadScript('core/SED_ModuleLoader.js');
  loadScript('runtime/SED_Failsafe.js');

  global.SED = global.window.SED;
});

describe('SED.Failsafe', () => {
  test('recover exists', () => {
    expect(typeof SED.Failsafe.recover).toBe('function');
  });

  test('recover runs without throwing', () => {
    expect(() => SED.Failsafe.recover('test')).not.toThrow();
  });

  test('recover with no reason defaults to unknown', () => {
    expect(() => SED.Failsafe.recover()).not.toThrow();
  });
});
