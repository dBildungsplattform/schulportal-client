export function intersect<T>(a: Set<T>, b: Set<T>): Set<T> {
  const result: Set<T> = new Set();
  for (const element of a) {
    if (b.has(element)) {
      result.add(element);
    }
  }
  return result;
}
