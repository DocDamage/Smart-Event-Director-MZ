describe('SED.UpdateDispatcher', () => {
  beforeEach(() => {
    loadScript('runtime/SED_UpdateDispatcher.js');
  });

  test('registers and calls update callbacks', () => {
    const cb = jest.fn();
    SED.UpdateDispatcher.register('Test', { update: cb, priority: 0, contexts: ['map'] });
    SED.UpdateDispatcher.update('map');
    expect(cb).toHaveBeenCalledTimes(1);
  });

  test('registers and calls draw callbacks', () => {
    const cb = jest.fn();
    SED.UpdateDispatcher.register('TestDraw', { draw: cb, priority: 0, contexts: ['map'] });
    SED.UpdateDispatcher.draw('map');
    expect(cb).toHaveBeenCalledTimes(1);
  });

  test('filters by context', () => {
    const mapCb = jest.fn();
    const battleCb = jest.fn();
    SED.UpdateDispatcher.register('MapOnly', { update: mapCb, contexts: ['map'] });
    SED.UpdateDispatcher.register('BattleOnly', { update: battleCb, contexts: ['battle'] });
    SED.UpdateDispatcher.update('map');
    expect(mapCb).toHaveBeenCalled();
    expect(battleCb).not.toHaveBeenCalled();
  });

  test('sorts by priority', () => {
    const order = [];
    SED.UpdateDispatcher.register('Second', { update: () => order.push(2), priority: 10 });
    SED.UpdateDispatcher.register('First', { update: () => order.push(1), priority: 5 });
    SED.UpdateDispatcher.register('Third', { update: () => order.push(3), priority: 15 });
    SED.UpdateDispatcher.update('map');
    expect(order).toEqual([1, 2, 3]);
  });

  test('unregister removes callback', () => {
    const cb = jest.fn();
    SED.UpdateDispatcher.register('Temp', { update: cb });
    SED.UpdateDispatcher.unregister('Temp');
    SED.UpdateDispatcher.update('map');
    expect(cb).not.toHaveBeenCalled();
  });

  test('prevents duplicate registrations', () => {
    const cb = jest.fn();
    SED.UpdateDispatcher.register('Dup', { update: cb });
    SED.UpdateDispatcher.register('Dup', { update: cb });
    SED.UpdateDispatcher.update('map');
    expect(cb).toHaveBeenCalledTimes(1);
  });

  test('isolates errors between callbacks', () => {
    const bad = jest.fn(() => { throw new Error('fail'); });
    const good = jest.fn();
    SED.UpdateDispatcher.register('Bad', { update: bad });
    SED.UpdateDispatcher.register('Good', { update: good });
    SED.UpdateDispatcher.update('map');
    expect(bad).toHaveBeenCalled();
    expect(good).toHaveBeenCalled();
  });

  test('list returns registered names', () => {
    SED.UpdateDispatcher.register('A', { update: () => {} });
    SED.UpdateDispatcher.register('B', { update: () => {} });
    expect(SED.UpdateDispatcher.list()).toContain('A');
    expect(SED.UpdateDispatcher.list()).toContain('B');
  });
});
