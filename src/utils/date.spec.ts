import { faker } from '@faker-js/faker';
import { formatDateDigitsToGermanDate, getNextSchuljahresende, isValidDate, notInPast } from './date';

describe('getNextSchuljahresende', () => {
  describe.each([
    {
      label: 'before 31.07.',
      systemTime: new Date('2024-06-30'),
      expectedDate: new Date('2024-07-31'),
    },
    {
      label: 'past 31.07.',
      systemTime: new Date('2024-08-01'),
      expectedDate: new Date('2025-07-31'),
    },
  ])('when today is $label', ({ systemTime, expectedDate }: { systemTime: Date; expectedDate: Date }) => {
    beforeEach(() => {
      vi.setSystemTime(systemTime);
    });
    afterEach(() => {
      vi.setSystemTime(vi.getRealSystemTime());
    });
    test('returns the correct value', () => {
      const result: string = getNextSchuljahresende();
      expect(result).toBe(
        expectedDate.toLocaleDateString('de-DE', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }),
      );
    });
  });
});

describe('formatDateToIso', () => {
  test.todo('', () => {});
});

describe('formatDateDigitsToGermanDate', () => {
  test('it correctly formats date', () => {
    const date: Date = new Date('2024-12-31');
    const expectedDate: string = '31.12.2024';
    const result: string = formatDateDigitsToGermanDate(date);
    expect(result).toBe(expectedDate);
  });
});

describe('adjustDateForTimezoneAndFormat', () => {
  test.todo('', () => {});
});

describe('formatDate', () => {
  test.todo('', () => {});
});

describe('notInPast', () => {
  test.each([
    ['past date', '31.12.2020', false],
    ['future date', formatDateDigitsToGermanDate(faker.date.future()), true],
    ['empty string', '', true],
    ['undefined', undefined, true],
  ])('if %s, returns the correct value', (_: string, date: string | undefined, expected: boolean) => {
    const result: boolean = notInPast(date);
    expect(result).toBe(expected);
  });
});

describe('isValidDate', () => {
  test.each([
    ['valid date', '31.12.2024', true],
    ['invalid date', '31.02.2024', false],
    ['invalid format', '2024-12-31', false],
    ['empty string', '', true],
    ['undefined', undefined, true],
  ])('if %s, returns the correct value', (_: string, date: string | undefined, expected: boolean) => {
    const result: boolean = isValidDate(date);
    expect(result).toBe(expected);
  });
});
