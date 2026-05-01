import React from 'react';

const FIELD_DEFS = {
  dialogue: [
    { key: 'text', label: 'Text', type: 'textarea' },
    { key: 'speaker', label: 'Speaker', type: 'text' },
    { key: 'faceName', label: 'Face Name', type: 'text' },
    { key: 'faceIndex', label: 'Face Index', type: 'number' },
    { key: 'textSpeed', label: 'Text Speed', type: 'number' },
    { key: 'autoAdvance', label: 'Auto Advance', type: 'number' },
    { key: 'voice', label: 'Voice', type: 'text' },
    { key: 'bust', label: 'Bust', type: 'text' },
    { key: 'emotion', label: 'Emotion', type: 'text' },
    { key: 'theme', label: 'Theme', type: 'text' },
  ],
  narration: [
    { key: 'text', label: 'Text', type: 'textarea' },
    { key: 'textSpeed', label: 'Text Speed', type: 'number' },
    { key: 'autoAdvance', label: 'Auto Advance', type: 'number' },
  ],
  choice: [
    { key: 'key', label: 'Key', type: 'text' },
    { key: 'prompt', label: 'Prompt', type: 'text' },
    { key: 'cancel', label: 'Cancel', type: 'text' },
    { key: 'timeout', label: 'Timeout', type: 'number' },
    { key: 'timeoutBehavior', label: 'Timeout Behavior', type: 'select', options: ['selectDefault', 'cancel', 'jump'] },
    { key: 'timeoutDefaultIndex', label: 'Timeout Default Index', type: 'number' },
    { key: 'timeoutJump', label: 'Timeout Jump', type: 'text' },
  ],
  jump: [{ key: 'label', label: 'Label', type: 'text' }],
  label: [{ key: 'name', label: 'Name', type: 'text' }],
  wait: [{ key: 'frames', label: 'Frames', type: 'number' }],
  camera: [
    { key: 'action', label: 'Action', type: 'select', options: ['shake', 'flash', 'tint', 'scroll', 'focus'] },
    { key: 'duration', label: 'Duration', type: 'number' },
    { key: 'wait', label: 'Wait', type: 'checkbox' },
    { key: 'power', label: 'Power', type: 'number' },
    { key: 'speed', label: 'Speed', type: 'number' },
    { key: 'easing', label: 'Easing', type: 'select', options: ['linear', 'easeIn', 'easeOut', 'easeInOut'] },
  ],
  fadeOut: [
    { key: 'duration', label: 'Duration', type: 'number' },
    { key: 'wait', label: 'Wait', type: 'checkbox' },
  ],
  fadeIn: [
    { key: 'duration', label: 'Duration', type: 'number' },
    { key: 'wait', label: 'Wait', type: 'checkbox' },
  ],
  picture: [
    { key: 'action', label: 'Action', type: 'select', options: ['show', 'move', 'erase'] },
    { key: 'id', label: 'ID', type: 'number' },
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'x', label: 'X', type: 'number' },
    { key: 'y', label: 'Y', type: 'number' },
    { key: 'scaleX', label: 'Scale X', type: 'number' },
    { key: 'scaleY', label: 'Scale Y', type: 'number' },
    { key: 'opacity', label: 'Opacity', type: 'number' },
    { key: 'duration', label: 'Duration', type: 'number' },
    { key: 'wait', label: 'Wait', type: 'checkbox' },
  ],
  audio: [
    { key: 'action', label: 'Action', type: 'select', options: ['bgm', 'bgs', 'se', 'me', 'stopBgm', 'stopBgs'] },
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'volume', label: 'Volume', type: 'number' },
    { key: 'pitch', label: 'Pitch', type: 'number' },
  ],
  switch: [
    { key: 'id', label: 'ID', type: 'number' },
    { key: 'value', label: 'Value', type: 'checkbox' },
  ],
  variable: [
    { key: 'id', label: 'ID', type: 'number' },
    { key: 'operation', label: 'Operation', type: 'select', options: ['set', 'add', 'sub', 'mul', 'div', 'mod'] },
    { key: 'value', label: 'Value', type: 'number' },
  ],
  condition: [
    { key: 'operator', label: 'Operator', type: 'select', options: ['switchIs', 'variableGte', 'choiceIs', 'questActive', 'relationshipGte'] },
    { key: 'jumpTrue', label: 'Jump True', type: 'text' },
    { key: 'jumpFalse', label: 'Jump False', type: 'text' },
    { key: 'elseJump', label: 'Else Jump', type: 'text' },
    { key: 'switchId', label: 'Switch ID', type: 'number' },
    { key: 'variableId', label: 'Variable ID', type: 'number' },
    { key: 'choiceKey', label: 'Choice Key', type: 'text' },
    { key: 'choiceIndex', label: 'Choice Index', type: 'number' },
    { key: 'questId', label: 'Quest ID', type: 'text' },
    { key: 'target', label: 'Target', type: 'text' },
  ],
  lockPlayer: [],
  unlockPlayer: [],
  moveRoute: [
    { key: 'eventId', label: 'Event ID', type: 'number' },
    { key: 'wait', label: 'Wait', type: 'checkbox' },
    { key: 'timeoutFrames', label: 'Timeout Frames', type: 'number' },
  ],
  moveOneTile: [
    { key: 'eventId', label: 'Event ID', type: 'number' },
    { key: 'direction', label: 'Direction', type: 'text' },
    { key: 'wait', label: 'Wait', type: 'checkbox' },
  ],
  moveTo: [
    { key: 'eventId', label: 'Event ID', type: 'number' },
    { key: 'x', label: 'X', type: 'number' },
    { key: 'y', label: 'Y', type: 'number' },
    { key: 'wait', label: 'Wait', type: 'checkbox' },
  ],
  startQuest: [{ key: 'questId', label: 'Quest ID', type: 'text' }],
  relationship: [
    { key: 'target', label: 'Target', type: 'text' },
    { key: 'operation', label: 'Operation', type: 'select', options: ['add', 'set'] },
    { key: 'value', label: 'Value', type: 'number' },
  ],
  titleCard: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'subtitle', label: 'Subtitle', type: 'text' },
    { key: 'duration', label: 'Duration', type: 'number' },
    { key: 'fadeIn', label: 'Fade In', type: 'number' },
    { key: 'fadeOut', label: 'Fade Out', type: 'number' },
    { key: 'wait', label: 'Wait', type: 'checkbox' },
  ],
  transition: [
    { key: 'effect', label: 'Effect', type: 'select', options: ['fadeWhite', 'fadeBlack', 'none'] },
    { key: 'duration', label: 'Duration', type: 'number' },
    { key: 'wait', label: 'Wait', type: 'checkbox' },
  ],
  weather: [
    { key: 'action', label: 'Action', type: 'select', options: ['set', 'clear'] },
    { key: 'weatherType', label: 'Weather Type', type: 'select', options: ['rain', 'storm', 'snow'] },
    { key: 'power', label: 'Power', type: 'number' },
    { key: 'duration', label: 'Duration', type: 'number' },
    { key: 'wait', label: 'Wait', type: 'checkbox' },
  ],
  commonEvent: [{ key: 'id', label: 'ID', type: 'number' }],
  selfSwitch: [
    { key: 'eventId', label: 'Event ID', type: 'number' },
    { key: 'letter', label: 'Letter', type: 'text' },
    { key: 'value', label: 'Value', type: 'checkbox' },
  ],
  bust: [
    { key: 'character', label: 'Character', type: 'text' },
    { key: 'emotion', label: 'Emotion', type: 'text' },
    { key: 'position', label: 'Position', type: 'select', options: ['left', 'right', 'center'] },
    { key: 'action', label: 'Action', type: 'select', options: ['show', 'hide', 'move'] },
    { key: 'enter', label: 'Enter', type: 'text' },
    { key: 'exit', label: 'Exit', type: 'text' },
  ],
  qte: [
    { key: 'variant', label: 'Variant', type: 'select', options: ['press', 'mash', 'sequence'] },
    { key: 'prompt', label: 'Prompt', type: 'text' },
    { key: 'key', label: 'Key', type: 'text' },
    { key: 'window', label: 'Window', type: 'number' },
    { key: 'target', label: 'Target', type: 'number' },
    { key: 'timeLimit', label: 'Time Limit', type: 'number' },
    { key: 'successJump', label: 'Success Jump', type: 'text' },
    { key: 'failJump', label: 'Fail Jump', type: 'text' },
    { key: 'storeResult', label: 'Store Result', type: 'checkbox' },
  ],
  timeline: [
    { key: 'target', label: 'Target', type: 'select', options: ['camera'] },
  ],
  unlockAchievement: [
    { key: 'achievementId', label: 'Achievement ID', type: 'text' },
  ],
  callScene: [
    { key: 'sceneId', label: 'Scene ID', type: 'text' },
    { key: 'returnLabel', label: 'Return Label', type: 'text' },
  ],
  return: [],
  checkpoint: [{ key: 'id', label: 'ID', type: 'text' }],
  preload: [],
  script: [
    { key: 'code', label: 'Code', type: 'textarea' },
    { key: 'wait', label: 'Wait', type: 'checkbox' },
  ],
  comment: [{ key: 'text', label: 'Text', type: 'textarea' }],
  loop: [{ key: 'label', label: 'Label', type: 'text' }, { key: 'maxIterations', label: 'Max Iterations', type: 'number' }],
  endLoop: [{ key: 'label', label: 'Label', type: 'text' }],
};

