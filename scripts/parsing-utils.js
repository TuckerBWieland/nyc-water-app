"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractDateFromFilename = extractDateFromFilename;
exports.formatSampleTime = formatSampleTime;
/**
 * Extract date string from a filename
 * @param filename - The filename to extract date from
 * @returns Date string in YYYY-MM-DD format or null if not found
 */
function extractDateFromFilename(filename) {
    const dateMatch = filename.match(/\d{4}-\d{2}-\d{2}/);
    return dateMatch ? dateMatch[0] : null;
}
/**
 * Format a sample time string into ISO timestamp
 * @param date - Date string in YYYY-MM-DD format
 * @param timeStr - Time string to parse (e.g., "2:30 PM", "14:30", "2")
 * @returns ISO timestamp string in UTC
 */
function formatSampleTime(date, timeStr) {
    if (!timeStr)
        return `${date}T16:00:00.000Z`; // Default to noon Eastern Time
    try {
        const formattedTime = timeStr.trim();
        let hour;
        let minute;
        if (formattedTime.includes(':')) {
            const parts = formattedTime.split(':');
            hour = parseInt(parts[0], 10);
            if (parts[1].includes('AM') || parts[1].includes('PM')) {
                const minMatch = parts[1].match(/(\d+)/);
                minute = minMatch ? parseInt(minMatch[1], 10) : 0;
                if (parts[1].includes('PM') && hour < 12) {
                    hour += 12;
                }
                else if (parts[1].includes('AM') && hour === 12) {
                    hour = 0;
                }
            }
            else {
                minute = parseInt(parts[1], 10);
            }
        }
        else {
            hour = parseInt(formattedTime, 10);
            minute = 0;
        }
        if (isNaN(hour) ||
            isNaN(minute) ||
            hour < 0 ||
            hour > 23 ||
            minute < 0 ||
            minute > 59) {
            throw new Error(`Invalid time components: hour=${hour}, minute=${minute}`);
        }
        // Parse the date string to get year, month, day
        const year = parseInt(date.substring(0, 4));
        const month = parseInt(date.substring(5, 7)) - 1; // JS months are 0-indexed
        const day = parseInt(date.substring(8, 10));
        // Create a date string in Eastern Time timezone and parse it
        // Use Intl.DateTimeFormat to determine if the date falls in DST
        const testDate = new Date(year, month, day);
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/New_York',
            timeZoneName: 'short'
        });
        const formattedDate = formatter.formatToParts(testDate);
        const tzName = formattedDate.find(part => part.type === 'timeZoneName')?.value;
        const isDST = tzName === 'EDT'; // Eastern Daylight Time vs EST (Eastern Standard Time)
        // Convert Eastern Time to UTC
        // EST is UTC-5, EDT is UTC-4
        const offsetHours = isDST ? 4 : 5;
        // Create the final UTC date
        const utcDate = new Date(Date.UTC(year, month, day, hour + offsetHours, minute));
        return utcDate.toISOString();
    }
    catch (e) {
        console.warn(`Could not parse time: ${timeStr} for date ${date}. Using default.`);
        return `${date}T16:00:00.000Z`; // Default to noon Eastern Time
    }
}
