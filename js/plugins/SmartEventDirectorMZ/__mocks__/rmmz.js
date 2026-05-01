// RPG Maker MZ global mocks for SED runtime tests

global.window = global.window || {};
global.window.SED = {};

global.PluginManager = {
  parameters(name) { return {}; }
};

global.document = {
  createElement(tag) { return { src: '', async: false, onload: null, onerror: null }; },
  body: { appendChild() {} }
};

// Graphics
global.Graphics = {
  frameCount: 0,
  width: 816,
  height: 624,
  boxWidth: 816,
  boxHeight: 624
};

// SceneManager
global.SceneManager = {
  _scene: null
};

// Input
global.Input = {
  _currentState: {},
  isTriggered(key) { return !!this._currentState[key]; },
  clear() { this._currentState = {}; }
};

// TouchInput
global.TouchInput = {
  isTriggered() { return false; }
};

// AudioManager
global.AudioManager = {
  playSe() {},
  stopSe() {},
  playBgm() {},
  stopBgm() {}
};

// ImageManager
global.ImageManager = {
  loadBitmap() { return { isReady: () => true }; },
  loadSystem() { return { isReady: () => true }; },
  loadFace() { return { isReady: () => true }; },
  faceWidth: 144,
  faceHeight: 144
};

// $gamePlayer
global.$gamePlayer = {
  x: 0,
  y: 0,
  reserveTransfer() {}
};

// $gameMap
global.$gameMap = {
  mapId() { return 1; },
  event(id) { return null; }
};

// $gameVariables
global.$gameVariables = {
  _data: [],
  value(id) { return this._data[id] || 0; },
  setValue(id, value) { this._data[id] = value; }
};

// $gameSwitches
global.$gameSwitches = {
  _data: [],
  value(id) { return !!this._data[id]; },
  setValue(id, value) { this._data[id] = value; }
};

// $gameParty
global.$gameParty = {
  members() { return []; },
  gold() { return 0; },
  hasItem() { return false; }
};

// $gameScreen
global.$gameScreen = {
  startShake() {},
  startFadeIn() {},
  _zoomScale: 1
};

// $gameMessage
global.$gameMessage = {
  _texts: [],
  isBusy() { return this._texts.length > 0; },
  add(text) { this._texts.push(text); },
  clear() { this._texts = []; },
  setFaceImage() {},
  setSpeakerName() {},
  setChoices() {},
  setChoiceCallback() {},
  _sedDisabledFlags: null
};

// $dataActors, $dataItems
global.$dataActors = [];
global.$dataItems = [];

// Core RPG Maker classes
class Bitmap {
  constructor(w, h) {
    this.width = w || 1;
    this.height = h || 1;
    this.context = {
      createRadialGradient() {
        return { addColorStop() {} };
      },
      fillRect() {},
      fillStyle: ''
    };
  }
  clear() {}
  fillRect() {}
  drawText() {}
  setPixel() {}
  _baseTexture = { update() {} };
}
global.Bitmap = Bitmap;

class Sprite {
  constructor(bitmap) {
    this.bitmap = bitmap || new Bitmap(1, 1);
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.opacity = 255;
    this.visible = true;
    this.parent = null;
    this.children = [];
    this.anchor = { x: 0, y: 0 };
    this.blendMode = 0;
  }
  addChild(child) {
    this.children.push(child);
    child.parent = this;
    return child;
  }
  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx >= 0) this.children.splice(idx, 1);
    child.parent = null;
    return child;
  }
}
global.Sprite = Sprite;

class TilingSprite extends Sprite {}
global.TilingSprite = TilingSprite;

