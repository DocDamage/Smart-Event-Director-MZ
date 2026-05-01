import { useCallback, useRef, useEffect } from 'react';

const MAX_HISTORY_SIZE = 50;

function clone(obj) {
  if (typeof structuredClone === 'function') {
    return structuredClone(obj);
  }
  return JSON.parse(JSON.stringify(obj));
}

export function useEditorHistory({ setNodes, setEdges, setSceneId, setTitle, setSelectedNodeId, setSelectedEdgeId }) {
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);

  const pushHistory = useCallback((nextNodes, nextEdges, nextSceneId, nextTitle) => {
    const snapshot = {
      nodes: clone(nextNodes),
      edges: clone(nextEdges),
      sceneId: nextSceneId,
      title: nextTitle,
    };
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(snapshot);
    historyIndexRef.current++;
    if (historyRef.current.length > MAX_HISTORY_SIZE) {
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
    setSelectedEdgeId(null);
  }, [setNodes, setEdges, setSceneId, setTitle, setSelectedNodeId, setSelectedEdgeId]);

  const doRedo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current++;
    const snap = historyRef.current[historyIndexRef.current];
    setNodes(clone(snap.nodes));
    setEdges(clone(snap.edges));
    setSceneId(snap.sceneId);
    setTitle(snap.title);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, [setNodes, setEdges, setSceneId, setTitle, setSelectedNodeId, setSelectedEdgeId]);

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

  return { pushHistory, doUndo, doRedo, canUndo, canRedo };
}
