import { NextRequest, NextResponse } from 'next/server'
import { getStatesForExport } from '@/lib/actions'
import ExcelJS from 'exceljs'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate') ?? new Date().toISOString().split('T')[0]
  const endDate = searchParams.get('endDate') ?? startDate
  const stationId = searchParams.get('stationId') ?? undefined

  const states = await getStatesForExport(startDate, endDate, stationId)

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'My Stations App'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('États Ventes')

  // Header styling
  const headerFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1a73e8' },
  }
  const headerFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }

  // Columns
  sheet.columns = [
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Station', key: 'station', width: 28 },
    { header: 'Produit', key: 'produit', width: 12 },
    { header: 'Stk. Ouverture', key: 'stockOuv', width: 15 },
    { header: 'Vol. Vendu (L)', key: 'vendu', width: 15 },
    { header: 'Réception (L)', key: 'reception', width: 15 },
    { header: 'Stk. Fermeture', key: 'stockFerm', width: 15 },
    { header: 'Jauge du jour', key: 'jauge', width: 15 },
    { header: 'Écart', key: 'ecart', width: 12 },
    { header: 'Taux écart %', key: 'tauxEcart', width: 13 },
    { header: 'Anomalie', key: 'anomalie', width: 11 },
    { header: 'Observation', key: 'observation', width: 30 },
    { header: 'Validation', key: 'validation', width: 12 },
  ]

  // Style header row
  const headerRow = sheet.getRow(1)
  headerRow.eachCell((cell) => {
    cell.fill = headerFill
    cell.font = headerFont
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FF0d47a1' } },
    }
  })
  headerRow.height = 22

  // Organize data by station
  states.sort((a, b) => {
    const sCmp = a.station.name.localeCompare(b.station.name)
    if (sCmp !== 0) return sCmp
    return a.date.getTime() - b.date.getTime()
  })

  // Data rows with grouping
  let currentStation = ''

  states.forEach((s) => {
    if (s.station.name !== currentStation) {
      if (currentStation !== '') {
        sheet.addRow([]) // empty row separator
      }
      currentStation = s.station.name
      
      const titleRow = sheet.addRow(['ETAT DES VENTES STATION :', currentStation])
      titleRow.height = 24
      titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: 'FF0d47a1' } }
      titleRow.getCell(2).font = { bold: true, size: 14, color: { argb: 'FF1a73e8' } }
      sheet.mergeCells(`A${titleRow.number}:B${titleRow.number}`)
      
      // We also repeat header if needed or just let the main header stay at the top. The user's reference file doesn't seem to repeat the formal column headers, just adds a separation title. 
    }

    const row = sheet.addRow({
      date: s.date.toISOString().split('T')[0],
      station: s.station.name,
      produit: s.product.name,
      stockOuv: s.stockOuverture,
      vendu: s.volumeVendu,
      reception: s.reception,
      stockFerm: s.stockTheoriqueFermeture,
      jauge: s.jaugeDuJour ?? '',
      ecart: s.ecart ?? '',
      tauxEcart: s.tauxEcart ? +s.tauxEcart.toFixed(2) : '',
      anomalie: s.flagAnomalie ? 'Oui' : 'Non',
      observation: s.observation ?? '',
      validation: s.etatValidation,
    })

    // Zebra striping per generic state parity isn't as useful if grouped by station, but we can do a subtle background based on row index.
    if (row.number % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4FF' } }
      })
    }

    // Anomaly highlights
    if (s.flagAnomalie) {
      const anomalieCell = row.getCell('anomalie')
      anomalieCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } }
      anomalieCell.font = { color: { argb: 'FFD97706' }, bold: true }
    }

    row.height = 18
  })

  // Auto-filter
  sheet.autoFilter = { from: 'A1', to: 'M1' }

  // Build filename
  const dateRange = startDate === endDate
    ? `Etat_Ventes_Stations_${startDate}`
    : `Etat_Ventes_Stations_${startDate}_au_${endDate}`

  const buffer = await workbook.xlsx.writeBuffer()

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${dateRange}.xlsx"`,
    },
  })
}
