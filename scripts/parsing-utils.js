const path = require('path');

function extractDateFromFilename(filename) {
  const dateMatch = filename.match(/\d{4}-\d{2}-\d{2}/);
  return dateMatch ? dateMatch[0] : null;
}

function formatSampleTime(date, timeStr) {
  if (!timeStr) return `${date}T12:00:00Z`;

  try {
    let formattedTime = timeStr.trim();
    let hour, minute;

    if (formattedTime.includes(':')) {
      const parts = formattedTime.split(':');
      hour = parseInt(parts[0], 10);

      if (parts[1].includes('AM') || parts[1].includes('PM')) {
        const minMatch = parts[1].match(/(\d+)/);
        minute = minMatch ? parseInt(minMatch[1], 10) : 0;

        if (parts[1].includes('PM') && hour < 12) {
          hour += 12;
        } else if (parts[1].includes('AM') && hour === 12) {
          hour = 0;
        }
      } else {
        minute = parseInt(parts[1], 10);
      }
    } else {
      hour = parseInt(formattedTime, 10);
      minute = 0;
    }

    if (
      isNaN(hour) ||
      isNaN(minute) ||
      hour < 0 ||
      hour > 23 ||
      minute < 0 ||
      minute > 59
    ) {
      throw new Error(`Invalid time components: hour=${hour}, minute=${minute}`);
    }

    const isoDate = new Date(
      Date.UTC(
        parseInt(date.substring(0, 4)),
        parseInt(date.substring(5, 7)) - 1,
        parseInt(date.substring(8, 10)),
        hour,
        minute
      )
    );

    return isoDate.toISOString();
  } catch (e) {
    console.warn(`Could not parse time: ${timeStr} for date ${date}. Using default.`);
    return `${date}T12:00:00Z`;
  }
}

module.exports = {
  extractDateFromFilename,
  formatSampleTime,
};
