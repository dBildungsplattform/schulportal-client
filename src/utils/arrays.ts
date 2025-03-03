/**
 * Deduplicate SMALL arrays
 * @param a array to deduplicate
 * @param comp optional function to use for comparison
 * @returns a with all duplciate values (according to comp) removed
 */
export function dedup<T>(arr: Array<T>, comp: (a: T, b: T) => boolean = (a: T, b: T): boolean => a === b): Array<T> {
  return arr.reduce((acc: Array<T>, cur: T): Array<T> => {
    if (!acc.find((el: T) => comp(cur, el))) acc.push(cur);
    return acc;
  }, []);
}

/**
 * Compare values of two arrays. Ignores duplicate values,
 * @param a first array to check
 * @param b second array to check
 * @param toKey optional function to derive key for comparison
 * @returns whether all values in a are also in b and vice-versa
 */
export function sameContent<T, K>(a: Array<T>, b: Array<T>, toKey?: (arg0: T) => K): boolean {
  if (toKey) {
    const aSet: Set<K> = new Set(a.map(toKey));
    const bSet: Set<K> = new Set(b.map(toKey));
    return a.every((v: T) => bSet.has(toKey(v))) && b.every((v: T) => aSet.has(toKey(v)));
  } else {
    const aSet: Set<T> = new Set(a);
    const bSet: Set<T> = new Set(b);
    return a.every((v: T) => bSet.has(v)) && b.every((v: T) => aSet.has(v));
  }
}
