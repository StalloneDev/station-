const xlsx = require('xlsx');
const path = require('path');

const filePath = 'C:\\Users\\skoukpelou\\Downloads\\My Stations\\data\\Copie de ETAT PB AVRIL 2026.xlsx';
try {
  const workbook = xlsx.readFile(filePath);
  const sheetNames = workbook.SheetNames;
  console.log("Sheet names:", sheetNames);
  
  // Read first sheet as array of arrays
  const firstSheet = workbook.Sheets[sheetNames[0]];
  const data = xlsx.utils.sheet_to_json(firstSheet, { header: 1 });
  
  // Write to a temporary file for inspection
  require('fs').writeFileSync('data-dump.json', JSON.stringify(data, null, 2));
  console.log("Wrote data-dump.json. Total rows:", data.length);
} catch (error) {
  console.error("Error reading file:", error.message);
}
