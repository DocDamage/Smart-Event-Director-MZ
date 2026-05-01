describe('SED.EventBus', () => {
  beforeEach(() => {
    loadScript('runtime/SED_EventBus.js');
  });
  test('emits events to subscribers', () => {
    const listener = jest.fn();
    SED.EventBus.on('test:event', listener);
    SED.EventBus.emit('test:event', { foo: 'bar' });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ foo: 'bar' });
  });

  test('supports multiple subscribers', () => {
    const a = jest.fn();
    const b = jest.fn();
    SED.EventBus.on('multi', a);
    SED.EventBus.on('multi', b);
    SED.EventBus.emit('multi', 1);
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });

  test('off removes specific listener', () => {
    const listener = jest.fn();
    SED.EventBus.on('off:test', listener);
    SED.EventBus.off('off:test', listener);
    SED.EventBus.emit('off:test');
    expect(listener).not.toHaveBeenCalled();
  });

  test('off without fn clears all listeners for event', () => {
    const a = jest.fn();
    const b = jest.fn();
    SED.EventBus.on('clear:test', a);
    SED.EventBus.on('clear:test', b);
    SED.EventBus.off('clear:test');
    SED.EventBus.emit('clear:test');
    expect(a).not.toHaveBeenCalled();
    expect(b).not.toHaveBeenCalled();
  });

  test('once fires only one time', () => {
    const listener = jest.fn();
    SED.EventBus.once('once:test', listener);
    SED.EventBus.emit('once:test', 1);
    SED.EventBus.emit('once:test', 2);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(1);
  });

  test('isolates errors between listeners', () => {
    const bad = jest.fn(() => { throw new Error('boom'); });
    const good = jest.fn();
    SED.EventBus.on('error:test', bad);
    SED.EventBus.on('error:test', good);
    SED.EventBus.emit('error:test');
    expect(bad).toHaveBeenCalled();
    expect(good).toHaveBeenCalled();
  });

  test('Events constants are defined', () => {
    expect(SED.EventBus.Events.RUNNER_UPDATE_START).toBe('runner:updateStart');
    expect(SED.EventBus.Events.RUNNER_STEP_START).toBe('runner:stepStart');
    expect(SED.EventBus.Events.RUNNER_SCENE_COMPLETE).toBe('runner:sceneComplete');
  });
});
