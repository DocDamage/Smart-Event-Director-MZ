const path = require('path');
const fs = require('fs');

function loadScript(relativePath) {
  const fullPath = path.join(__dirname, '..', relativePath);
  if (fs.existsSync(fullPath)) {
    const code = fs.readFileSync(fullPath, 'utf-8');
    eval(code);
  }
}

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
  loadScript('runtime/SED_Save.js');

  global.SED = global.window.SED;
});

describe('SED.Save', () => {
  test('markPlayed and getPlayed', () => {
    expect(SED.Save.getPlayed('intro')).toBe(false);
    SED.Save.markPlayed('intro');
    expect(SED.Save.getPlayed('intro')).toBe(true);
  });

  test('markCompleted and getCompleted', () => {
    expect(SED.Save.getCompleted('ending')).toBe(false);
    SED.Save.markCompleted('ending');
    expect(SED.Save.getCompleted('ending')).toBe(true);
  });

  test('setChoice and getChoice', () => {
    SED.Save.setChoice('mira_intro', 1);
    expect(SED.Save.getChoice('mira_intro')).toBe(1);
  });

  test('toJSON returns correct structure', () => {
    SED.Save.markPlayed('scene1');
    SED.Save.markCompleted('scene2');
    SED.Save.setChoice('key1', 0);

    const json = SED.Save.toJSON();
    expect(json.version).toBe(4);
    expect(json.playedScenes.scene1).toBe(true);
    expect(json.completedScenes.scene2).toBe(true);
    expect(json.choices.key1).toBe(0);
  });

  test('fromJSON restores state', () => {
    const data = {
      version: 4,
      playedScenes: { a: true },
      completedScenes: { b: true },
      choices: { c: 2 },
      flags: { d: true }
    };
    SED.Save.fromJSON(data);

    expect(SED.Save.getPlayed('a')).toBe(true);
    expect(SED.Save.getCompleted('b')).toBe(true);
    expect(SED.Save.getChoice('c')).toBe(2);
  });

  test('fromJSON handles missing fields', () => {
    SED.Save.fromJSON(null);
    expect(SED.Save.toJSON().version).toBe(4);
  });

  test('getResumeData returns null initially', () => {
    expect(SED.Save.getResumeData()).toBeNull();
  });

  test('clearResumeData clears resume data', () => {
    SED.Save.fromJSON({ activeScene: { sceneId: 'test' } });
    expect(SED.Save.getResumeData()).toEqual({ sceneId: 'test' });
    SED.Save.clearResumeData();
    expect(SED.Save.getResumeData()).toBeNull();
  });

  test('DataManager patches exist', () => {
    expect(typeof DataManager.makeSaveContents).toBe('function');
    expect(typeof DataManager.extractSaveContents).toBe('function');
  });

  test('makeSaveContents includes SED data', () => {
    SED.Save.markPlayed('test_scene');
    const contents = DataManager.makeSaveContents();
    expect(contents.smartEventDirector).toBeDefined();
    expect(contents.smartEventDirector.playedScenes.test_scene).toBe(true);
  });
});
