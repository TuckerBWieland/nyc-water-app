/**
 * Ensures a Date object is created with proper UTC interpretation
 * Handles different date formats consistently in UTC
 * 
 * @param dateString - Date string or Date object to parse
 * @returns Date object in UTC
 */
export function parseDateUTC(dateString: Date | string): Date {
  if (dateString instanceof Date) {
    return dateString;
  }

  // If it's a string without T/Z, it needs special handling to avoid timezone issues
  if (typeof dateString === 'string' && !dateString.includes('T') && !dateString.includes('Z')) {
    // Parse timestamp parts
    if (dateString.includes('-') && dateString.includes(':')) {
      // Format: YYYY-MM-DD HH:MM
      const [datePart, timePart] = dateString.split(' ');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hours, minutes] = timePart.split(':').map(Number);

      // Create a UTC Date object
      return new Date(Date.UTC(year, month - 1, day, hours, minutes));
    } else if (dateString.includes('-')) {
      // Just date without time (e.g., 2025-05-09)
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(Date.UTC(year, month - 1, day));
    }
  }

  // Default to standard Date constructor for all other formats
  return new Date(dateString);
}