class Window_Base {
  constructor(rect) {
    this._rect = rect;
    this.contents = { fontFace: '', fontSize: 26 };
    this.backOpacity = 192;
    this.opacity = 255;
  }
  initialize() { return this; }
  lineHeight() { return 36; }
  itemPadding() { return 12; }
  contentsWidth() { return this._rect ? this._rect.width - 24 : 200; }
  contentsHeight() { return this._rect ? this._rect.height - 24 : 200; }
  refresh() {}
  drawText(text, x, y, maxWidth, align) {}
  drawSmallFace() {}
  resetTextColor() {}
  changeTextColor() {}
  changePaintOpacity() {}
  itemRect() { return { x: 0, y: 0, width: 100, height: 36 }; }
  itemLineRect() { return { x: 0, y: 0, width: 100, height: 36 }; }
}
global.Window_Base = Window_Base;

class Window_Selectable extends Window_Base {
  constructor(rect) { super(rect); this._index = -1; this._data = []; }
  index() { return this._index; }
  select(index) { this._index = index; }
  deselect() { this._index = -1; }
  maxItems() { return this._data.length; }
  activate() {}
  deactivate() {}
  show() {}
  hide() {}
  scrollTo() {}
}
global.Window_Selectable = Window_Selectable;

class Window_Command extends Window_Selectable {
  constructor(rect) { super(rect); this._list = []; }
  makeCommandList() {}
  addCommand(name, symbol, enabled) { this._list.push({ name, symbol, enabled }); }
  currentSymbol() { return this._list[this._index] ? this._list[this._index].symbol : null; }
  maxItems() { return this._list.length; }
  maxCols() { return 1; }
}
global.Window_Command = Window_Command;

class Window_Message extends Window_Base {
  constructor(rect) { super(rect); this.windowskin = null; }
  isAnySubWindowActive() { return false; }
}
global.Window_Message = Window_Message;

class Window_ChoiceList extends Window_Base {
  constructor(rect) { super(rect); this.active = false; this._messageWindow = new Window_Message(new Rectangle(0,0,100,100)); }
  isOpen() { return true; }
  processOk() {}
}
global.Window_ChoiceList = Window_ChoiceList;

class Rectangle {
  constructor(x, y, w, h) { this.x = x; this.y = y; this.width = w; this.height = h; }
}
global.Rectangle = Rectangle;

class ColorManager {
  static textColor(n) { return "#FFFFFF"; }
}
global.ColorManager = ColorManager;

// DataManager
global.DataManager = {
  loadGame() { return true; },
  makeSaveContents() { return {}; },
  extractSaveContents(contents) {}
};

// Scene classes
class Scene_Base {
  constructor() { this.children = []; }
  addChild(child) { this.children.push(child); return child; }
  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx >= 0) this.children.splice(idx, 1);
    return child;
  }
  setChildIndex(child, index) {
    const idx = this.children.indexOf(child);
    if (idx >= 0) {
      this.children.splice(idx, 1);
      this.children.splice(index, 0, child);
    }
  }
}
global.Scene_Base = Scene_Base;

global.Scene_Map = class extends Scene_Base {};
global.Scene_Battle = class extends Scene_Base {};
global.Scene_Boot = class extends Scene_Base {};
global.Scene_MenuBase = class extends Scene_Base {
  create() {}
  start() {}
  popScene() {}
  createAllWindows() {}
  addWindow(win) { this.addChild(win); }
  calcWindowHeight() { return 60; }
};

class Game_Interpreter {
  constructor() { this._waitMode = ""; }
  updateWaitMode() { return false; }
}
global.Game_Interpreter = Game_Interpreter;

class Game_Player {
  constructor() { this._transferData = null; }
  reserveTransfer(mapId, x, y, d, fadeType) { this._transferData = { mapId, x, y, d, fadeType }; }
}
global.Game_Player = Game_Player;

class Game_Event {
  constructor() { this.x = 0; this.y = 0; }
}
global.Game_Event = Game_Event;

// PIXI mocks
global.PIXI = {
  filters: {
    ColorMatrixFilter: class {
      constructor() { this._matrix = []; }
      reset() {}
      brightness() {}
      contrast() {}
      saturate() {}
      technicolor() {}
      night() {}
      _updateColorMatrix() {}
    }
  }
};
