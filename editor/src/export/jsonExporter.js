export function exportScene(nodes, edges, sceneData) {
  const sorted = [...nodes].sort((a, b) => a.position.x - b.position.x || a.position.y - b.position.y);
  const outEdges = {};
  edges.forEach((e) => {
    if (!outEdges[e.source]) outEdges[e.source] = [];
    outEdges[e.source].push(e);
  });

  const steps = sorted.map((node) => {
    const step = { ...node.data };
    const srcEdges = outEdges[node.id] || [];

    if (step.type === 'jump') {
      const edge = srcEdges.find((e) => {
        const target = sorted.find((n) => n.id === e.target);
        return target && target.data.type === 'label';
      });
      if (edge) {
        const target = sorted.find((n) => n.id === edge.target);
        if (target) step.label = target.data.name;
      }
    }

    if (step.type === 'choice') {
      if (Array.isArray(step.options)) {
        step.options = step.options.map((opt, idx) => {
          const edge = srcEdges.find((e) => e.sourceHandle === `option-${idx}`);
          if (edge) {
            const target = sorted.find((n) => n.id === edge.target);
            if (target && target.data.type === 'label') {
              return { ...opt, jump: target.data.name };
            }
          }
          return { ...opt };
        });
      }
    }

    if (step.type === 'condition') {
      const trueEdge = srcEdges.find((e) => e.sourceHandle === 'true');
      const falseEdge = srcEdges.find((e) => e.sourceHandle === 'false');
      if (trueEdge) {
        const target = sorted.find((n) => n.id === trueEdge.target);
        if (target && target.data.type === 'label') step.jumpTrue = target.data.name;
      }
      if (falseEdge) {
        const target = sorted.find((n) => n.id === falseEdge.target);
        if (target && target.data.type === 'label') step.jumpFalse = target.data.name;
      }
    }

    return step;
  });

  const result = {
    schema: 'SED_SCENE_1',
    sceneId: sceneData.sceneId || 'new_scene',
    title: sceneData.title || '',
    steps,
  };

  if (sceneData.canSkip !== undefined) result.canSkip = sceneData.canSkip;
  if (sceneData.timeoutFrames !== undefined) result.timeoutFrames = sceneData.timeoutFrames;

  return result;
}

export function validateScene(nodes, edges) {
  const errors = [];
  const labels = new Set();

  nodes.forEach((n) => {
    if (n.data.type === 'label' && n.data.name) labels.add(n.data.name);
  });

  nodes.forEach((n) => {
    if (n.data.type === 'jump') {
      const edge = edges.find((e) => e.source === n.id);
      if (!edge) {
        errors.push(`Jump node ${n.id} has no target edge.`);
      } else {
        const target = nodes.find((node) => node.id === edge.target);
        if (!target || target.data.type !== 'label') {
          errors.push(`Jump node ${n.id} target is not a label.`);
        } else if (!labels.has(target.data.name)) {
          errors.push(`Jump node ${n.id} references unknown label "${target.data.name}".`);
        }
      }
    }

    if (n.data.type === 'choice') {
      if (!Array.isArray(n.data.options) || n.data.options.length === 0) {
        errors.push(`Choice node ${n.id} has no options.`);
      }
    }
  });

  return errors;
}
