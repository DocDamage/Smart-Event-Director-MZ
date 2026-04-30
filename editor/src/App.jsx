import React, { useState, useCallback } from 'react';
import NodeCanvas from './components/NodeCanvas';
import PropertyPanel from './components/PropertyPanel';
import { importScene } from './import/jsonImporter';
import { exportScene } from './export/jsonExporter';
import { STEP_DEFS } from './nodes/StepNodes';

export default function App() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [sceneId, setSceneId] = useState('untitled');
  const [title, setTitle] = useState('Untitled');

  const handleImport = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const result = importScene(ev.target.result);
        setNodes(result.nodes);
        setEdges(result.edges);
        setSceneId(result.sceneId || 'untitled');
        setTitle(result.title || 'Untitled');
        setSelectedNode(null);
      } catch (err) {
        alert('Invalid JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  }, []);

  const handleExport = useCallback(() => {
    const { json, issues } = exportScene(nodes, edges, sceneId, title);
    if (issues.length > 0) {
      alert('Validation issues:\n' + issues.join('\n'));
    }
    const blob = new Blob([json], { type: 'application/json' });
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
      type: 'sedStep',
      position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
      data
    };
    setNodes(prev => [...prev, newNode]);
  }, []);

  const updateNodeData = useCallback((newData) => {
    if (!selectedNode) return;
    setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, data: newData } : n));
    setSelectedNode(prev => prev ? { ...prev, data: newData } : null);
  }, [selectedNode]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', background: '#1e1e1e' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', background: '#252526', borderBottom: '1px solid #333' }}>
        <div style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>SED Visual Editor</div>
        <input type="file" accept=".json" onChange={handleImport} style={{ color: '#fff', fontSize: 12 }} />
        <button onClick={handleExport} style={{ padding: '6px 12px', background: '#0e639c', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Export JSON</button>
        <input value={sceneId} onChange={e => setSceneId(e.target.value)} placeholder="sceneId" style={{ background: '#3c3c3c', border: '1px solid #555', color: '#fff', padding: 4, borderRadius: 4, fontSize: 12, width: 120 }} />
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="title" style={{ background: '#3c3c3c', border: '1px solid #555', color: '#fff', padding: 4, borderRadius: 4, fontSize: 12, width: 160 }} />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {Object.keys(STEP_DEFS).slice(0, 8).map(t => (
            <button key={t} onClick={() => addNode(t)} style={{ padding: '4px 8px', background: '#3c3c3c', color: '#fff', border: '1px solid #555', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>{t}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <NodeCanvas nodes={nodes} edges={edges} onSelectNode={setSelectedNode} />
        <PropertyPanel node={selectedNode} onChange={updateNodeData} />
      </div>
    </div>
  );
}
