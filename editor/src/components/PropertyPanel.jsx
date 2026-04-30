import React from 'react';

const FIELD_DEFS = {
  dialogue: [
    { key: 'text', label: 'Text', type: 'textarea' },
    { key: 'speaker', label: 'Speaker', type: 'text' },
    { key: 'faceName', label: 'Face Name', type: 'text' },
    { key: 'faceIndex', label: 'Face Index', type: 'number' },
    { key: 'textSpeed', label: 'Text Speed', type: 'number' },
  ],
  choice: [
    { key: 'key', label: 'Key', type: 'text' },
    { key: 'prompt', label: 'Prompt', type: 'text' },
    { key: 'cancel', label: 'Cancel', type: 'text' },
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
    { key: 'origin', label: 'Origin', type: 'number' },
    { key: 'x', label: 'X', type: 'number' },
    { key: 'y', label: 'Y', type: 'number' },
    { key: 'scaleX', label: 'Scale X', type: 'number' },
    { key: 'scaleY', label: 'Scale Y', type: 'number' },
    { key: 'opacity', label: 'Opacity', type: 'number' },
    { key: 'blendMode', label: 'Blend Mode', type: 'number' },
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

export default function PropertyPanel({ selectedNode, sceneData, onUpdateNode, onUpdateScene }) {
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
