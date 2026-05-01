import { autoLayout } from '../utils/layout';

describe('autoLayout', () => {
  test('positions nodes in topological layers', () => {
    const nodes = [
      { id: 'a', position: { x: 0, y: 0 } },
      { id: 'b', position: { x: 0, y: 0 } },
      { id: 'c', position: { x: 0, y: 0 } },
    ];
    const edges = [
      { id: 'e1', source: 'a', target: 'b' },
      { id: 'e2', source: 'b', target: 'c' },
    ];
    const result = autoLayout(nodes, edges);
    const byId = Object.fromEntries(result.map(n => [n.id, n.position]));

    expect(byId.a.x).toBeLessThan(byId.b.x);
    expect(byId.b.x).toBeLessThan(byId.c.x);
  });

  test('handles disconnected nodes', () => {
    const nodes = [
      { id: 'a', position: { x: 0, y: 0 } },
      { id: 'b', position: { x: 0, y: 0 } },
    ];
    const edges = [];
    const result = autoLayout(nodes, edges);
    expect(result).toHaveLength(2);
    result.forEach(n => {
      expect(n.position.x).toBeDefined();
      expect(n.position.y).toBeDefined();
    });
  });

  test('handles cycle without crashing', () => {
    const nodes = [
      { id: 'a', position: { x: 0, y: 0 } },
      { id: 'b', position: { x: 0, y: 0 } },
    ];
    const edges = [
      { id: 'e1', source: 'a', target: 'b' },
      { id: 'e2', source: 'b', target: 'a' },
    ];
    const result = autoLayout(nodes, edges);
    expect(result).toHaveLength(2);
  });

  test('positions isolated nodes at layer origin', () => {
    const nodes = [
      { id: 'a', position: { x: 50, y: 50 } },
    ];
    const edges = [];
    const result = autoLayout(nodes, edges);
    // Isolated nodes are start nodes (layer 0), so they get base offset
    expect(result[0].position.x).toBe(80);
    expect(result[0].position.y).toBe(80);
  });
});
