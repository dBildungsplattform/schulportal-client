import { dedup, sameContent } from './arrays';

type Cases<T> = Array<Array<Array<T>>>;
type NestedType = { id: string };

describe('dedup', () => {
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

  describe('when type is string', () => {
    const testData: Cases<string> = data;

    test.each(testData)('it returns the deduplicated array for %s', (input: Array<string>, output: Array<string>) => {
      expect(dedup(input, (s: string) => s)).toEqual(output);
    });

    test.each(testData)(
      'it returns the deduplicated array for %s without toKey',
      (input: Array<string>, output: Array<string>) => {
        expect(dedup(input)).toEqual(output);
      },
    );
  });

  describe('when type is number ', () => {
    const testData: Cases<number> = mapTestData((s: string) => Number(s));

    test.each(testData)('it returns the deduplicated array for %s', (input: Array<number>, output: Array<number>) => {
      expect(dedup(input, (n: number) => n)).toEqual(output);
    });

    test.each(testData)(
      'it returns the deduplicated array for %s without toKey',
      (input: Array<number>, output: Array<number>) => {
        expect(dedup(input)).toEqual(output);
      },
    );
  });

  describe('when type is nested', () => {
    const testData: Cases<NestedType> = mapTestData((s: string) => ({ id: s }));
    test.each(testData)(
      'it returns the deduplicated array for %s',
      (input: Array<NestedType>, output: Array<NestedType>) => {
        expect(dedup(input, (o: NestedType) => o.id)).toEqual(output);
      },
    );
  });
});

describe('sameContent', () => {
  type Case<T> = {
    a: Array<T>;
    b: Array<T>;
    expected: boolean;
  };
  const data: Array<Case<string>> = [
    {
      a: ['1'],
      b: ['1'],
      expected: true,
    },
    {
      a: ['1'],
      b: ['2'],
      expected: false,
    },
    {
      a: Array(250).fill('1'),
      b: Array(100).fill('1'),
      expected: true,
    },
    {
      a: Array(100).fill('1'),
      b: Array(200).fill('2'),
      expected: false,
    },
    {
      a: ['1'],
      b: [],
      expected: false,
    },
    {
      a: [],
      b: ['1'],
      expected: false,
    },
    {
      a: [],
      b: [],
      expected: true,
    },
    {
      a: ['10966', '4891', '13092', '24866', '29819', '23175', '29196', '24037', '25358', '1573'],
      b: ['27886', '5591', '19928', '32683', '23521', '15781', '8581', '30753', '8675', '12846'],
      expected: false,
    },
  ];

  function mapTestData<T>(converter: (arg: string) => T): Array<Case<T>> {
    return data.map(({ a, b, expected }: Case<string>) => ({
      a: a.map(converter),
      b: b.map(converter),
      expected,
    }));
  }

  describe('when type is string', () => {
    test.each(mapTestData((arg: string) => arg))(
      'it returns the expected value',
      ({ a, b, expected }: Case<string>) => {
        expect(sameContent(a, b)).toBe(expected);
      },
    );
  });

  describe('when type is number', () => {
    test.each(mapTestData((arg: string) => Number(arg)))(
      'it returns the expected value',
      ({ a, b, expected }: Case<number>) => {
        expect(sameContent(a, b)).toBe(expected);
      },
    );
  });

  describe('when type is object', () => {
    const converter = (arg: string): NestedType => ({ id: arg });
    test.each(mapTestData(converter))('it returns the expected value', ({ a, b, expected }: Case<NestedType>) => {
      expect(
        sameContent(a, b, (arg: NestedType) => arg.id),
        `a: ${a}, b: ${b}`,
      ).toBe(expected);
    });
  });
});
