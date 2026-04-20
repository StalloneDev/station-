import { getDailyStatesRange, getStations } from '@/lib/actions'
import HistoriqueFilters from '@/components/HistoriqueFilters'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ stationId?: string; startDate?: string; endDate?: string }>
}

export default async function HistoriquePage({ searchParams }: Props) {
  const params = await searchParams
  const stationId = params.stationId ?? ''

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  // Default: last 10 days
  const defaultStart = new Date(today)
  defaultStart.setDate(defaultStart.getDate() - 9)
  const defaultStartStr = defaultStart.toISOString().split('T')[0]

  const startDate = params.startDate ?? defaultStartStr
  const endDate = params.endDate ?? todayStr

  const [allStates, stations] = await Promise.all([
    getDailyStatesRange(startDate, endDate, stationId || undefined),
    getStations(),
  ])

  // Group states by date
  const dateMap: Map<string, typeof allStates> = new Map()
  allStates.forEach((s) => {
    const dateKey = (typeof s.date === 'string' ? new Date(s.date) : s.date)
      .toISOString().split('T')[0]
    if (!dateMap.has(dateKey)) dateMap.set(dateKey, [])
    dateMap.get(dateKey)!.push(s)
  })

  // Sort dates descending
  const sortedDates = Array.from(dateMap.keys()).sort((a, b) => b.localeCompare(a))

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Historique</h1>
        <p className="text-zinc-400 mt-1">Récapitulatif des états par période</p>
      </div>

      <HistoriqueFilters
        stations={stations}
        currentStation={stationId}
        currentStartDate={startDate}
        currentEndDate={endDate}
      />

      <div className="space-y-4">
        {sortedDates.length === 0 && (
          <div className="glass-card rounded-2xl p-8 text-center text-zinc-500">
            Aucun état trouvé pour cette période.
          </div>
        )}
        {sortedDates.map((date) => {
          const states = dateMap.get(date)!
          const totalVentes = states.reduce((s: number, r: any) => s + r.volumeVendu, 0)
          const anomalies = states.filter((r: any) => r.flagAnomalie).length

          return (
            <div key={date} className="glass-card rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                <div className="flex items-center gap-4">
                  <h2 className="font-semibold text-white">{formatDate(date)}</h2>
                  <span className="text-xs text-zinc-500">{states.length} enreg.</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-zinc-400">
                    Total: <strong className="text-white">{totalVentes.toLocaleString('fr-FR')} L</strong>
                  </span>
                  {anomalies > 0 && (
                    <span className="bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full text-xs">
                      {anomalies} anomalie(s)
                    </span>
                  )}
                  <a href={`/etats?date=${date}${stationId ? `&stationId=${stationId}` : ''}`}
                    className="text-blue-400 hover:text-blue-300 text-xs transition-colors">
                    Voir détail →
                  </a>
                </div>
              </div>
              <div className="overflow-x-auto w-full">
                <table className="w-full text-xs whitespace-nowrap">
                  <thead>
                    <tr className="text-zinc-600 border-b border-zinc-800/50">
                      <th className="px-4 py-2 text-left">Station</th>
                      <th className="px-4 py-2 text-left">Produit</th>
                      <th className="px-4 py-2 text-right">Vendu (L)</th>
                      <th className="px-4 py-2 text-right">Jauge</th>
                      <th className="px-4 py-2 text-right">Écart</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/30">
                    {states.map((s: any) => (
                      <tr key={s.id} className="hover:bg-zinc-800/20 transition-colors">
                        <td className="px-4 py-2 text-zinc-300 max-w-[160px] truncate">{s.station.name}</td>
                        <td className="px-4 py-2 text-zinc-500">{s.product.name}</td>
                        <td className="px-4 py-2 text-right text-white font-medium">{s.volumeVendu.toLocaleString('fr-FR')}</td>
                        <td className="px-4 py-2 text-right text-amber-300">{s.jaugeDuJour?.toLocaleString('fr-FR') ?? '—'}</td>
                        <td className={`px-4 py-2 text-right font-medium ${s.flagAnomalie ? 'text-red-400' : 'text-zinc-500'}`}>
                          {s.ecart?.toFixed(1) ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function formatDate(d: string) {
  const date = new Date(d + 'T12:00:00')
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}