function renderField(field, value, onChange) {
  const id = field.key;
  if (field.type === 'textarea') {
    return (
      <div className="field" key={id}>
        <label>{field.label}</label>
        <textarea rows={3} value={value ?? ''} onChange={(e) => onChange(id, e.target.value)} />
      </div>
    );
  }
  if (field.type === 'checkbox') {
    return (
      <div className="field" key={id}>
        <label>
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(id, e.target.checked)} />
          {field.label}
        </label>
      </div>
    );
  }
  if (field.type === 'select') {
    return (
      <div className="field" key={id}>
        <label>{field.label}</label>
        <select value={value ?? ''} onChange={(e) => onChange(id, e.target.value)}>
          <option value="">--</option>
          {field.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
    );
  }
  if (field.type === 'number') {
    return (
      <div className="field" key={id}>
        <label>{field.label}</label>
        <input type="number" value={value ?? 0} onChange={(e) => onChange(id, Number(e.target.value))} />
      </div>
    );
  }
  return (
    <div className="field" key={id}>
      <label>{field.label}</label>
      <input type="text" value={value ?? ''} onChange={(e) => onChange(id, e.target.value)} />
    </div>
  );
}

export default function PropertyPanel({ selectedNode, selectedEdge, sceneData, onUpdateNode, onUpdateEdge, onUpdateScene }) {
  if (selectedEdge) {
    return (
      <div className="panel">
        <h4>Edge</h4>
        <div className="field">
          <label>ID</label>
          <input type="text" value={selectedEdge.id || ''} readOnly />
        </div>
        <div className="field">
          <label>Source</label>
          <input type="text" value={selectedEdge.source || ''} readOnly />
        </div>
        <div className="field">
          <label>Target</label>
          <input type="text" value={selectedEdge.target || ''} readOnly />
        </div>
        <div className="field">
          <label>Label</label>
          <input type="text" value={selectedEdge.label || ''} onChange={(e) => onUpdateEdge(selectedEdge.id, { label: e.target.value })} />
        </div>
        <div className="field">
          <label>Condition Operator</label>
          <select value={selectedEdge.data?.condition?.operator || ''} onChange={(e) => {
            const cond = { ...(selectedEdge.data?.condition || {}), operator: e.target.value };
            onUpdateEdge(selectedEdge.id, { data: { condition: cond } });
          }}>
            <option value="">--</option>
            <option value="switchIs">switchIs</option>
            <option value="variableGte">variableGte</option>
            <option value="questActive">questActive</option>
            <option value="relationshipGte">relationshipGte</option>
          </select>
        </div>
        <div className="field">
          <label>Condition Switch ID</label>
          <input type="number" value={selectedEdge.data?.condition?.switchId || ''} onChange={(e) => {
            const cond = { ...(selectedEdge.data?.condition || {}), switchId: Number(e.target.value) };
            onUpdateEdge(selectedEdge.id, { data: { condition: cond } });
          }} />
        </div>
        <div className="field">
          <label>Condition Switch Value</label>
          <select value={selectedEdge.data?.condition?.switchValue === true ? 'true' : selectedEdge.data?.condition?.switchValue === false ? 'false' : ''} onChange={(e) => {
            const val = e.target.value === 'true' ? true : e.target.value === 'false' ? false : undefined;
            const cond = { ...(selectedEdge.data?.condition || {}), switchValue: val };
            onUpdateEdge(selectedEdge.id, { data: { condition: cond } });
          }}>
            <option value="">--</option>
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        </div>
      </div>
    );
  }

  if (!selectedNode) {
    return (
      <div className="panel">
        <h4>Scene Properties</h4>
        <div className="field">
          <label>Scene ID</label>
          <input type="text" value={sceneData.sceneId} onChange={(e) => onUpdateScene({ sceneId: e.target.value })} />
        </div>
        <div className="field">
          <label>Title</label>
          <input type="text" value={sceneData.title} onChange={(e) => onUpdateScene({ title: e.target.value })} />
        </div>
        <div className="field">
          <label>
            <input type="checkbox" checked={sceneData.canSkip} onChange={(e) => onUpdateScene({ canSkip: e.target.checked })} />
            Can Skip
          </label>
        </div>
        <div className="field">
          <label>Timeout Frames</label>
          <input type="number" value={sceneData.timeoutFrames} onChange={(e) => onUpdateScene({ timeoutFrames: Number(e.target.value) })} />
        </div>
        <div className="field">
          <label>Context</label>
          <select value={sceneData.context || ''} onChange={(e) => onUpdateScene({ context: e.target.value || undefined })}>
            <option value="">--</option>
            <option value="map">map</option>
            <option value="battle">battle</option>
            <option value="both">both</option>
          </select>
        </div>
      </div>
    );
  }

  const type = selectedNode.data.type;
  const fields = FIELD_DEFS[type] || [];

  const handleChange = (key, val) => {
    onUpdateNode(selectedNode.id, { [key]: val });
  };

  return (
    <div className="panel">
      <h4>
        {type} <span className="node-id">{selectedNode.id}</span>
      </h4>
      {fields.map((f) => renderField(f, selectedNode.data[f.key], handleChange))}

      {type === 'choice' && (
        <div className="field">
          <label>Options</label>
          <div className="options-list">
            {(selectedNode.data.options || []).map((opt, idx) => (
              <div key={idx} className="option-row">
                <input
                  type="text"
                  placeholder="Text"
                  value={opt.text}
                  onChange={(e) => {
                    const next = [...selectedNode.data.options];
                    next[idx] = { ...next[idx], text: e.target.value };
                    handleChange('options', next);
                  }}
                />
                <input
                  type="text"
                  placeholder="Jump"
                  value={opt.jump}
                  onChange={(e) => {
                    const next = [...selectedNode.data.options];
                    next[idx] = { ...next[idx], jump: e.target.value };
                    handleChange('options', next);
                  }}
                />
                <button
                  onClick={() => {
                    const next = selectedNode.data.options.filter((_, i) => i !== idx);
                    handleChange('options', next);
                  }}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                const next = [...(selectedNode.data.options || []), { text: '', jump: '' }];
                handleChange('options', next);
              }}
            >
              + Add Option
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
