import { dedup } from './arrays';

type Cases<T> = Array<Array<Array<T>>>;
type NestedType = { id: string };

const data: Cases<string> = [
  [
    ['1', '2', '1'],
    ['1', '2'],
  ],
  [
    ['4', '2', '1'],
    ['4', '2', '1'],
  ],
  [Array(250).fill('2'), ['2']],
  [['1'], ['1']],
  [[], []],
];
function mapTestData<T>(converter: (arg: string) => T): Cases<T> {
  return data.map((a: Array<Array<string>>) => a.map((values: Array<string>) => values.map(converter)));
}

describe('dedup', () => {
  describe('when type is string', () => {
    const testData: Cases<string> = data;
    test.each(testData)('it returns the deduplicated array for %s', (input: Array<string>, output: Array<string>) => {
      expect(dedup(input)).toEqual(output);
    });
  });

  describe('when type is number ', () => {
    const testData: Cases<number> = mapTestData((s: string) => Number(s));
    test.each(testData)('it returns the deduplicated array for %s', (input: Array<number>, output: Array<number>) => {
      expect(dedup(input)).toEqual(output);
    });
  });

  describe('when type is nested', () => {
    const testData: Cases<NestedType> = mapTestData((s: string) => ({ id: s }));
    const comp: (a: NestedType, b: NestedType) => boolean = (a: NestedType, b: NestedType) => a.id === b.id;
    test.each(testData)(
      'it returns the deduplicated array for %s',
      (input: Array<NestedType>, output: Array<NestedType>) => {
        expect(dedup(input, comp)).toEqual(output);
      },
    );
  });
});
