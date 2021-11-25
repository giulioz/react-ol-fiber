import { pascalCase, shallowCompare, pruneKeys } from '../src/utils';

describe('Utils', () => {
  test('turns a string into pascal case', () => {
    expect(pascalCase('testAbc')).toBe('TestAbc');
  });

  test('returns true only if two elements are the same', () => {
    const obj = {} as const;
    expect(shallowCompare(obj, obj)).toBeTruthy();
    const arr = [] as const;
    expect(shallowCompare(arr, arr)).toBeTruthy();
    expect(shallowCompare('test', 'test')).toBeTruthy();
    expect(shallowCompare(false, false)).toBeTruthy();
    expect(shallowCompare(null, null)).toBeTruthy();
    expect(shallowCompare(42, 42)).toBeTruthy();

    expect(shallowCompare('test', 'ttt')).toBeFalsy();
    expect(shallowCompare(false, true)).toBeFalsy();
    expect(shallowCompare(null, 3)).toBeFalsy();
    expect(shallowCompare(42, 52)).toBeFalsy();
  });

  test('returns true only if two elements have the same first-level children', () => {
    const childPtr = [] as const;
    const childPtr2 = [] as const;

    const objA = { testBoolean: true, testNumber: 42, testString: 'abc', testPtr: childPtr };
    const objB = { testBoolean: true, testNumber: 42, testString: 'abc', testPtr: childPtr };
    expect(shallowCompare(objA, objB)).toBeTruthy();
    const arrA = [true, 42, 'abc', childPtr] as const;
    const arrB = [true, 42, 'abc', childPtr] as const;
    expect(shallowCompare(arrA, arrB)).toBeTruthy();

    const objA2 = { testBoolean: true, testNumber: 42, testString: 'abc', testPtr: childPtr };
    const objB2 = { testBoolean: true, testNumber: 42, testString: 'abc', testPtr: childPtr2 };
    expect(shallowCompare(objA2, objB2)).toBeFalsy();
    const arrA2 = [true, 42, 'abc', childPtr] as const;
    const arrB2 = [true, 42, 'abc', childPtr2] as const;
    expect(shallowCompare(arrA2, arrB2)).toBeFalsy();

    const objA3 = { testBoolean: true, testNumber: 42, testString: 'abc', testPtr: childPtr };
    const objB3 = { testBoolean: true, testNumber: 42, testPtr: childPtr2 };
    expect(shallowCompare(objA3, objB3)).toBeFalsy();
    const arrA3 = ['abc', childPtr] as const;
    const arrB3 = [true, 42, 'abc', childPtr] as const;
    expect(shallowCompare(arrA3, arrB3)).toBeFalsy();
  });

  test('correctly prunes the required keys', () => {
    expect(pruneKeys({ abc: 42, def: 'test' }, ['abc']).abc).toBeUndefined();
    expect(pruneKeys({ abc: 42, def: 'test' }, ['abc', 'def'])).toEqual({});
    expect(pruneKeys({ abc: 42, def: 'test' }, ['eee'])).toEqual({ abc: 42, def: 'test' });
  });
});
