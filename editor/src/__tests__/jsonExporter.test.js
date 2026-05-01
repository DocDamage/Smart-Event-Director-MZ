import { exportScene, validateScene } from '../export/jsonExporter';

describe('exportScene', () => {
  test('exports graph scene with schema SED_SCENE_2', () => {
    const nodes = [
      { id: 'n1', data: { type: 'dialogue', text: 'Hello', _validationErrors: [] } },
      { id: 'n2', data: { type: 'wait', frames: 30 } },
    ];
    const edges = [
      { id: 'e1', source: 'n1', target: 'n2' },
    ];
    const sceneData = { sceneId: 'out', title: 'Out' };
    const result = exportScene(nodes, edges, sceneData);
    expect(result.json.schema).toBe('SED_SCENE_2');
    expect(result.json.sceneId).toBe('out');
    expect(result.json.nodes).toHaveLength(2);
    expect(result.json.edges).toHaveLength(1);
    expect(result.issues).toEqual([]);
  });

  test('strips internal metadata from nodes', () => {
    const nodes = [
      { id: 'n1', data: { type: 'dialogue', text: 'Hi', _validationErrors: ['err'], _playtestActive: true } },
    ];
    const result = exportScene(nodes, [], { sceneId: 'x' });
    expect(result.json.nodes[0]._validationErrors).toBeUndefined();
    expect(result.json.nodes[0]._playtestActive).toBeUndefined();
  });

  test('includes optional scene metadata', () => {
    const result = exportScene(
      [{ id: 'n1', data: { type: 'dialogue' } }],
      [],
      { sceneId: 'meta', canSkip: false, timeoutFrames: 100, context: 'battle', triggers: [{ type: 'mapEnter', mapId: 1 }] }
    );
    expect(result.json.canSkip).toBe(false);
    expect(result.json.timeoutFrames).toBe(100);
    expect(result.json.context).toBe('battle');
    expect(result.json.triggers).toHaveLength(1);
  });

  test('reports validation issues', () => {
    const nodes = [
      { id: 'n1', data: { type: 'dialogue' } },
      { id: 'n2', data: {} },
    ];
    const edges = [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'bad', source: 'n1', target: 'missing' },
    ];
    const result = exportScene(nodes, edges, { sceneId: 'bad' });
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues.some(i => i.includes('missing'))).toBe(true);
    expect(result.issues.some(i => i.includes('missing type'))).toBe(true);
  });

  test('reports no start node', () => {
    const nodes = [
      { id: 'a', data: { type: 'dialogue' } },
      { id: 'b', data: { type: 'wait' } },
    ];
    const edges = [
      { id: 'e1', source: 'a', target: 'b' },
      { id: 'e2', source: 'b', target: 'a' },
    ];
    const issues = validateScene(nodes, edges);
    expect(issues.some(i => i.includes('No start node'))).toBe(true);
  });

  test('reports multiple start nodes', () => {
    const nodes = [
      { id: 'a', data: { type: 'dialogue' } },
      { id: 'b', data: { type: 'wait' } },
    ];
    const edges = [];
    const issues = validateScene(nodes, edges);
    expect(issues.some(i => i.includes('Multiple start nodes'))).toBe(true);
  });
});
