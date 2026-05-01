import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const CATEGORY_COLORS = {
  dialogue: '#3b82f6',
  narration: '#3b82f6',
  choice: '#22c55e',
  flow: '#eab308',
  visual: '#a855f7',
  audio: '#f97316',
  logic: '#ef4444',
  movement: '#14b8a6',
  quest: '#eab308',
  system: '#6b7280',
  bust: '#ec4899',
  qte: '#f59e0b',
  timeline: '#a855f7',
  achievement: '#10b981',
};

const STEP_CATEGORIES = {
  dialogue: 'dialogue',
  narration: 'narration',
  choice: 'choice',
  jump: 'flow',
  label: 'flow',
  condition: 'flow',
  wait: 'system',
  camera: 'visual',
  fadeOut: 'visual',
  fadeIn: 'visual',
  picture: 'visual',
  transition: 'visual',
  titleCard: 'visual',
  weather: 'visual',
  bust: 'bust',
  qte: 'qte',
  timeline: 'timeline',
  unlockAchievement: 'achievement',
  audio: 'audio',
  switch: 'logic',
  variable: 'logic',
  selfSwitch: 'logic',
  lockPlayer: 'system',
  unlockPlayer: 'system',
  moveRoute: 'movement',
  moveOneTile: 'movement',
  moveTo: 'movement',
  startQuest: 'quest',
  relationship: 'quest',
  commonEvent: 'system',
  callScene: 'flow',
  return: 'flow',
  checkpoint: 'system',
  preload: 'system',
  script: 'logic',
  comment: 'system',
};

function getPreview(data) {
  if (data.text) return data.text.slice(0, 28);
  if (data.speaker) return data.speaker;
  if (data.name) return data.name;
  if (data.label) return `→ ${data.label}`;
  if (data.prompt) return data.prompt.slice(0, 28);
  if (data.questId) return data.questId;
  if (data.target) return data.target;
  if (data.achievementId) return data.achievementId;
  return '';
}

const StepNode = memo(({ data, selected }) => {
  const type = data.type;
  const category = STEP_CATEGORIES[type] || 'system';
  const color = CATEGORY_COLORS[category] || '#6b7280';
  const preview = getPreview(data);
  const hasError = data._validationErrors && data._validationErrors.length > 0;
  const isPlaying = data._playtestActive;

  const borderColor = hasError ? '#ef4444' : isPlaying ? '#22c55e' : color;
  const borderWidth = hasError || isPlaying ? 3 : 2;

  return (
    <div
      className={`sed-node-card${selected ? ' selected' : ''}`}
      style={{
        border: `${borderWidth}px solid ${borderColor}`,
        boxShadow: selected ? `0 0 0 3px ${color}44` : undefined,
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: color }} className="sed-handle" />
      <div className="sed-node-header" style={{ background: color }}>
        {type}
      </div>
      <div className="sed-node-preview">
        {preview}
      </div>

      {hasError && (
        <div className="sed-node-error">
          {data._validationErrors[0]}
        </div>
      )}

      {type === 'choice' && Array.isArray(data.options) && (
        <div className="sed-node-options">
          {data.options.map((opt, i) => (
            <div key={i} className="sed-node-option">
              • {opt.text || `Option ${i + 1}`}
              <Handle
                type="source"
                position={Position.Right}
                id={`option-${i}`}
                style={{ top: 10, background: '#22c55e' }}
                className="sed-handle"
              />
            </div>
          ))}
        </div>
      )}

      {type === 'condition' && (
        <div style={{ position: 'relative', height: 36 }}>
          <Handle type="source" position={Position.Right} id="true" style={{ top: 10, background: '#22c55e' }} className="sed-handle" />
          <div className="sed-node-option">True</div>
          <Handle type="source" position={Position.Right} id="false" style={{ top: 30, background: '#ef4444' }} className="sed-handle" />
          <div className="sed-node-option">False</div>
        </div>
      )}

      {type !== 'choice' && type !== 'condition' && (
        <Handle type="source" position={Position.Right} style={{ background: color }} className="sed-handle" />
      )}
    </div>
  );
});

export const nodeTypes = { step: StepNode };
