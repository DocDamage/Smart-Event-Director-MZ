import React, { useState, useCallback, useRef, useEffect } from 'react';
import NodeCanvas from './components/NodeCanvas';
import PropertyPanel from './components/PropertyPanel';
import { importScene } from './import/jsonImporter';
import { exportScene, validateScene } from './export/jsonExporter';
import { STEP_DEFS } from './nodes/StepNodes';
import './App.css';

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function buildAdjacency(nodes, edges) {
  const adj = new Map();
  nodes.forEach(n => adj.set(n.id, []));
  edges.forEach(e => {
    if (adj.has(e.source)) adj.get(e.source).push(e.target);
  });
  return adj;
}

function autoLayout(nodes, edges) {
  const adj = buildAdjacency(nodes, edges);
  const inDegree = new Map();
  nodes.forEach(n => inDegree.set(n.id, 0));
  edges.forEach(e => {
    inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
  });

  const queue = [];
  const layer = new Map();
  nodes.forEach(n => {
    if (inDegree.get(n.id) === 0) {
      queue.push(n.id);
      layer.set(n.id, 0);
    }
  });

  while (queue.length > 0) {
    const id = queue.shift();
    const children = adj.get(id) || [];
    children.forEach(childId => {
      const newLayer = Math.max(layer.get(childId) || 0, layer.get(id) + 1);
      layer.set(childId, newLayer);
      inDegree.set(childId, inDegree.get(childId) - 1);
      if (inDegree.get(childId) === 0) queue.push(childId);
    });
  }

  const layers = new Map();
  layer.forEach((l, id) => {
    if (!layers.has(l)) layers.set(l, []);
    layers.get(l).push(id);
  });

  const positioned = new Map();
  layers.forEach((ids, l) => {
    ids.forEach((id, i) => {
      positioned.set(id, { x: 80 + l * 240, y: 80 + i * 160 });
    });
  });

  return nodes.map(n => ({
    ...n,
    position: positioned.get(n.id) || n.position,
  }));
}

