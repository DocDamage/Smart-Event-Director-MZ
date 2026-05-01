describe('SED.GraphQueue', () => {
  beforeEach(() => {
    loadScript('runtime/SED_GraphQueue.js');
  });

  const makeNodes = () => [
    { id: 'node-1', type: 'dialogue' },
    { id: 'node-2', type: 'choice' },
    { id: 'node-3', type: 'wait' },
  ];

  const makeEdges = () => [
    { id: 'e1', source: 'node-1', target: 'node-2' },
    { id: 'e2', source: 'node-2', target: 'node-3' },
  ];

  test('constructor builds index map for arbitrary ids', () => {
    const queue = new SED.GraphQueue(makeNodes(), makeEdges());
    expect(queue.currentIndex()).toBe(0);
    queue.next();
    expect(queue.currentNodeId()).toBe('node-2');
    expect(queue.currentIndex()).toBe(1);
  });

  test('currentIndex works with Date.now style ids', () => {
    const nodes = [
      { id: 'node-1714514123456', type: 'dialogue' },
      { id: 'node-1714514123457', type: 'wait' },
    ];
    const edges = [{ id: 'e1', source: 'node-1714514123456', target: 'node-1714514123457' }];
    const queue = new SED.GraphQueue(nodes, edges);
    expect(queue.currentIndex()).toBe(0);
    queue.next();
    expect(queue.currentNodeId()).toBe('node-1714514123457');
    expect(queue.currentIndex()).toBe(1);
  });

  test('next traverses graph in order', () => {
    const queue = new SED.GraphQueue(makeNodes(), makeEdges());
    expect(queue.currentNodeId()).toBe('node-1');
    const n1 = queue.next();
    expect(n1.id).toBe('node-1');
    expect(queue.currentNodeId()).toBe('node-2');
    const n2 = queue.next();
    expect(n2.id).toBe('node-2');
    expect(queue.currentNodeId()).toBe('node-3');
  });

  test('chooseEdge selects branch', () => {
    const nodes = [
      { id: 'a', type: 'choice' },
      { id: 'b', type: 'dialogue' },
      { id: 'c', type: 'wait' },
    ];
    const edges = [
      { id: 'e1', source: 'a', target: 'b' },
      { id: 'e2', source: 'a', target: 'c' },
    ];
    const queue = new SED.GraphQueue(nodes, edges);
    queue.chooseEdge('e2');
    queue.next();
    expect(queue.currentNodeId()).toBe('c');
  });

  test('jumpTo moves to label or node id', () => {
    const queue = new SED.GraphQueue(makeNodes(), makeEdges(), { 'myLabel': 'node-3' });
    queue.jumpTo('myLabel');
    expect(queue.currentNodeId()).toBe('node-3');
    queue.jumpTo('node-1');
    expect(queue.currentNodeId()).toBe('node-1');
    expect(() => queue.jumpTo('missing')).toThrow();
  });

  test('isComplete returns true at end', () => {
    const nodes = [{ id: 'a', type: 'dialogue' }];
    const edges = [];
    const queue = new SED.GraphQueue(nodes, edges);
    expect(queue.isComplete()).toBe(true);
    queue.next();
    expect(queue.isComplete()).toBe(true);
    expect(queue.currentNodeId()).toBeNull();
  });

  test('hasVisited tracks visited nodes', () => {
    const queue = new SED.GraphQueue(makeNodes(), makeEdges());
    expect(queue.hasVisited()).toBe(false);
    queue.next();
    expect(queue.hasVisited('node-1')).toBe(true);
    expect(queue.hasVisited('node-2')).toBe(false);
  });

  test('getNode returns node by id', () => {
    const queue = new SED.GraphQueue(makeNodes(), makeEdges());
    expect(queue.getNode('node-2').type).toBe('choice');
    expect(queue.getNode('missing')).toBeNull();
  });
});
