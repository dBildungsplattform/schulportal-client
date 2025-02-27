import { addDays, isBefore, isValid, parse } from 'date-fns';

/**
 * Calculates the next 31st of July (End of school year)
 * @returns {string} The next end of school year date in German format (dd.MM.yyyy)
 */
export function getNextSchuljahresende(): string {
  const today: Date = new Date();
  const currentYear: number = today.getFullYear();
  const july31stThisYear: Date = new Date(currentYear, 6, 31); // July is month 6 (0-indexed)

  // If today's date is after July 31st this year, return July 31st of next year
  if (today > july31stThisYear) {
    return new Date(currentYear + 1, 6, 31).toLocaleDateString('de-DE');
  }

  // Otherwise, return July 31st of this year
  return july31stThisYear.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Formats a date in dd.MM.yyyy format to ISO 8601
 * @param {string | undefined} date - The date string in dd.MM.yyyy format
 * @returns {string | undefined} The formatted date in ISO 8601 format, or undefined if input is invalid
 */
export function formatDateToISO(date: string | undefined): string | undefined {
  if (date) {
    try {
      // Parse the date string using date-fns
      const parsedDate: Date = parse(date, 'dd.MM.yyyy', new Date());

      // Add one day to the date
      const updatedDate: Date = addDays(parsedDate, 1);

      // Return the date in ISO format
      return updatedDate.toISOString();
    } catch (error) {
      // If parsing fails, return undefined
      return undefined;
    }
  }
  return undefined;
}

/**
 * Formats a date string to the German format.
 * @param {Date} dateString
 * @returns {string} The translated string followed by the formatted date in German format (dd.MM.yyyy).
 */
export function formatDateDigitsToGermanDate(date: Date): string {
  return new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Adjusts the given date string for timezone differences and formats it to the German date format.
 * If the timezone offset is greater than or equal to -120 minutes, the date is adjusted by subtracting one hour.
 * @param {string | undefined} dateString - The ISO date string to be adjusted and formatted, or undefined if no date is provided.
 * @returns {string} The formatted date in German format (dd.MM.yyyy), or an empty string if the input is invalid.
 */
export function adjustDateForTimezoneAndFormat(dateString: string | undefined): string {
  if (!dateString) return '';
  const date: Date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  if (date.getTimezoneOffset() >= -120) {
    date.setHours(date.getHours() - 1);
  }
  return formatDateDigitsToGermanDate(date);
}

/**
 * Formats a date string to the German format and prepends it with a translated message.
 * The input date is adjusted by subtracting one day before formatting.
 * @param {string | undefined} dateString - The ISO date string to be formatted, or undefined if no date is provided.
 * @returns {string} The translated string followed by the formatted date in German format (dd.MM.yyyy), or an empty string if the input is invalid.
 */
export function formatDate(dateString: string | undefined, t: (key: string) => string): string {
  if (!dateString) return '';

  // Return the translated string followed by the formatted date
  return `${t('admin.befristung.limitedUntil')} ${adjustDateForTimezoneAndFormat(dateString)}`;
}

/**
 * Validates if the given date is not in the past.
 *
 * @param {string | undefined} value - The date string in the format `dd.MM.yyyy` to validate.
 *                                      If the value is undefined, the function returns true.
 * @returns {boolean} Returns `true` if the date is today or in the future,
 *                    and `false` if it is in the past.
 */
export function notInPast(value: string | undefined): boolean {
  if (!value) return true;

  const parsedDate: Date = parse(value, 'dd.MM.yyyy', new Date());
  return !isBefore(parsedDate, new Date());
}

/**
 * Validates if the given date string is in a valid format and represents a real date.
 *
 * @param {string | undefined} value - The date string in the format `dd.MM.yyyy` to validate.
 *                                      If the value is undefined, the function returns true.
 * @returns {boolean} Returns `true` if the date string is valid and represents a real date,
 *                    and `false` otherwise.
 */
export function isValidDate(value: string | undefined): boolean {
  if (!value) return true;

  const parsedDate: Date = parse(value, 'dd.MM.yyyy', new Date());
  return isValid(parsedDate);
}
