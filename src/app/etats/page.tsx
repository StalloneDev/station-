import { getDailyStatesRange, getStations } from '@/lib/actions'
import EtatsTable from '@/components/EtatsTable'
import ExportButton from '@/components/ExportButton'
import EtatsFilters from '@/components/EtatsFilters'

interface Props {
  searchParams: Promise<{ date?: string; endDate?: string; stationId?: string }>
}

export default async function EtatsPage({ searchParams }: Props) {
  const params = await searchParams
  const today = new Date().toISOString().split('T')[0]
  const date = params.date ?? today
  const endDate = params.endDate ?? date  // defaults to same day (single day view)
  const stationId = params.stationId ?? ''

  const [states, stations] = await Promise.all([
    getDailyStatesRange(date, endDate, stationId || undefined),
    getStations(),
  ])

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">États journaliers</h1>
          <p className="text-zinc-400 mt-1">Consultez et filtrez les états de ventes par période</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton startDate={date} endDate={endDate} stationId={stationId} />
        </div>
      </div>

      <EtatsFilters
        stations={stations}
        currentDate={date}
        currentEndDate={endDate}
        currentStation={stationId}
      />

      <EtatsTable states={states} />
    </div>
  )
}
