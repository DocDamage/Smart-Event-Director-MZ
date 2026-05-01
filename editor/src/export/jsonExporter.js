export function exportScene(nodes, edges, sceneData) {
  const nodeMap = new Map();
  nodes.forEach(n => nodeMap.set(n.id, n));

  const outEdges = new Map();
  edges.forEach(e => {
    if (!outEdges.has(e.source)) outEdges.set(e.source, []);
    outEdges.get(e.source).push(e);
  });

  const sceneNodes = nodes.map(n => {
    const data = { ...n.data };
    delete data._validationErrors;
    delete data._playtestActive;
    return { id: n.id, ...data };
  });

  const sceneEdges = edges.map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    ...(e.label ? { label: e.label } : {}),
    ...(e.data?.condition ? { condition: e.data.condition } : {}),
  }));

  const result = {
    schema: 'SED_SCENE_2',
    sceneId: sceneData.sceneId || 'new_scene',
    title: sceneData.title || '',
    nodes: sceneNodes,
    edges: sceneEdges,
  };

  if (sceneData.canSkip !== undefined) result.canSkip = sceneData.canSkip;
  if (sceneData.timeoutFrames !== undefined) result.timeoutFrames = sceneData.timeoutFrames;
  if (sceneData.context) result.context = sceneData.context;
  if (sceneData.layer) result.layer = sceneData.layer;
  if (sceneData.priority !== undefined) result.priority = sceneData.priority;
  if (sceneData.triggers) result.triggers = sceneData.triggers;

  return { json: result, issues: validateScene(nodes, edges) };
}

export function validateScene(nodes, edges) {
  const errors = [];
  const nodeIds = new Set(nodes.map(n => n.id));
  const hasIncoming = new Set();

  edges.forEach(e => {
    if (!nodeIds.has(e.source)) errors.push(`Edge ${e.id} source not found: ${e.source}`);
    if (!nodeIds.has(e.target)) errors.push(`Edge ${e.id} target not found: ${e.target}`);
    hasIncoming.add(e.target);
  });

  const startNodes = nodes.filter(n => !hasIncoming.has(n.id));
  if (startNodes.length === 0 && nodes.length > 0) {
    errors.push('No start node found (all nodes have incoming edges).');
  }
  if (startNodes.length > 1) {
    errors.push('Multiple start nodes: ' + startNodes.map(n => n.id).join(', '));
  }

  nodes.forEach(n => {
    if (!n.data.type) errors.push(`Node ${n.id} missing type.`);
  });

  return errors;
}
