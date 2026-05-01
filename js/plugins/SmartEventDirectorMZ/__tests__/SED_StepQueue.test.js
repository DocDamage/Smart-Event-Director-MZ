describe('SED.StepQueue', () => {
  beforeEach(() => {
    loadScript('runtime/SED_StepQueue.js');
  });

  test('iterates linearly through steps', () => {
    const steps = [
      { type: 'dialogue', text: 'Hello' },
      { type: 'wait', frames: 60 },
      { type: 'dialogue', text: 'World' },
    ];
    const queue = new SED.StepQueue(steps);
    expect(queue.currentIndex()).toBe(0);
    expect(queue.next().text).toBe('Hello');
    expect(queue.currentIndex()).toBe(1);
    expect(queue.next().type).toBe('wait');
    expect(queue.next().text).toBe('World');
    expect(queue.next()).toBeNull();
    expect(queue.isComplete()).toBe(true);
  });

  test('jumpTo advances to label', () => {
    const steps = [
      { type: 'dialogue', text: 'A' },
      { type: 'label', name: 'mid' },
      { type: 'dialogue', text: 'B' },
      { type: 'dialogue', text: 'C' },
    ];
    const queue = new SED.StepQueue(steps);
    queue.jumpTo('mid');
    expect(queue.currentIndex()).toBe(2);
    expect(queue.next().text).toBe('B');
  });

  test('jumpTo throws on missing label', () => {
    const queue = new SED.StepQueue([{ type: 'dialogue' }]);
    expect(() => queue.jumpTo('nope')).toThrow('Missing label: nope');
  });

  test('empty queue is immediately complete', () => {
    const queue = new SED.StepQueue([]);
    expect(queue.isComplete()).toBe(true);
    expect(queue.next()).toBeNull();
  });
});
