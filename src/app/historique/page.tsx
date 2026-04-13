import { getDailyStatesRange, getStations } from '@/lib/actions'
import HistoriqueFilters from '@/components/HistoriqueFilters'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ stationId?: string; limit?: string }>
}

export default async function HistoriquePage({ searchParams }: Props) {
  const params = await searchParams
  const stationId = params.stationId ?? ''
  const limit = parseInt(params.limit ?? '10', 10)
  const stations = await getStations()

  const today = new Date()
  const dates: string[] = []
  for (let i = 0; i < limit; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().split('T')[0])
  }

  const startDate = dates[dates.length - 1]
  const endDate = dates[0]
  const allStates = await getDailyStatesRange(startDate, endDate, stationId || undefined)

  const allDays = dates.map((d) => {
    const targetStart = new Date(d)
    targetStart.setHours(0, 0, 0, 0)
    const targetEnd = new Date(d)
    targetEnd.setHours(23, 59, 59, 999)

    const states = allStates.filter((s: any) => {
      const sDate = typeof s.date === 'string' ? new Date(s.date) : s.date
      return sDate >= targetStart && sDate <= targetEnd
    })

    return { date: d, states }
  })

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Historique</h1>
        <p className="text-zinc-400 mt-1">Récapitulatif des 10 derniers jours</p>
      </div>

      <HistoriqueFilters stations={stations} currentStation={stationId} />

      <div className="space-y-4">
        {allDays.map(({ date, states }) => {
          if (states.length === 0) return null
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

      <div className="flex justify-center mt-6">
        <Link 
          href={`/historique?limit=${limit + 10}${stationId ? `&stationId=${stationId}` : ''}`}
          scroll={false}
          className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2.5 rounded-xl transition-colors text-sm font-medium border border-zinc-700 shadow-sm flex items-center gap-2"
        >
          Charger les jours précédents
        </Link>
      </div>
    </div>
  )
}

function formatDate(d: string) {
  const date = new Date(d + 'T12:00:00')
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}
