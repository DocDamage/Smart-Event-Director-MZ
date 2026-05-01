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
  // Reset SED namespace
  global.window.SED = { pluginName: 'SmartEventDirectorMZ' };

  // Reset RPG Maker globals
  Graphics.frameCount = 0;
  Input.clear();
  $gameVariables._data = [];
  $gameSwitches._data = [];
  $gameMessage.clear();
  SceneManager._scene = null;

  // Load minimal core
  loadScript('core/SED_Namespace.js');
  loadScript('core/SED_Params.js');
  loadScript('core/SED_Logger.js');
  loadScript('core/SED_Util.js');
  loadScript('core/SED_Constants.js');
  loadScript('core/SED_ModuleLoader.js');

  // Expose SED globally for test convenience
  global.SED = global.window.SED;
});
