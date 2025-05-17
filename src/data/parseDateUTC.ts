/**
 * Date parsing utility for consistent UTC date handling
 */

/**
 * Parses a date string ensuring consistent UTC interpretation
 * 
 * @param dateString - The date string to parse
 * @returns Date object in UTC
 */
export function parseDateUTC(dateString: string): Date {
  // Remove any timezone info if present to ensure consistent UTC parsing
  const cleanedDateStr = dateString.replace(/Z|(\+|-)\d{2}:?\d{2}$/, '');
  
  // If the string contains time information (includes 'T')
  if (cleanedDateStr.includes('T')) {
    return new Date(cleanedDateStr + 'Z'); // Append Z to make it UTC
  }
  
  // For date-only strings (YYYY-MM-DD), append T00:00:00Z for midnight UTC
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanedDateStr)) {
    return new Date(cleanedDateStr + 'T00:00:00Z');
  }
  
  // For all other formats, let Date handle it but be aware it'll use local timezone
  return new Date(cleanedDateStr);
}

/**
 * Formats a date as an ISO string in UTC
 * 
 * @param date - The date to format
 * @returns ISO string in UTC
 */
export function formatDateUTC(date: Date): string {
  return date.toISOString();
}

/**
 * Gets the UTC date components from a Date object
 * 
 * @param date - The date to extract components from
 * @returns Object with year, month, day, etc. in UTC
 */
export function getUTCDateComponents(date: Date): {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  return {
    year: date.getUTCFullYear(),
    // getUTCMonth() is 0-based, add 1 for human readability
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hours: date.getUTCHours(),
    minutes: date.getUTCMinutes(),
    seconds: date.getUTCSeconds()
  };
}