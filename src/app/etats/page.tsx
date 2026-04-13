import { getDailyStatesForDate, getStations } from '@/lib/actions'
import EtatsTable from '@/components/EtatsTable'
import ExportButton from '@/components/ExportButton'
import EtatsFilters from '@/components/EtatsFilters'

interface Props {
  searchParams: Promise<{ date?: string; stationId?: string }>
}

export default async function EtatsPage({ searchParams }: Props) {
  const params = await searchParams
  const today = new Date().toISOString().split('T')[0]
  const date = params.date ?? today
  const stationId = params.stationId ?? ''

  const [states, stations] = await Promise.all([
    getDailyStatesForDate(date, stationId || undefined),
    getStations(),
  ])

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">États journaliers</h1>
          <p className="text-zinc-400 mt-1">Consultez et filtrez les états de ventes par date</p>
        </div>
        <ExportButton date={date} />
      </div>

      <EtatsFilters stations={stations} currentDate={date} currentStation={stationId} />

      <EtatsTable states={states} />
    </div>
  )
}
