const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Stations autorisées - seules celles-ci seront importées
const ALLOWED_STATIONS = new Set([
  'MRS AKPAKPA/JENN SERVICE',
  'MRS FIDJROSSE/JENN SERVICE',
  'CORLAY FIDJROSSE/IMPERIAL GROUP',
  'MRS STE RITA/ ISHOLA SERVICES ET FILS',
  'CORLAY VEDOKO/ GESTION DIRECTE',
  'CORLAY GODOMEY/AGICOP',
  'MRS COCOTOMEY/ JENN SERVICES',
  'MRS PARAKOU 1/ JENN SERVICE',
  'MRS CALAVI KPOTA/ JENN SERVICE',
  'MRS TANGUIETA/ ISHOLA SERVICE',
  'MRS OUIDAH/ GD',
  'MRS PARAKOU2/ KASAANF SARL',
  'CORLAY ARCONVILLE/SITRAC',
  'MRS DASSA/ ISHOLA SERVICE'
]);

/**
 * Parse all dates from a sheet name.
 * "DU 01.04.26"               -> [2026-04-01]
 * "DU 03.04.26 AU 06.04.26"   -> [2026-04-03, ..., 2026-04-06]  (inclusive range)
 */
function parseDatesFromSheetName(name) {
  const regex = /(\d{2})\.(\d{2})\.(\d{2})/g;
  const dates = [];
  let match;
  while ((match = regex.exec(name)) !== null) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const year = 2000 + parseInt(match[3], 10);
    dates.push(new Date(year, month, day, 12, 0, 0));
  }
  if (dates.length === 0) return [];
  if (dates.length === 1) return [dates[0]];

  // Range: expand all days between first and last date
  const [start, end] = [dates[0], dates[dates.length - 1]];
  const range = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    range.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return range;
}

async function main() {
  const filePath = 'C:\\Users\\skoukpelou\\Downloads\\My Stations\\data\\ETAT PB AVRIL 2026.xlsx';
  
  let workbook;
  try {
    workbook = xlsx.readFile(filePath);
  } catch (err) {
    console.error('❌ Could not read Excel file:', err.message);
    process.exit(1);
  }

  console.log(`📂 Fichier lu : ${filePath}`);
  console.log(`📋 Feuilles trouvées : ${workbook.SheetNames.join(', ')}\n`);

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
    'Gasoil': gasoil.id,
  };

  let totalImported = 0;
  let totalSkipped = 0;

  for (const sheetName of workbook.SheetNames) {
    const dates = parseDatesFromSheetName(sheetName);
    if (dates.length === 0) {
      console.log(`⏭️  Feuille ignorée : "${sheetName}" (pas de date parsable)`);
      continue;
    }

    const dateStr = dates.map(d => d.toISOString().split('T')[0]).join(' → ');
    console.log(`\n📅 Feuille : "${sheetName}" → Dates : ${dateStr}`);

    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    // Find station blocks  
    const stationBlocks = [];
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row || !row[0]) continue;
      const secondCol = row[1] ? String(row[1]).trim() : '';
      if (['Volume vendu', 'Ventes', 'Stock Ouv', 'Volume'].includes(secondCol)) {
        stationBlocks.push(i);
      }
    }

    for (const headerIdx of stationBlocks) {
      const stationName = String(data[headerIdx][0]).trim();
      
      if (!ALLOWED_STATIONS.has(stationName)) {
        console.log(`   ⚠️  Station non reconnue, ignorée : "${stationName}"`);
        totalSkipped++;
        continue;
      }

      // Ensure station exists in DB
      const station = await prisma.station.upsert({
        where: { name: stationName },
        update: {},
        create: { name: stationName }
      });

      // Process up to 2 product rows after the header
      for (let offset = 1; offset <= 2; offset++) {
        const prodRow = data[headerIdx + offset];
        if (!prodRow || !prodRow[0]) continue;

        const rawProductName = String(prodRow[0]).trim();
        const productId = productIdMap[rawProductName];
        if (!productId) continue;

        const volumeVendu = parseFloat(prodRow[1]) || 0;
        const stockOuverture = parseFloat(prodRow[2]) || 0;
        const reception = isNaN(parseFloat(prodRow[3])) ? 0 : parseFloat(prodRow[3]);
        const jaugeRaw = parseFloat(prodRow[5]);
        const jaugeDuJour = isNaN(jaugeRaw) ? null : jaugeRaw;

        const stockFerm = stockOuverture + reception - volumeVendu;
        const ecart = jaugeDuJour !== null ? jaugeDuJour - stockFerm : null;
        const tauxEcart = ecart !== null && stockFerm > 0 ? (ecart / stockFerm) * 100 : null;
        const flagAnomalie = tauxEcart !== null && Math.abs(tauxEcart) > 0.5;

        // Import for each date in the sheet range
        for (const date of dates) {
          await prisma.dailyState.upsert({
            where: {
              date_stationId_productId: { date, stationId: station.id, productId }
            },
            update: {
              stockOuverture,
              volumeVendu,
              reception,
              stockTheoriqueFermeture: stockFerm,
              jaugeDuJour,
              ecart,
              tauxEcart,
              flagAnomalie,
              etatValidation: 'valide'
            },
            create: {
              date,
              stationId: station.id,
              productId,
              stockOuverture,
              volumeVendu,
              reception,
              stockTheoriqueFermeture: stockFerm,
              jaugeDuJour,
              ecart,
              tauxEcart,
              flagAnomalie,
              etatValidation: 'valide'
            }
          });
          totalImported++;
          console.log(`   ✅ ${stationName} | ${rawProductName} | ${date.toISOString().split('T')[0]} | Vol:${volumeVendu} Rec:${reception} Jauge:${jaugeDuJour ?? '—'} Écart:${ecart?.toFixed(2) ?? '—'}`);
        }
      }
    }
  }

  console.log(`\n🎉 Import terminé : ${totalImported} enregistrement(s) importé(s), ${totalSkipped} station(s) ignorée(s).`);
}

main()
  .catch(e => {
    console.error('❌ Erreur fatale :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
