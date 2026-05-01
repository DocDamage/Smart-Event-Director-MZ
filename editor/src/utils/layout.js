const AUTO_LAYOUT_NODE_WIDTH = 240;
const AUTO_LAYOUT_NODE_HEIGHT = 160;

function buildAdjacency(nodes, edges) {
  const adj = new Map();
  nodes.forEach(n => adj.set(n.id, []));
  edges.forEach(e => {
    if (adj.has(e.source)) adj.get(e.source).push(e.target);
  });
  return adj;
}

export function autoLayout(nodes, edges) {
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
      positioned.set(id, { x: 80 + l * AUTO_LAYOUT_NODE_WIDTH, y: 80 + i * AUTO_LAYOUT_NODE_HEIGHT });
    });
  });

  return nodes.map(n => ({
    ...n,
    position: positioned.get(n.id) || n.position,
  }));
}
