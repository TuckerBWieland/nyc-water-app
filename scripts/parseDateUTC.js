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
    }
  }
  
  // Default to standard Date constructor for all other formats
  return new Date(dateString);
}

console.log("Testing parseDateUTC function");
console.log("Original date: 2025-05-09 08:30");
console.log("Parsed as UTC:", parseDateUTC("2025-05-09 08:30"));
console.log("Regular Date constructor:", new Date("2025-05-09 08:30"));