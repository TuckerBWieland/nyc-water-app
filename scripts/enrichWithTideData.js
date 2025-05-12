const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Haversine distance formula to calculate distance between two lat/lon points in kilometers
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}

// Find the nearest NOAA tide station within configurable distance of the given lat/lon
async function findNearestTideStation(lat, lon) {
  try {
    // NOAA CO-OPS API endpoint for listing all stations
    const response = await fetch('https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json');
    const data = await response.json();

    if (!data.stations) {
      console.error('No stations data available from NOAA API');
      return null;
    }

    // First try with a 10km radius
    const stationWithin10km = findNearestStationWithinRadius(data.stations, lat, lon, 10);
    if (stationWithin10km) {
      console.log(`Found station within 10km radius: ${stationWithin10km.name}`);
      return stationWithin10km;
    }

    // If no station within 10km, try with a 25km radius
    console.log('No stations within 10km, expanding search to 25km...');
    const stationWithin25km = findNearestStationWithinRadius(data.stations, lat, lon, 25);
    if (stationWithin25km) {
      console.log(`Found station within extended 25km radius: ${stationWithin25km.name}`);
      return stationWithin25km;
    }

    console.log('No tide stations found within 25km radius.');
    return null;
  } catch (error) {
    console.error('Error fetching tide stations:', error);
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
        distance: distance.toFixed(2)
      };
    }
  }

  return nearestStation;
}

// Get tide data for a specific station around a specific time
async function getTideData(stationId, sampleTime) {
  try {
    // Parse the sample time
    const sampleDate = new Date(sampleTime);
    
    // Set the begin and end dates for the API call (1 hour before and after the sample time)
    const beginDate = new Date(sampleDate.getTime() - 60 * 60 * 1000);
    const endDate = new Date(sampleDate.getTime() + 60 * 60 * 1000);
    
    // Format dates for the API
    const begin = beginDate.toISOString().replace(/[:-]/g, '').split('.')[0] + 'Z';
    const end = endDate.toISOString().replace(/[:-]/g, '').split('.')[0] + 'Z';
    
    // NOAA CO-OPS API endpoint for water level data
    const url = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${stationId}&product=water_level&datum=MLLW&time_zone=GMT&units=english&format=json&date_time=true&begin_date=${begin}&end_date=${end}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      console.error(`Error from NOAA API for station ${stationId}:`, data.error);
      return null;
    }
    
    return data.data || [];
  } catch (error) {
    console.error(`Error fetching tide data for station ${stationId}:`, error);
    return null;
  }
}

