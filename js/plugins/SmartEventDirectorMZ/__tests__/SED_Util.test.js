describe('SED.Util', () => {
  test('toBool converts values correctly', () => {
    expect(SED.Util.toBool(true, false)).toBe(true);
    expect(SED.Util.toBool(false, true)).toBe(false);
    expect(SED.Util.toBool('true', false)).toBe(true);
    expect(SED.Util.toBool('false', true)).toBe(false);
    expect(SED.Util.toBool(undefined, true)).toBe(true);
    expect(SED.Util.toBool(null, false)).toBe(false);
    expect(SED.Util.toBool('', true)).toBe(true);
  });

  test('toNumber parses numbers and falls back', () => {
    expect(SED.Util.toNumber('42', 0)).toBe(42);
    expect(SED.Util.toNumber(3.14, 0)).toBe(3.14);
    expect(SED.Util.toNumber('abc', 99)).toBe(99);
    expect(SED.Util.toNumber(NaN, 7)).toBe(7);
    // Number(null) === 0, which is finite, so null returns 0 not fallback
    expect(SED.Util.toNumber(null, 5)).toBe(0);
  });

  test('cloneJson deep clones objects', () => {
    const original = { a: 1, b: { c: 2 } };
    const cloned = SED.Util.cloneJson(original);
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    cloned.b.c = 99;
    expect(original.b.c).toBe(2);
  });

  test('parseIdList handles arrays and comma strings', () => {
    expect(SED.Util.parseIdList('1,2,3')).toEqual([1, 2, 3]);
    expect(SED.Util.parseIdList([4, 5, 6])).toEqual([4, 5, 6]);
    expect(SED.Util.parseIdList('')).toEqual([]);
    expect(SED.Util.parseIdList(null)).toEqual([]);
    expect(SED.Util.parseIdList('1,abc,3')).toEqual([1, 3]);
  });

  test('directionFromText maps directions', () => {
    expect(SED.Util.directionFromText('down')).toBe(2);
    expect(SED.Util.directionFromText('left')).toBe(4);
    expect(SED.Util.directionFromText('right')).toBe(6);
    expect(SED.Util.directionFromText('up')).toBe(8);
    expect(SED.Util.directionFromText('unknown')).toBe(0);
    expect(SED.Util.directionFromText(6)).toBe(6);
  });

  test('interpolateText replaces variable codes', () => {
    $gameVariables.setValue(1, 100);
    expect(SED.Util.interpolateText('Value is \\v[1]')).toBe('Value is 100');
  });

  test('interpolateText handles backslash escape', () => {
    expect(SED.Util.interpolateText('Path: C:\\Users')).toBe('Path: C:\\Users');
  });

  test('interpolateDeep processes nested structures', () => {
    $gameVariables.setValue(5, 999);
    const input = {
      text: 'Val: \\v[5]',
      arr: ['Item \\v[5]'],
      nested: { key: 'Num \\v[5]' }
    };
    const result = SED.Util.interpolateDeep(input);
    expect(result.text).toBe('Val: 999');
    expect(result.arr[0]).toBe('Item 999');
    expect(result.nested.key).toBe('Num 999');
  });

  test('evaluateCondition handles switchIs', () => {
    $gameSwitches.setValue(1, true);
    expect(SED.Util.evaluateCondition({ operator: 'switchIs', switchId: 1, value: true })).toBe(true);
    expect(SED.Util.evaluateCondition({ operator: 'switchIs', switchId: 1, value: false })).toBe(false);
  });

  test('evaluateCondition handles variable comparisons', () => {
    $gameVariables.setValue(10, 50);
    expect(SED.Util.evaluateCondition({ operator: 'variableIs', variableId: 10, value: 50 })).toBe(true);
    expect(SED.Util.evaluateCondition({ operator: 'variableGte', variableId: 10, value: 40 })).toBe(true);
    expect(SED.Util.evaluateCondition({ operator: 'variableLte', variableId: 10, value: 60 })).toBe(true);
    expect(SED.Util.evaluateCondition({ operator: 'variableIs', variableId: 10, value: 99 })).toBe(false);
  });

  test('evaluateCondition returns false for unknown operator', () => {
    expect(SED.Util.evaluateCondition({ operator: 'unknownOp' })).toBe(false);
    expect(SED.Util.evaluateCondition(null)).toBe(false);
  });
});
