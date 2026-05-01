import { importScene } from '../import/jsonImporter';

describe('importScene', () => {
  test('imports SED_SCENE_2 graph scene', () => {
    const json = {
      schema: 'SED_SCENE_2',
      sceneId: 'demo',
      title: 'Demo Scene',
      nodes: [
        { id: 'n1', type: 'dialogue', text: 'Hello', position: { x: 10, y: 20 } },
        { id: 'n2', type: 'wait', frames: 30 },
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2' },
      ],
    };
    const result = importScene(json);
    expect(result.sceneData.sceneId).toBe('demo');
    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(1);
    expect(result.nodes[0].data.type).toBe('dialogue');
    expect(result.nodes[0].position).toEqual({ x: 10, y: 20 });
  });

  test('imports SED_SCENE_1 linear scene', () => {
    const json = {
      schema: 'SED_SCENE_1',
      sceneId: 'linear',
      steps: [
        { type: 'dialogue', text: 'A' },
        { type: 'dialogue', text: 'B' },
      ],
    };
    const result = importScene(json);
    expect(result.sceneData.schema).toBe('SED_SCENE_1');
    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(1);
    expect(result.nodes[0].id).toBe('step_0');
    expect(result.nodes[1].id).toBe('step_1');
  });

  test('imports linear scene with jumps', () => {
    const json = {
      schema: 'SED_SCENE_1',
      sceneId: 'jump_test',
      steps: [
        { type: 'dialogue', text: 'Start' },
        { type: 'label', name: 'mid' },
        { type: 'jump', label: 'mid' },
      ],
    };
    const result = importScene(json);
    const jumpEdge = result.edges.find(e => e.source === 'step_2');
    expect(jumpEdge).toBeDefined();
    expect(jumpEdge.target).toBe('step_1');
  });

  test('imports linear scene with choice options', () => {
    const json = {
      schema: 'SED_SCENE_1',
      sceneId: 'choice_test',
      steps: [
        { type: 'choice', options: [{ text: 'Go', jump: 'end' }] },
        { type: 'label', name: 'end' },
        { type: 'dialogue', text: 'Done' },
      ],
    };
    const result = importScene(json);
    const choiceEdge = result.edges.find(e => e.sourceHandle === 'option-0');
    expect(choiceEdge).toBeDefined();
    expect(choiceEdge.target).toBe('step_1');
  });

  test('throws on unsupported schema', () => {
    expect(() => importScene({ schema: 'UNKNOWN' })).toThrow('Unsupported schema');
  });

  test('throws on null input', () => {
    expect(() => importScene(null)).toThrow('Invalid JSON');
  });
});