// Analyze tide data to determine if tide is rising or falling, and if it's near high or low tide
function analyzeTideData(tideData, stationName, sampleTime) {
  if (!tideData || tideData.length < 2) {
    return null;
  }
  
  // Convert sample time to Date object
  const sampleDate = new Date(sampleTime);
  
  // Find the readings closest to the sample time
  let closestBefore = null;
  let secondClosestBefore = null;
  
  for (const reading of tideData) {
    const readingDate = new Date(reading.t);
    
    if (readingDate <= sampleDate) {
      if (!closestBefore || readingDate > new Date(closestBefore.t)) {
        secondClosestBefore = closestBefore;
        closestBefore = reading;
      } else if (!secondClosestBefore || readingDate > new Date(secondClosestBefore.t)) {
        secondClosestBefore = reading;
      }
    }
  }
  
  // If we don't have two readings before the sample time, we can't determine trend
  if (!closestBefore || !secondClosestBefore) {
    return null;
  }
  
  // Determine if tide is rising or falling
  const currentHeight = parseFloat(closestBefore.v);
  const previousHeight = parseFloat(secondClosestBefore.v);
  const isRising = currentHeight > previousHeight;
  
  // Determine if tide is high or low
  // Find the max and min heights in the dataset
  let maxHeight = -Infinity;
  let minHeight = Infinity;
  
  for (const reading of tideData) {
    const height = parseFloat(reading.v);
    if (height > maxHeight) maxHeight = height;
    if (height < minHeight) minHeight = height;
  }
  
  // Define thresholds for high and low tide (within 20% of max or min)
  const highThreshold = maxHeight - (maxHeight - minHeight) * 0.2;
  const lowThreshold = minHeight + (maxHeight - minHeight) * 0.2;
  
  let tideState = '';
  if (currentHeight >= highThreshold) {
    tideState = 'High Tide';
  } else if (currentHeight <= lowThreshold) {
    tideState = 'Low Tide';
  } else {
    tideState = 'Mid Tide';
  }
  
  // Construct the tide summary
  return `${tideState} – ${isRising ? 'Rising' : 'Falling'} (${stationName})`;
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
    
    console.log(`Processing ${samples.length} samples...`);
    
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
          const [hours, minutes] = sampleTime.replace(/\s*[AP]M/i, '').split(':').map(Number);
          const isPM = /PM/i.test(sampleTime);
          
          // Get the date from the file name or a specified date
          // For this example, we'll use a fixed date. Replace with your logic if needed.
          const dateFromFilename = path.basename(inputFilePath).split('.')[0]; // e.g., "2025-05-09"
          
          const sampleDate = new Date(dateFromFilename);
          sampleDate.setUTCHours(isPM && hours < 12 ? hours + 12 : hours);
          sampleDate.setUTCMinutes(minutes);
          
          sampleTime = sampleDate.toISOString();
        }
      }
      
      if (!lat || !lon || !sampleTime) {
        console.warn(`Sample #${processedCount} doesn't have valid coordinates or timestamp, skipping...`);
        continue;
      }
      
      console.log(`Processing sample #${processedCount}: ${lat}, ${lon} at ${sampleTime}`);
      
      // Find the nearest tide station
      const nearestStation = await findNearestTideStation(lat, lon);
      
      if (!nearestStation) {
        console.log(`WARNING: No tide station found within 25km of ${lat}, ${lon} - skipping sample`);
        properties.tideSummary = null;
        continue;
      }

      console.log(`SUCCESS: Using tide station: ${nearestStation.name} (${nearestStation.distance}km away)`);
      
      // Get tide data for the station
      const tideData = await getTideData(nearestStation.id, sampleTime);
      
      if (!tideData) {
        console.log(`No tide data available for station ${nearestStation.id}`);
        properties.tideSummary = null;
        continue;
      }
      
      // Analyze the tide data
      const tideSummary = analyzeTideData(tideData, nearestStation.name, sampleTime);
      
      if (tideSummary) {
        properties.tideSummary = tideSummary;
        enrichedCount++;
        console.log(`SUCCESS: Sample enriched with tide data: ${tideSummary} from ${nearestStation.name}`);
      } else {
        properties.tideSummary = null;
        console.log(`WARNING: Could not determine tide status from station ${nearestStation.name}`);
      }
      
      // Add a small delay to avoid hitting API rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\nProcessing complete: ${enrichedCount} of ${processedCount} samples enriched with tide data.`);
    
    // Write the updated data to output file
    const outputFilePath = inputFilePath.replace('.json', '.enriched.json').replace('.geojson', '.enriched.geojson');
    fs.writeFileSync(outputFilePath, JSON.stringify(sampleData, null, 2), 'utf8');
    
    console.log(`\nEnriched data saved to: ${outputFilePath}`);
    
  } catch (error) {
    console.error('Error processing samples:', error);
  }
}

// Check for input file argument
if (process.argv.length < 3) {
  console.log('Usage: node enrichWithTideData.js <path-to-sample-file.json>');
  process.exit(1);
}

const inputFilePath = process.argv[2];

// Execute the main function
enrichSamplesWithTideData(inputFilePath)
  .then(() => console.log('Processing completed successfully.'))
  .catch(error => console.error('Error during processing:', error));