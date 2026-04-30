export function importScene(json) {
  if (!json || json.schema !== 'SED_SCENE_1') {
    throw new Error('Invalid SED_SCENE_1 JSON');
  }

  const sceneData = {
    schema: json.schema,
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
    const row = Math.floor(index / 6);
    const col = index % 6;
    const id = `step_${index}`;
    const node = {
      id,
      type: 'step',
      position: { x: 50 + col * 220, y: 80 + row * 160 },
      data: { ...step },
    };
    nodes.push(node);
    if (step.type === 'label' && step.name) {
      labelMap[step.name] = id;
    }
  });

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const srcId = `step_${i}`;

    if (step.type === 'jump' && step.label && labelMap[step.label]) {
      edges.push({
        id: `e-${srcId}-${labelMap[step.label]}`,
        source: srcId,
        target: labelMap[step.label],
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#eab308', strokeWidth: 2 },
      });
      continue;
    }

    if (step.type === 'choice' && Array.isArray(step.options)) {
      step.options.forEach((opt, idx) => {
        if (opt.jump && labelMap[opt.jump]) {
          edges.push({
            id: `e-${srcId}-${labelMap[opt.jump]}-opt${idx}`,
            source: srcId,
            target: labelMap[opt.jump],
            sourceHandle: `option-${idx}`,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#22c55e', strokeWidth: 2 },
          });
        }
      });
      continue;
    }

    if (step.type === 'condition') {
      if (step.jumpTrue && labelMap[step.jumpTrue]) {
        edges.push({
          id: `e-${srcId}-${labelMap[step.jumpTrue]}-true`,
          source: srcId,
          target: labelMap[step.jumpTrue],
          sourceHandle: 'true',
          type: 'smoothstep',
          style: { stroke: '#22c55e', strokeWidth: 2 },
        });
      }
      if (step.jumpFalse && labelMap[step.jumpFalse]) {
        edges.push({
          id: `e-${srcId}-${labelMap[step.jumpFalse]}-false`,
          source: srcId,
          target: labelMap[step.jumpFalse],
          sourceHandle: 'false',
          type: 'smoothstep',
          style: { stroke: '#ef4444', strokeWidth: 2 },
        });
      }
      continue;
    }

    if (i + 1 < steps.length) {
      edges.push({
        id: `e-${srcId}-step_${i + 1}`,
        source: srcId,
        target: `step_${i + 1}`,
        type: 'smoothstep',
      });
    }
  }

  return { nodes, edges, sceneData };
}
