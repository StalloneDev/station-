import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'

const prisma = new PrismaClient()

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
  'MRS DASSA/ ISHOLA SERVICE',
])

const HEADER_KEYWORDS = ['Volume vendu', 'Ventes', 'Stock Ouv', 'Volume']

function parseDatesFromSheetName(name: string): Date[] {
  const regex = /(\d{2})\.(\d{2})\.(\d{2})/g
  const dates: Date[] = []
  let match: RegExpExecArray | null
  while ((match = regex.exec(name)) !== null) {
    const day = parseInt(match[1], 10)
    const month = parseInt(match[2], 10) - 1
    const year = 2000 + parseInt(match[3], 10)
    dates.push(new Date(year, month, day, 12, 0, 0))
  }
  if (dates.length === 0) return []
  if (dates.length === 1) return [dates[0]]

  // Expand range
  const [start, end] = [dates[0], dates[dates.length - 1]]
  const range: Date[] = []
  const cursor = new Date(start)
  while (cursor <= end) {
    range.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return range
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni.' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['xlsx', 'xls'].includes(ext ?? '')) {
      return NextResponse.json({ error: 'Format invalide. Seuls .xlsx et .xls sont acceptés.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: 'buffer' })

    // Ensure products exist
    const essence = await prisma.product.upsert({
      where: { name: 'Essence' }, update: {}, create: { name: 'Essence' },
    })
    const gasoil = await prisma.product.upsert({
      where: { name: 'Gasoil' }, update: {}, create: { name: 'Gasoil' },
    })
    const productIdMap: Record<string, string> = {
      'Essence': essence.id,
      'Gasoil': gasoil.id,
    }

    let totalImported = 0
    const skippedStations = new Set<string>()
    const sheetsProcessed: string[] = []

    for (const sheetName of workbook.SheetNames) {
      const dates = parseDatesFromSheetName(sheetName)
      if (dates.length === 0) continue

      sheetsProcessed.push(sheetName)
      const sheet = workbook.Sheets[sheetName]
      const data = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, { header: 1 })

      // Find header rows (station blocks)
      for (let i = 0; i < data.length; i++) {
        const row = data[i]
        if (!row || !row[0]) continue
        const secondCol = row[1] ? String(row[1]).trim() : ''
        if (!HEADER_KEYWORDS.includes(secondCol)) continue

        const stationName = String(row[0]).trim()
        if (!ALLOWED_STATIONS.has(stationName)) {
          skippedStations.add(stationName)
          continue
        }

        const station = await prisma.station.upsert({
          where: { name: stationName }, update: {}, create: { name: stationName }
        })

        for (let offset = 1; offset <= 2; offset++) {
          const prodRow = data[i + offset]
          if (!prodRow || !prodRow[0]) continue

          const rawProductName = String(prodRow[0]).trim()
          const productId = productIdMap[rawProductName]
          if (!productId) continue

          const volumeVendu = parseFloat(String(prodRow[1])) || 0
          const stockOuverture = parseFloat(String(prodRow[2])) || 0
          const reception = isNaN(parseFloat(String(prodRow[3]))) ? 0 : parseFloat(String(prodRow[3]))
          const jaugeRaw = parseFloat(String(prodRow[5]))
          const jaugeDuJour = isNaN(jaugeRaw) ? null : jaugeRaw

          const stockFerm = stockOuverture + reception - volumeVendu
          const ecart = jaugeDuJour !== null ? jaugeDuJour - stockFerm : null
          const tauxEcart = ecart !== null && stockFerm > 0 ? (ecart / stockFerm) * 100 : null
          const flagAnomalie = tauxEcart !== null && Math.abs(tauxEcart) > 0.5

          for (const date of dates) {
            await prisma.dailyState.upsert({
              where: {
                date_stationId_productId: { date, stationId: station.id, productId }
              },
              update: {
                stockOuverture, volumeVendu, reception,
                stockTheoriqueFermeture: stockFerm,
                jaugeDuJour, ecart, tauxEcart, flagAnomalie,
                etatValidation: 'valide'
              },
              create: {
                date, stationId: station.id, productId,
                stockOuverture, volumeVendu, reception,
                stockTheoriqueFermeture: stockFerm,
                jaugeDuJour, ecart, tauxEcart, flagAnomalie,
                etatValidation: 'valide'
              }
            })
            totalImported++
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      imported: totalImported,
      sheets: sheetsProcessed.length,
      skippedStations: Array.from(skippedStations),
    })
  } catch (err) {
    console.error('Import error:', err)
    return NextResponse.json({ error: 'Erreur lors du traitement du fichier.' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
