import { addDays, parse } from 'date-fns';

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
  return july31stThisYear.toLocaleDateString('de-DE');
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
 * Formats a date string to the German format and prepends it with a translated message.
 * The input date is adjusted by subtracting one day before formatting.
 * @param {string | undefined} dateString - The ISO date string to be formatted, or undefined if no date is provided.
 * @returns {string} The translated string followed by the formatted date in German format (dd.MM.yyyy), or an empty string if the input is invalid.
 */
export function formatDate(dateString: string | undefined, t: (key: string) => string): string {
  if (!dateString) return '';
  const date: Date = new Date(dateString);

  // Subtract one day
  date.setDate(date.getDate() - 1);

  // Return the translated string followed by the formatted date
  return `${t('admin.befristung.limitedUntil')} ${new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)}`;
}
