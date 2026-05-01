export function importScene(json) {
  if (!json) throw new Error('Invalid JSON');

  if (json.schema === 'SED_SCENE_2') {
    return importGraphScene(json);
  }

  if (json.schema === 'SED_SCENE_1') {
    return importLinearScene(json);
  }

  throw new Error('Unsupported schema: ' + json.schema);
}

function importGraphScene(json) {
  const sceneData = {
    schema: json.schema,
    sceneId: json.sceneId || 'unknown',
    title: json.title || '',
    canSkip: json.canSkip !== undefined ? json.canSkip : true,
    timeoutFrames: json.timeoutFrames || 3600,
    context: json.context,
    layer: json.layer,
    priority: json.priority,
    triggers: json.triggers,
  };

  const nodes = (json.nodes || []).map(n => ({
    id: n.id,
    type: 'step',
    position: n.position || { x: 100 + Math.random() * 300, y: 100 + Math.random() * 200 },
    data: { ...n, id: undefined, position: undefined },
  }));

  const edges = (json.edges || []).map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label || '',
    type: 'smoothstep',
    ...(e.condition ? { data: { condition: e.condition } } : {}),
  }));

  return { nodes, edges, sceneData };
}

function importLinearScene(json) {
  const sceneData = {
    schema: 'SED_SCENE_1',
    sceneId: json.sceneId || 'unknown',
    title: json.title || '',
    canSkip: json.canSkip !== undefined ? json.canSkip : true,
    timeoutFrames: json.timeoutFrames || 3600,
  };

  const steps = json.steps || [];
  const nodes = [];
  const edges = [];
  const labelMap = {};

  steps.forEach((step, index) => {
    const id = `step_${index}`;
    nodes.push({
      id,
      type: 'step',
      position: { x: 80 + (index % 8) * 200, y: 80 + Math.floor(index / 8) * 160 },
      data: { ...step },
    });
    if (step.type === 'label' && step.name) {
      labelMap[step.name] = id;
    }
  });

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const srcId = `step_${i}`;
    const nextId = i + 1 < steps.length ? `step_${i + 1}` : null;

    if (step.type === 'jump' && step.label && labelMap[step.label]) {
      edges.push({ id: `e-${srcId}-jump`, source: srcId, target: labelMap[step.label], type: 'smoothstep', animated: true, style: { stroke: '#eab308' } });
      continue;
    }

    if (step.type === 'choice' && Array.isArray(step.options)) {
      step.options.forEach((opt, idx) => {
        if (opt.jump && labelMap[opt.jump]) {
          edges.push({
            id: `e-${srcId}-opt${idx}`,
            source: srcId,
            target: labelMap[opt.jump],
            sourceHandle: `option-${idx}`,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#22c55e' },
          });
        }
      });
      continue;
    }

    if (step.type === 'condition') {
      if (step.jumpTrue && labelMap[step.jumpTrue]) {
        edges.push({ id: `e-${srcId}-true`, source: srcId, target: labelMap[step.jumpTrue], sourceHandle: 'true', type: 'smoothstep', style: { stroke: '#22c55e' } });
      }
      if (step.jumpFalse && labelMap[step.jumpFalse]) {
        edges.push({ id: `e-${srcId}-false`, source: srcId, target: labelMap[step.jumpFalse], sourceHandle: 'false', type: 'smoothstep', style: { stroke: '#ef4444' } });
      }
      continue;
    }

    if (nextId) {
      edges.push({ id: `e-${srcId}-${nextId}`, source: srcId, target: nextId, type: 'smoothstep' });
    }
  }

  return { nodes, edges, sceneData };
}
