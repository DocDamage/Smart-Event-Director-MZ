import { importScene } from '../import/jsonImporter';
import { exportScene } from '../export/jsonExporter';

const DEFAULT_TIMEOUT_FRAMES = 3600;

export function handleImport({ pushHistory, setNodes, setEdges, setSceneId, setTitle, setSelectedNodeId, setSelectedEdgeId, setPlaytestActive, setPlaytestIndex }) {
  return (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target.result);
        const result = importScene(json);
        setNodes(result.nodes);
        setEdges(result.edges);
        setSceneId(result.sceneData.sceneId || 'untitled');
        setTitle(result.sceneData.title || 'Untitled');
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
        setPlaytestActive(false);
        setPlaytestIndex(-1);
        pushHistory(result.nodes, result.edges, result.sceneData.sceneId || 'untitled', result.sceneData.title || 'Untitled');
      } catch (err) {
        alert('Import failed: ' + err.message);
      }
    };
    reader.readAsText(file);
  };
}

export function handleExport({ nodes, edges, sceneId, title }) {
  return () => {
    try {
      const { json, issues } = exportScene(nodes, edges, { sceneId, title, canSkip: true, timeoutFrames: DEFAULT_TIMEOUT_FRAMES });
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
    } catch (err) {
      alert('Export failed: ' + err.message);
    }
  };
}
