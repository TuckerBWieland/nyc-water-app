import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodeFetch from 'node-fetch';

const fetch = nodeFetch;

// Haversine distance formula to calculate distance between two lat/lon points in kilometers
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

// Helper function to format dates for NOAA CO-OPS API (yyyy-MM-dd HH:mm)
function formatDate(date) {
  // Ensure we have a Date object
  const d = new Date(date);

  // Get date components (all UTC-based)
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0'); // +1 because months are 0-indexed
  const day = String(d.getUTCDate()).padStart(2, '0');
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');

  // Return formatted string: yyyy-MM-dd HH:mm
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// Helper function to ensure a Date object is created with proper UTC interpretation
function parseDateUTC(dateString) {
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

// Find the nearest NOAA tide station within configurable distance of the given lat/lon
async function findNearestTideStation(lat, lon) {
  try {
    // NOAA CO-OPS API endpoint for listing all stations
    const response = await fetch(
      'https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json'
    );
    const data = await response.json();

    if (!data.stations) {
      return null;
    }

    // First try with a 10km radius
    const stationWithin10km = findNearestStationWithinRadius(data.stations, lat, lon, 10);
    if (stationWithin10km) {
      return stationWithin10km;
    }

    // If no station within 10km, try with a 25km radius
    const stationWithin25km = findNearestStationWithinRadius(data.stations, lat, lon, 25);
    if (stationWithin25km) {
      return stationWithin25km;
    }

    return null;
  } catch (error) {
    return null;
  }
}

// Helper function to find the nearest station within a given radius
function findNearestStationWithinRadius(stations, lat, lon, maxDistanceKm) {
  let nearestStation = null;
  let minDistance = Infinity;

  for (const station of stations) {
    // Calculate distance between sample location and this station
    const distance = calculateDistance(lat, lon, station.lat, station.lng);

    // Update nearest station if this one is closer and within the radius
    if (distance <= maxDistanceKm && distance < minDistance) {
      minDistance = distance;
      nearestStation = {
        id: station.id,
        name: station.name,
        lat: station.lat,
        lng: station.lng,
        distance: distance.toFixed(2),
      };
    }
  }

  return nearestStation;
}

// Get tide data for a specific station around a specific time
async function getTideData(stationId, sampleTime) {
  try {
    // Parse the sample time with explicit UTC handling to avoid timezone ambiguity
    const sampleDate = parseDateUTC(sampleTime);

    // Set the begin and end dates for the API call (90 minutes before and after the sample time)
    const beginDate = new Date(sampleDate.getTime() - 90 * 60 * 1000);
    const endDate = new Date(sampleDate.getTime() + 90 * 60 * 1000);

    // Format dates for the API using the helper function
    const begin = formatDate(beginDate);
    const end = formatDate(endDate);

    // Log the time window being used

    // NOAA CO-OPS API endpoint for water level data - ensure URL encoding for date parameters
    const url = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${stationId}&product=water_level&datum=MLLW&time_zone=GMT&units=english&format=json&date_time=true&begin_date=${encodeURIComponent(
      begin
    )}&end_date=${encodeURIComponent(end)}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      return null;
    }

    // Log number of data points received
    if (data.data && Array.isArray(data.data)) {
    }

    return data.data || [];
  } catch (error) {
    return null;
  }
}

/**
 * Determine tide status by analyzing tide data points
 * @param {Array} tideData - Array of tide data points from NOAA (each with 't' timestamp and 'v' water level)
 * @param {Date} sampleDate - Date object representing the sample time
 * @return {Object|null} - Object with tide status information or null if analysis fails
 */
function determineTideStatus(tideData, sampleDate) {
  // Ensure we have sufficient tide data
  if (!tideData || tideData.length < 4) {
    return null;
  }

  // Convert all readings to objects with parsed dates and values using proper UTC parsing
  const readings = tideData
    .map(reading => ({
      time: parseDateUTC(reading.t),
      height: parseFloat(reading.v),
    }))
    .sort((a, b) => a.time - b.time); // Sort by time

  // Find closest reading to the sample time
  let closestIndex = 0;
  let minTimeDiff = Infinity;

  for (let i = 0; i < readings.length; i++) {
    const timeDiff = Math.abs(readings[i].time - sampleDate);
    if (timeDiff < minTimeDiff) {
      minTimeDiff = timeDiff;
      closestIndex = i;
    }
  }

  // Ensure we have enough points before and after
  if (closestIndex < 1 || closestIndex >= readings.length - 1) {
    return null;
  }

  // Get surrounding readings (±6-12 min)
  // Find points before the closest reading
  const pointsBefore = [];
  for (let i = closestIndex - 1; i >= 0; i--) {
    const timeDiffMinutes = (readings[closestIndex].time - readings[i].time) / (1000 * 60);
    if (timeDiffMinutes <= 12) {
      pointsBefore.unshift(readings[i]);
    }
    if (timeDiffMinutes > 12 || pointsBefore.length >= 2) {
      break;
    }
  }

  // Find points after the closest reading
  const pointsAfter = [];
  for (let i = closestIndex + 1; i < readings.length; i++) {
    const timeDiffMinutes = (readings[i].time - readings[closestIndex].time) / (1000 * 60);
    if (timeDiffMinutes <= 12) {
      pointsAfter.push(readings[i]);
    }
    if (timeDiffMinutes > 12 || pointsAfter.length >= 2) {
      break;
    }
  }

  if (pointsBefore.length === 0 || pointsAfter.length === 0) {
    return null;
  }

  // Determine if tide is rising or falling
  // Compare heights from before to after
  const beforeAvg = pointsBefore.reduce((sum, p) => sum + p.height, 0) / pointsBefore.length;
  const afterAvg = pointsAfter.reduce((sum, p) => sum + p.height, 0) / pointsAfter.length;
  const isRising = afterAvg > beforeAvg;

  // Calculate overall tide height statistics
  let maxHeight = -Infinity;
  let minHeight = Infinity;

  for (const reading of readings) {
    if (reading.height > maxHeight) maxHeight = reading.height;
    if (reading.height < minHeight) minHeight = reading.height;
  }

  const currentHeight = readings[closestIndex].height;

  // Define thresholds for high and low tide (top/bottom 20%)
  const highThreshold = maxHeight - (maxHeight - minHeight) * 0.2;
  const lowThreshold = minHeight + (maxHeight - minHeight) * 0.2;

  // Determine tide state
  let tideState = '';
  if (currentHeight >= highThreshold) {
    tideState = 'High Tide';
  } else if (currentHeight <= lowThreshold) {
    tideState = 'Low Tide';
  } else {
    tideState = 'Mid Tide';
  }

  return {
    state: tideState,
    isRising,
    currentHeight,
    minHeight,
    maxHeight,
  };
}

// Analyze tide data and format a tide summary string
function analyzeTideData(tideData, stationName, sampleTime) {
  if (!tideData || tideData.length < 2) {
    return null;
  }

  // Convert sample time to Date object with proper UTC handling
  const sampleDate = parseDateUTC(sampleTime);

  // Get detailed tide status
  const tideStatus = determineTideStatus(tideData, sampleDate);

  if (!tideStatus) {
    return null;
  }

  // Add arrow icon based on tide direction
  const directionIcon = tideStatus.isRising ? '⬆️' : '⬇️';

  // Construct the tide summary with icon and station name
  return `${tideStatus.state} – ${directionIcon} ${
    tideStatus.isRising ? 'Rising' : 'Falling'
  } (${stationName})`;
}

// Main function to enrich samples with tide data
async function enrichSamplesWithTideData(inputFilePath) {
  try {
    // Read the input file
    const rawData = fs.readFileSync(inputFilePath, 'utf8');
    const sampleData = JSON.parse(rawData);

    // Check if it's a GeoJSON file or a regular JSON array
    const isGeoJSON = sampleData.type === 'FeatureCollection' && Array.isArray(sampleData.features);
    const samples = isGeoJSON ? sampleData.features : sampleData;


    // Process each sample
    let processedCount = 0;
    let enrichedCount = 0;

    for (const sample of samples) {
      processedCount++;

      // Extract coordinates and sample time based on data format
      let lat, lon, sampleTime, properties;

      if (isGeoJSON) {
        // GeoJSON format
        lon = sample.geometry.coordinates[0];
        lat = sample.geometry.coordinates[1];
        sampleTime = sample.properties.sampleTime || sample.properties.timestamp;
        properties = sample.properties;
      } else {
        // Regular JSON format
        lat = sample.latitude || sample.lat;
        lon = sample.longitude || sample.lon;
        sampleTime = sample.sampleTime || sample.timestamp;
        properties = sample;
      }

      // Standardize sample time format if it's not already a full ISO string
      if (sampleTime && !sampleTime.includes('T')) {
        // If it's just a time like "9:02", assume it's for the sample date
        if (/^\d{1,2}:\d{2}(:\d{2})?(\s*[AP]M)?$/i.test(sampleTime)) {
          const [hours, minutes] = sampleTime
            .replace(/\s*[AP]M/i, '')
            .split(':')
            .map(Number);
          const isPM = /PM/i.test(sampleTime);

          // Get the date from the file name or a specified date
          const dateFromFilename = path.basename(inputFilePath).split('.')[0]; // e.g., "2025-05-09"

          // Use Date.UTC to create a date in UTC
          const year = parseInt(dateFromFilename.split('-')[0], 10);
          const month = parseInt(dateFromFilename.split('-')[1], 10) - 1; // 0-based months
          const day = parseInt(dateFromFilename.split('-')[2], 10);
          const adjustedHours = isPM && hours < 12 ? hours + 12 : hours;

          // Create a UTC Date directly to avoid timezone offsets
          const sampleDate = new Date(Date.UTC(year, month, day, adjustedHours, minutes));

          // Format to consistent string format
          sampleTime = formatDate(sampleDate);
          console.log(
            `Converted sample time "${hours}:${minutes}${
              isPM ? ' PM' : ''
            }" to "${sampleTime}" (UTC)`
          );
        }
      }

      if (!lat || !lon || !sampleTime) {
        continue;
      }


      // Find the nearest tide station
      const nearestStation = await findNearestTideStation(lat, lon);

      if (!nearestStation) {
        properties.tideSummary = null;
        continue;
      }


      // Get tide data for the station
      const tideData = await getTideData(nearestStation.id, sampleTime);

      if (!tideData) {
        properties.tideSummary = null;
        continue;
      }

      // Analyze the tide data
      const tideSummary = analyzeTideData(tideData, nearestStation.name, sampleTime);

      if (tideSummary) {
        properties.tideSummary = tideSummary;
        enrichedCount++;
      } else {
        properties.tideSummary = null;
      }

      // Add a small delay to avoid hitting API rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }


    // Write the updated data to output file
    const outputFilePath = inputFilePath
      .replace('.json', '.enriched.json')
      .replace('.geojson', '.enriched.geojson');
    fs.writeFileSync(outputFilePath, JSON.stringify(sampleData, null, 2), 'utf8');

  } catch (error) {
  }
}

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check for input file argument
if (process.argv.length < 3) {
  process.exit(1);
}

const inputFilePath = process.argv[2];

// Execute the main function
enrichSamplesWithTideData(inputFilePath)
  .then(() => {})
  .catch(error => {});
