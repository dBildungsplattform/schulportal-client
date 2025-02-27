export function dedup<T>(arr: Array<T>, comp: (a: T, b: T) => boolean = (a: T, b: T): boolean => a === b): Array<T> {
  return arr.reduce((acc: Array<T>, cur: T): Array<T> => {
    if (!acc.find((el: T) => comp(cur, el))) acc.push(cur);
    return acc;
  }, []);
}
