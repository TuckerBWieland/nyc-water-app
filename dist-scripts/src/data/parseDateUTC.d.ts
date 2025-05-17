/**
 * Date parsing utility for consistent UTC date handling
 */
/**
 * Parses a date string ensuring consistent UTC interpretation
 *
 * @param dateString - The date string to parse
 * @returns Date object in UTC
 */
export declare function parseDateUTC(dateString: string): Date;
/**
 * Formats a date as an ISO string in UTC
 *
 * @param date - The date to format
 * @returns ISO string in UTC
 */
export declare function formatDateUTC(date: Date): string;
/**
 * Gets the UTC date components from a Date object
 *
 * @param date - The date to extract components from
 * @returns Object with year, month, day, etc. in UTC
 */
export declare function getUTCDateComponents(date: Date): {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  seconds: number;
};
