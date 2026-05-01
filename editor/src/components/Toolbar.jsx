import React from 'react';
import { STEP_DEFS } from '../nodes/StepNodes';

export default function Toolbar({
  onImport,
  onExport,
  onLayout,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  sceneId,
  title,
  onSceneIdChange,
  onTitleChange,
  onAddNode,
}) {
  const allStepTypes = Object.keys(STEP_DEFS);

  return (
    <div className="sed-toolbar">
      <div className="sed-toolbar-brand">SED Visual Editor v2</div>
      <input type="file" accept=".json" onChange={onImport} className="sed-input sed-input-file" />
      <button onClick={onExport} className="sed-btn sed-btn-primary">Export JSON</button>
      <button onClick={onLayout} className="sed-btn">Auto Layout</button>
      <button onClick={onUndo} disabled={!canUndo} className="sed-btn">Undo</button>
      <button onClick={onRedo} disabled={!canRedo} className="sed-btn">Redo</button>
      <input
        value={sceneId}
        onChange={(e) => onSceneIdChange(e.target.value)}
        placeholder="sceneId"
        className="sed-input"
        style={{ width: 120 }}
      />
      <input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="title"
        className="sed-input"
        style={{ width: 160 }}
      />
      <div className="sed-toolbar-steps">
        {allStepTypes.map((t) => (
          <button key={t} onClick={() => onAddNode(t)} className="sed-btn sed-btn-sm">
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
