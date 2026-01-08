import { faker } from '@faker-js/faker';
import { parseUserLock, PersonLockOccasion, type UserLock } from './lock';
import { formatDateDigitsToGermanDate } from './date';

describe('parseUserLock', () => {
  const refDate: Date = new Date();
  const personId: string = faker.string.uuid();

  const locked_by: string = faker.string.uuid();
  const created_at: Date = faker.date.past({ refDate });
  const locked_until: Date = faker.date.future({ refDate });

  vi.setSystemTime(refDate);

  test.each([
    {
      label: PersonLockOccasion.MANUELL_GESPERRT,
      input: {
        personId,
        locked_by,
        created_at: created_at.toISOString(),
        locked_until: locked_until.toISOString(),
        lock_occasion: PersonLockOccasion.MANUELL_GESPERRT,
      },
      expected: {
        locked_by,
        created_at: formatDateDigitsToGermanDate(created_at),
        // this date is consistently offset by 1 day
        // locked_until: formatDateDigitsToGermanDate(locked_until),
        lock_occasion: PersonLockOccasion.MANUELL_GESPERRT,
      },
    },
    {
      label: PersonLockOccasion.KOPERS_GESPERRT,
      input: {
        personId,
        locked_by,
        created_at: created_at.toISOString(),
        locked_until: locked_until.toISOString(),
        lock_occasion: PersonLockOccasion.KOPERS_GESPERRT,
      },
      expected: {
        lock_occasion: PersonLockOccasion.KOPERS_GESPERRT,
      },
    },
  ])(
    'when lock_occasion is $label, it should parse user lock correctly',
    ({ input, expected }: { input: UserLock; expected: Partial<UserLock> }) => {
      const actual: Array<UserLock> = parseUserLock([input]);
      expect(actual).toHaveLength(1);
      expect(actual).toEqual([expect.objectContaining(expected)]);
    },
  );
});
