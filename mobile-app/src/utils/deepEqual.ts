export function isDeepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return false;

  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!isDeepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (typeof a === 'object') {
    if (Array.isArray(b)) return false;
    const aKeys = Object.keys(a as Record<string, unknown>);
    const bKeys = Object.keys(b as Record<string, unknown>);
    if (aKeys.length !== bKeys.length) return false;
    for (const key of aKeys) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
      if (!isDeepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) return false;
    }
    return true;
  }

  return false;
}