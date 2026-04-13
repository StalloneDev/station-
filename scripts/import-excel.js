const xlsx = require('xlsx');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function parseDateFromSheetName(name) {
  // Try to find the last occurrence of DD.MM.YY
  const regex = /(\d{2})\.(\d{2})\.(\d{2})/g;
  let match;
  let lastMatch;
  while ((match = regex.exec(name)) !== null) {
    lastMatch = match;
  }
  if (!lastMatch) return null;
  // Year is 20xx
  const day = parseInt(lastMatch[1], 10);
  const month = parseInt(lastMatch[2], 10) - 1; // 0-indexed in JS
  const year = 2000 + parseInt(lastMatch[3], 10);
  return new Date(year, month, day, 12, 0, 0); // Noon to avoid timezone shifts
}

async function main() {
  const filePath = 'C:\\Users\\skoukpelou\\Downloads\\My Stations\\data\\Copie de ETAT PB AVRIL 2026.xlsx';
  let workbook;
  try {
    workbook = xlsx.readFile(filePath);
  } catch (err) {
    console.error("Could not read Excel file:", err.message);
    process.exit(1);
  }

  // Ensure products exist
  const essence = await prisma.product.upsert({
    where: { name: 'Essence' },
    update: {},
    create: { name: 'Essence' },
  });
  const gasoil = await prisma.product.upsert({
    where: { name: 'Gasoil' },
    update: {},
    create: { name: 'Gasoil' },
  });

  const productIdMap = {
    'Essence': essence.id,
    'Essence ': essence.id,
    'Gasoil': gasoil.id,
    'Gasoil ': gasoil.id,
  };

  let totalImported = 0;

  for (const sheetName of workbook.SheetNames) {
    const sheetDate = parseDateFromSheetName(sheetName);
    if (!sheetDate) {
      console.log(`Skipping sheet "${sheetName}" (could not parse date)`);
      continue;
    }

    console.log(`\nImporting sheet: "${sheetName}" -> Date: ${sheetDate.toISOString().split('T')[0]}`);
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row || !row[0]) continue;

      const title = String(row[1]).trim();
      if (title === 'Volume vendu' || title === 'Ventes') {
        // Row i is header
        const stationName = String(row[0]).trim();
        
        // Ensure station exists
        const station = await prisma.station.upsert({
          where: { name: stationName },
          update: {},
          create: { name: stationName }
        });

        // Parse product rows
        for (let offset = 1; offset <= 2; offset++) {
          const prodRow = data[i + offset];
          if (!prodRow || !prodRow[0]) continue;
          
          const rawProductName = String(prodRow[0]).trim();
          const productId = productIdMap[rawProductName] || productIdMap[rawProductName + ' '];
          
          if (!productId) {
            continue; // Not a known product
          }

          const ventes = parseFloat(prodRow[1]) || 0;
          const stockOuv = parseFloat(prodRow[2]) || 0;
          const reception = parseFloat(prodRow[3]) || 0;
          const jauge = parseFloat(prodRow[5]);

          const stockFerm = stockOuv + reception - ventes;
          const ecart = !isNaN(jauge) ? jauge - stockFerm : 0;
          const tauxEcart = stockFerm > 0 ? (ecart / stockFerm) * 100 : 0;
          const flagAnomalie = Math.abs(tauxEcart) > 2;

          await prisma.dailyState.upsert({
            where: {
              date_stationId_productId: {
                date: sheetDate,
                stationId: station.id,
                productId,
              }
            },
            update: {
              stockOuverture: stockOuv,
              volumeVendu: ventes,
              reception: reception,
              stockTheoriqueFermeture: stockFerm,
              jaugeDuJour: !isNaN(jauge) ? jauge : null,
              ecart: !isNaN(jauge) ? ecart : null,
              tauxEcart: !isNaN(jauge) ? tauxEcart : null,
              flagAnomalie,
              etatValidation: 'valide'
            },
            create: {
              date: sheetDate,
              stationId: station.id,
              productId,
              stockOuverture: stockOuv,
              volumeVendu: ventes,
              reception: reception,
              stockTheoriqueFermeture: stockFerm,
              jaugeDuJour: !isNaN(jauge) ? jauge : null,
              ecart: !isNaN(jauge) ? ecart : null,
              tauxEcart: !isNaN(jauge) ? tauxEcart : null,
              flagAnomalie,
              etatValidation: 'valide'
            }
          });
          totalImported++;
        }
      }
    }
  }

  console.log(`\n✅ Import completed successfully. imported ${totalImported} daily state records.`);
}

main()
  .catch(e => {
    console.error("Fatal error during import:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
