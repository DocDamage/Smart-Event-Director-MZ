import React, { useState, useCallback, useRef, useEffect } from 'react';
import NodeCanvas from './components/NodeCanvas';
import PropertyPanel from './components/PropertyPanel';
import Toolbar from './components/Toolbar';
import PlaytestPanel from './components/PlaytestPanel';
import { useEditorHistory } from './hooks/useEditorHistory';
import { autoLayout } from './utils/layout';
import { handleImport, handleExport } from './utils/fileIO';
import { STEP_DEFS } from './nodes/StepNodes';
import './App.css';

const DEFAULT_WAIT_FRAMES = 60;

function clone(obj) {
  if (typeof structuredClone === 'function') {
    return structuredClone(obj);
  }
  return JSON.parse(JSON.stringify(obj));
}

export default function App() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [sceneId, setSceneId] = useState('untitled');
  const [title, setTitle] = useState('Untitled');
  const [playtestIndex, setPlaytestIndex] = useState(-1);
  const [playtestActive, setPlaytestActive] = useState(false);

  const { pushHistory, doUndo, doRedo, canUndo, canRedo } = useEditorHistory({
    setNodes,
    setEdges,
    setSceneId,
    setTitle,
    setSelectedNodeId,
    setSelectedEdgeId,
  });

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;
  const selectedEdge = edges.find(e => e.id === selectedEdgeId) || null;

  const nodesWithMeta = nodes.map(n => ({
    ...n,
    data: {
      ...n.data,
      _validationErrors: [],
      _playtestActive: playtestActive && playtestIndex >= 0 && nodes[playtestIndex]?.id === n.id,
    },
  }));

  const onImport = handleImport({
    pushHistory,
    setNodes,
    setEdges,
    setSceneId,
    setTitle,
    setSelectedNodeId,
    setSelectedEdgeId,
    setPlaytestActive,
    setPlaytestIndex,
  });

  const onExport = handleExport({ nodes, edges, sceneId, title });

  const addNode = useCallback((type) => {
    const id = `node-${Date.now()}`;
    const def = STEP_DEFS[type] || { fields: [] };
    const data = { type };
    def.fields.forEach(f => { data[f] = ''; });
    if (type === 'choice') data.options = [{ text: '', jump: '' }];
    if (type === 'wait') data.frames = DEFAULT_WAIT_FRAMES;
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

  const updateEdgeData = useCallback((edgeId, patch) => {
    const nextEdges = edges.map(e => e.id === edgeId ? { ...e, ...patch } : e);
    setEdges(nextEdges);
    pushHistory(nodes, nextEdges, sceneId, title);
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
    setSelectedEdgeId(null);
  }, []);

  const onEdgeClick = useCallback((_, edge) => {
    setSelectedEdgeId(edge.id);
    setSelectedNodeId(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, []);

  return (
    <div className="sed-app">
      <Toolbar
        onImport={onImport}
        onExport={onExport}
        onLayout={handleLayout}
        onUndo={doUndo}
        onRedo={doRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        sceneId={sceneId}
        title={title}
        onSceneIdChange={setSceneId}
        onTitleChange={setTitle}
        onAddNode={addNode}
      />
      <div className="sed-workspace">
        <div className="sed-canvas-wrap">
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
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
          />
        </div>
        <div className="sed-right-panel">
          <PropertyPanel
            selectedNode={selectedNode}
            selectedEdge={selectedEdge}
            sceneData={{ sceneId, title, canSkip: true, timeoutFrames: 3600 }}
            onUpdateNode={updateNodeData}
            onUpdateEdge={updateEdgeData}
            onUpdateScene={(patch) => {
              if (patch.sceneId !== undefined) setSceneId(patch.sceneId);
              if (patch.title !== undefined) setTitle(patch.title);
            }}
          />
          <PlaytestPanel
            playtestActive={playtestActive}
            playtestIndex={playtestIndex}
            nodes={nodes}
            onPlaytestStep={handlePlaytestStep}
            onStopPlaytest={handleStopPlaytest}
          />
        </div>
      </div>
    </div>
  );
}
