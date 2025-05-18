/**
 * Utility for consistent date parsing in UTC
 */

/**
 * Parse a date string to a UTC Date object
 * @param {string} dateStr - Date string to parse
 * @returns {Date} Parsed date in UTC
 */
export function parseDateUTC(dateStr) {
  // Handle common date formats
  if (!dateStr.includes('T') && dateStr.includes('-')) {
    // Handle YYYY-MM-DD format
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  } else if (dateStr.includes('T')) {
    // Handle ISO format (YYYY-MM-DDTHH:MM:SSZ)
    return new Date(dateStr);
  } else if (dateStr.includes('/')) {
    // Handle MM/DD/YYYY format
    const [month, day, year] = dateStr.split('/').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }
  
  // Fall back to standard date parsing (in UTC)
  const parsedDate = new Date(dateStr);
  return new Date(Date.UTC(
    parsedDate.getFullYear(),
    parsedDate.getMonth(),
    parsedDate.getDate(),
    parsedDate.getHours(),
    parsedDate.getMinutes(),
    parsedDate.getSeconds()
  ));
}

/**
 * Format a date as YYYY-MM-DD
 * @param {Date} date - Date object to format
 * @returns {string} Formatted date string (YYYY-MM-DD)
 */
export function formatYYYYMMDD(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a date to a readable format
 * @param {Date} date - Date object to format
 * @returns {string} Formatted date string
 */
export function formatReadable(date) {
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC' 
  };
  return date.toLocaleDateString('en-US', options) + ' UTC';
}