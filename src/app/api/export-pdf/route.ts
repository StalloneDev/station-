import { NextRequest, NextResponse } from 'next/server'
import { getStatesForExport } from '@/lib/actions'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate') ?? new Date().toISOString().split('T')[0]
  const endDate = searchParams.get('endDate') ?? startDate
  const stationId = searchParams.get('stationId') ?? undefined

  const states = await getStatesForExport(startDate, endDate, stationId)

  // Group by station
  const byStation: Record<string, typeof states> = {}
  states.forEach((s) => {
    const name = s.station.name
    if (!byStation[name]) byStation[name] = []
    byStation[name].push(s)
  })

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const formatNum = (n: number | null | undefined) => {
    if (n === null || n === undefined) return '—'
    return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const stationBlocks = Object.entries(byStation).map(([stationName, stateList]) => {
    const rows = stateList.map((s) => {
      const anomaly = s.flagAnomalie
      return `
        <tr class="${anomaly ? 'anomaly' : ''}">
          <td>${formatDate(s.date)}</td>
          <td>${s.product.name}</td>
          <td class="num">${formatNum(s.stockOuverture)}</td>
          <td class="num">${formatNum(s.volumeVendu)}</td>
          <td class="num">${formatNum(s.reception)}</td>
          <td class="num">${formatNum(s.stockTheoriqueFermeture)}</td>
          <td class="num">${formatNum(s.jaugeDuJour)}</td>
          <td class="num ${s.ecart && s.ecart < 0 ? 'neg' : ''}">${formatNum(s.ecart)}</td>
          <td class="num">${s.tauxEcart != null ? s.tauxEcart.toFixed(2) + '%' : '—'}</td>
          <td class="${anomaly ? 'badge-anomaly' : 'badge-ok'}">${anomaly ? 'Anomalie' : 'Normal'}</td>
          <td>${s.observation ?? ''}</td>
        </tr>
      `
    }).join('')

    // Station totals
    const stStockOuv = stateList.reduce((acc, s) => acc + s.stockOuverture, 0)
    const stVolVen = stateList.reduce((acc, s) => acc + s.volumeVendu, 0)
    const stRec = stateList.reduce((acc, s) => acc + s.reception, 0)
    const stStockFer = stateList.reduce((acc, s) => acc + s.stockTheoriqueFermeture, 0)
    const stJauge = stateList.reduce((acc, s) => acc + (s.jaugeDuJour ?? 0), 0)
    const stEcart = stateList.reduce((acc, s) => acc + (s.ecart ?? 0), 0)
    const stTaux = stStockFer > 0 ? (stEcart / stStockFer) * 100 : 0

    return `
      <div class="station-block">
        <h2 class="station-title">📍 Station : ${stationName}</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Produit</th>
              <th>Stk. Ouv.</th>
              <th>Vol. Vendu</th>
              <th>Réception</th>
              <th>Stk. Ferm.</th>
              <th>Jauge</th>
              <th>Écart</th>
              <th>Taux Écart</th>
              <th>Statut</th>
              <th>Observation</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="2">TOTAL ${stationName}</td>
              <td class="num">${formatNum(stStockOuv)}</td>
              <td class="num">${formatNum(stVolVen)}</td>
              <td class="num">${formatNum(stRec)}</td>
              <td class="num">${formatNum(stStockFer)}</td>
              <td class="num">${formatNum(stJauge)}</td>
              <td class="num ${stEcart < 0 ? 'neg' : ''}">${formatNum(stEcart)}</td>
              <td class="num">${stTaux.toFixed(2)}%</td>
              <td colspan="2"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    `
  }).join('')

  const periodLabel = startDate === endDate
    ? `du ${startDate}`
    : `du ${startDate} au ${endDate}`

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>États journaliers – ${periodLabel}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1a1a2e; background: #fff; padding: 20px; }
    header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #1a73e8; padding-bottom: 12px; margin-bottom: 20px; }
    .logo { font-size: 20px; font-weight: 800; color: #1a73e8; letter-spacing: 1px; }
    .period { font-size: 12px; color: #555; text-align: right; }
    .period strong { display: block; font-size: 14px; color: #1a1a2e; }
    .station-block { margin-bottom: 32px; break-inside: avoid; }
    .station-title { font-size: 13px; font-weight: 700; color: #0d47a1; background: #e8f0fe; padding: 6px 12px; border-left: 4px solid #1a73e8; margin-bottom: 8px; border-radius: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    thead tr { background: #1a73e8; color: white; }
    thead th { padding: 6px 8px; text-align: left; font-weight: 600; }
    tbody tr { border-bottom: 1px solid #e0e0e0; }
    tbody tr:hover { background: #f5f7ff; }
    tbody tr.anomaly { background: #fff8e1; }
    td { padding: 5px 8px; vertical-align: middle; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .neg { color: #c62828; font-weight: 600; }
    .badge-anomaly { color: #e65100; font-weight: 700; }
    .badge-ok { color: #2e7d32; font-weight: 600; }
    .total-row { background: #f8f9fa; font-weight: 800; border-top: 2px solid #dee2e6; }
    footer { margin-top: 24px; border-top: 1px solid #e0e0e0; padding-top: 10px; font-size: 10px; color: #888; text-align: center; }
    @media print {
      body { padding: 0; }
      .station-block { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <header>
    <div class="logo">⛽ MY STATIONS</div>
    <div class="period">
      <span>États journaliers</span>
      <strong>Période : ${periodLabel}</strong>
    </div>
  </header>

  ${stationBlocks || '<p style="text-align:center;color:#999;margin-top:40px;">Aucun état trouvé pour cette période.</p>'}

  <footer>Document généré le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} — MY STATIONS Dashboard</footer>

  <script>window.onload = () => window.print();</script>
</body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}
