describe('SED.SceneValidator', () => {
  beforeEach(() => {
    loadScript('data/SED_SceneValidator.js');
  });

  test('validates SED_SCENE_1 with steps', () => {
    const scene = {
      schema: 'SED_SCENE_1',
      sceneId: 'test',
      steps: [{ type: 'dialogue', text: 'hi' }]
    };
    const errors = SED.SceneValidator.validateScene(scene);
    expect(errors).toEqual([]);
  });

  test('validates SED_SCENE_2 with nodes and edges', () => {
    const scene = {
      schema: 'SED_SCENE_2',
      sceneId: 'graph',
      nodes: [
        { id: 'a', type: 'dialogue' },
        { id: 'b', type: 'wait' }
      ],
      edges: [{ id: 'e1', source: 'a', target: 'b' }]
    };
    const errors = SED.SceneValidator.validateScene(scene);
    expect(errors).toEqual([]);
  });

  test('rejects invalid schema', () => {
    const scene = {
      schema: 'UNKNOWN',
      sceneId: 'bad',
      steps: [{ type: 'dialogue', text: 'hi' }]
    };
    const errors = SED.SceneValidator.validateScene(scene);
    expect(errors.some(e => e.includes("schema"))).toBe(true);
  });

  test('rejects missing sceneId', () => {
    const scene = {
      schema: 'SED_SCENE_1',
      steps: []
    };
    const errors = SED.SceneValidator.validateScene(scene);
    expect(errors.some(e => e.includes("sceneId"))).toBe(true);
  });

  test('graph validation catches missing node ids', () => {
    const scene = {
      schema: 'SED_SCENE_2',
      sceneId: 'bad',
      nodes: [{ type: 'dialogue' }],
      edges: []
    };
    const errors = SED.SceneValidator.validateScene(scene);
    expect(errors.some(e => e.includes("missing id"))).toBe(true);
  });

  test('graph validation catches self-loops', () => {
    const scene = {
      schema: 'SED_SCENE_2',
      sceneId: 'loop',
      nodes: [{ id: 'a', type: 'dialogue' }],
      edges: [{ id: 'e1', source: 'a', target: 'a' }]
    };
    const errors = [];
    SED.SceneValidator.validateGraph(scene, errors);
    expect(errors.some(e => e.includes("self-loop"))).toBe(true);
  });

  test('graph validation detects cycles', () => {
    const scene = {
      schema: 'SED_SCENE_2',
      sceneId: 'cycle',
      nodes: [
        { id: 'a', type: 'dialogue' },
        { id: 'b', type: 'dialogue' }
      ],
      edges: [
        { id: 'e1', source: 'a', target: 'b' },
        { id: 'e2', source: 'b', target: 'a' }
      ]
    };
    const errors = [];
    SED.SceneValidator.validateGraph(scene, errors);
    expect(errors.some(e => e.includes("cycle"))).toBe(true);
  });

  test('graph validation detects unreachable nodes', () => {
    const scene = {
      schema: 'SED_SCENE_2',
      sceneId: 'orphan',
      nodes: [
        { id: 'a', type: 'dialogue' },
        { id: 'b', type: 'dialogue' }
      ],
      edges: [
        { id: 'e1', source: 'a', target: 'a' }
      ]
    };
    const errors = [];
    SED.SceneValidator.validateGraph(scene, errors);
    expect(errors.some(e => e.includes("Unreachable"))).toBe(true);
  });
});
