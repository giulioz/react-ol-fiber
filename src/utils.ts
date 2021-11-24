export function shallowCompare(a: any, b: any) {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) return a.every((e, i) => b[i] === e);
  if (typeof a === 'object' && typeof b === 'object') {
    const keys = Array.from(new Set([...Object.keys(a), ...Object.keys(b)]));
    return keys.every(key => a[key] === b[key]);
  }
}

export const pascalCase = <T extends string>(str: T) => (str.charAt(0).toUpperCase() + str.substring(1)) as Capitalize<T>;

export function pruneKeys<T>(obj: T, ...keys: string[][]) {
  const keysToRemove = new Set(keys.flat());

  return Object.fromEntries(Object.entries(obj).filter(([key]) => !keysToRemove.has(key)));
}
