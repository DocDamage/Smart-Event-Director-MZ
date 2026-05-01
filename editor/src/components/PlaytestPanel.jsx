import React from 'react';

export default function PlaytestPanel({
  playtestActive,
  playtestIndex,
  nodes,
  onPlaytestStep,
  onStopPlaytest,
}) {
  return (
    <div className="sed-playtest-panel">
      <div className="sed-playtest-title">Playtest</div>
      <div className="sed-playtest-controls">
        <button onClick={onPlaytestStep} className="sed-btn sed-btn-primary">
          {playtestActive ? (playtestIndex < nodes.length - 1 ? 'Next Step' : 'Finish') : 'Start'}
        </button>
        {playtestActive && (
          <button onClick={onStopPlaytest} className="sed-btn sed-btn-danger">Stop</button>
        )}
      </div>
      {playtestActive && playtestIndex >= 0 && nodes[playtestIndex] && (
        <div className="sed-playtest-step">
          <div className="sed-playtest-step-header">
            Step {playtestIndex + 1} / {nodes.length}
          </div>
          <div className="sed-playtest-step-type">{nodes[playtestIndex].data.type}</div>
          <pre className="sed-playtest-step-data">
            {JSON.stringify(nodes[playtestIndex].data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