export default function App() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [sceneId, setSceneId] = useState('untitled');
  const [title, setTitle] = useState('Untitled');
  const [playtestIndex, setPlaytestIndex] = useState(-1);
  const [playtestActive, setPlaytestActive] = useState(false);

  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);

  const pushHistory = useCallback((nextNodes, nextEdges, nextSceneId, nextTitle) => {
    const snapshot = {
      nodes: clone(nextNodes),
      edges: clone(nextEdges),
      sceneId: nextSceneId,
      title: nextTitle,
    };
    // Truncate redo history
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(snapshot);
    historyIndexRef.current++;
    // Cap history size
    if (historyRef.current.length > 50) {
      historyRef.current.shift();
      historyIndexRef.current--;
    }
  }, []);

  const canUndo = historyIndexRef.current > 0;
  const canRedo = historyIndexRef.current < historyRef.current.length - 1;

  const doUndo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current--;
    const snap = historyRef.current[historyIndexRef.current];
    setNodes(clone(snap.nodes));
    setEdges(clone(snap.edges));
    setSceneId(snap.sceneId);
    setTitle(snap.title);
    setSelectedNodeId(null);
  }, []);

  const doRedo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current++;
    const snap = historyRef.current[historyIndexRef.current];
    setNodes(clone(snap.nodes));
    setEdges(clone(snap.edges));
    setSceneId(snap.sceneId);
    setTitle(snap.title);
    setSelectedNodeId(null);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) doRedo();
        else doUndo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        doRedo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [doUndo, doRedo]);

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;

  const validationErrors = validateScene(nodes, edges);
  const errorByNode = new Map();
  validationErrors.forEach(err => {
    const m = err.match(/node (\S+)/);
    if (m) {
      const id = m[1];
      if (!errorByNode.has(id)) errorByNode.set(id, []);
      errorByNode.get(id).push(err);
    }
  });

  const nodesWithMeta = nodes.map(n => ({
    ...n,
    data: {
      ...n.data,
      _validationErrors: errorByNode.get(n.id) || [],
      _playtestActive: playtestActive && playtestIndex >= 0 && nodes[playtestIndex]?.id === n.id,
    },
  }));

  const handleImport = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target.result);
        const result = importScene(json);
        setNodes(result.nodes);
        setEdges(result.edges);
        setSceneId(result.sceneId || 'untitled');
        setTitle(result.title || 'Untitled');
        setSelectedNodeId(null);
        setPlaytestActive(false);
        setPlaytestIndex(-1);
        pushHistory(result.nodes, result.edges, result.sceneId || 'untitled', result.title || 'Untitled');
      } catch (err) {
        alert('Invalid JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  }, [pushHistory]);

  const handleExport = useCallback(() => {
    const { json, issues } = exportScene(nodes, edges, { sceneId, title, canSkip: true, timeoutFrames: 3600 });
    if (issues.length > 0) {
      alert('Validation issues:\n' + issues.join('\n'));
    }
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sceneId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges, sceneId, title]);

  const addNode = useCallback((type) => {
    const id = `node-${Date.now()}`;
    const def = STEP_DEFS[type] || { fields: [] };
    const data = { type };
    def.fields.forEach(f => { data[f] = ''; });
    if (type === 'choice') data.options = [{ text: '', jump: '' }];
    if (type === 'wait') data.frames = 60;
    const newNode = {
      id,
      type: 'step',
      position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
      data,
    };
    const nextNodes = [...nodes, newNode];
    setNodes(nextNodes);
    pushHistory(nextNodes, edges, sceneId, title);
  }, [nodes, edges, sceneId, title, pushHistory]);

  const updateNodeData = useCallback((nodeId, patch) => {
    const nextNodes = nodes.map(n => n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n);
    setNodes(nextNodes);
    pushHistory(nextNodes, edges, sceneId, title);
  }, [nodes, edges, sceneId, title, pushHistory]);

  const handleLayout = useCallback(() => {
    const nextNodes = autoLayout(nodes, edges);
    setNodes(nextNodes);
    pushHistory(nextNodes, edges, sceneId, title);
  }, [nodes, edges, sceneId, title, pushHistory]);

  const handlePlaytestStep = useCallback(() => {
    if (!playtestActive) {
      setPlaytestActive(true);
      setPlaytestIndex(0);
      return;
    }
    if (playtestIndex < nodes.length - 1) {
      setPlaytestIndex(i => i + 1);
    } else {
      setPlaytestActive(false);
      setPlaytestIndex(-1);
    }
  }, [playtestActive, playtestIndex, nodes.length]);

  const handleStopPlaytest = useCallback(() => {
    setPlaytestActive(false);
    setPlaytestIndex(-1);
  }, []);

  const onNodeClick = useCallback((_, node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const allStepTypes = Object.keys(STEP_DEFS);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', background: '#1e1e1e' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', background: '#252526', borderBottom: '1px solid #333', flexWrap: 'wrap' }}>
        <div style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>SED Visual Editor</div>
        <input type="file" accept=".json" onChange={handleImport} style={{ color: '#fff', fontSize: 12 }} />
        <button onClick={handleExport} style={{ padding: '6px 12px', background: '#0e639c', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Export JSON</button>
        <button onClick={handleLayout} style={{ padding: '6px 12px', background: '#3c3c3c', color: '#fff', border: '1px solid #555', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Auto Layout</button>
        <button onClick={doUndo} disabled={!canUndo} style={{ padding: '6px 12px', background: '#3c3c3c', color: '#fff', border: '1px solid #555', borderRadius: 4, cursor: canUndo ? 'pointer' : 'not-allowed', fontSize: 12, opacity: canUndo ? 1 : 0.5 }}>Undo</button>
        <button onClick={doRedo} disabled={!canRedo} style={{ padding: '6px 12px', background: '#3c3c3c', color: '#fff', border: '1px solid #555', borderRadius: 4, cursor: canRedo ? 'pointer' : 'not-allowed', fontSize: 12, opacity: canRedo ? 1 : 0.5 }}>Redo</button>
        <input value={sceneId} onChange={e => setSceneId(e.target.value)} placeholder="sceneId" style={{ background: '#3c3c3c', border: '1px solid #555', color: '#fff', padding: 4, borderRadius: 4, fontSize: 12, width: 120 }} />
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="title" style={{ background: '#3c3c3c', border: '1px solid #555', color: '#fff', padding: 4, borderRadius: 4, fontSize: 12, width: 160 }} />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {allStepTypes.map(t => (
            <button key={t} onClick={() => addNode(t)} style={{ padding: '4px 8px', background: '#3c3c3c', color: '#fff', border: '1px solid #555', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>{t}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1 }}>
          <NodeCanvas
            nodes={nodesWithMeta}
            edges={edges}
            setNodes={(updater) => {
              const next = typeof updater === 'function' ? updater(nodes) : updater;
              setNodes(next);
              pushHistory(next, edges, sceneId, title);
            }}
            setEdges={(updater) => {
              const next = typeof updater === 'function' ? updater(edges) : updater;
              setEdges(next);
              pushHistory(nodes, next, sceneId, title);
            }}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
          />
        </div>
        <div style={{ width: 320, display: 'flex', flexDirection: 'column', borderLeft: '1px solid #333', background: '#252526' }}>
          <PropertyPanel
            selectedNode={selectedNode}
            sceneData={{ sceneId, title, canSkip: true, timeoutFrames: 3600 }}
            onUpdateNode={updateNodeData}
            onUpdateScene={(patch) => {
              if (patch.sceneId !== undefined) setSceneId(patch.sceneId);
              if (patch.title !== undefined) setTitle(patch.title);
            }}
          />
          <div style={{ borderTop: '1px solid #333', padding: 12 }}>
            <div style={{ color: '#fff', fontWeight: 'bold', fontSize: 13, marginBottom: 8 }}>Playtest</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <button onClick={handlePlaytestStep} style={{ padding: '6px 12px', background: playtestActive ? '#22c55e' : '#0e639c', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
                {playtestActive ? (playtestIndex < nodes.length - 1 ? 'Next Step' : 'Finish') : 'Start'}
              </button>
              {playtestActive && (
                <button onClick={handleStopPlaytest} style={{ padding: '6px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Stop</button>
              )}
            </div>
            {playtestActive && playtestIndex >= 0 && nodes[playtestIndex] && (
              <div style={{ background: '#1e1e1e', borderRadius: 4, padding: 8, fontSize: 12, color: '#ccc' }}>
                <div style={{ color: '#fff', fontWeight: 'bold', marginBottom: 4 }}>
                  Step {playtestIndex + 1} / {nodes.length}
                </div>
                <div style={{ color: '#a855f7', marginBottom: 4 }}>{nodes[playtestIndex].data.type}</div>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: 11 }}>
                  {JSON.stringify(nodes[playtestIndex].data, null, 2)}
                </pre>
              </div>
            )}
          </div>
          {validationErrors.length > 0 && (
            <div style={{ borderTop: '1px solid #333', padding: 12, maxHeight: 200, overflow: 'auto' }}>
              <div style={{ color: '#ef4444', fontWeight: 'bold', fontSize: 13, marginBottom: 8 }}>Validation ({validationErrors.length})</div>
              {validationErrors.map((err, i) => (
                <div key={i} style={{ fontSize: 11, color: '#ef4444', marginBottom: 4 }}>{err}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
