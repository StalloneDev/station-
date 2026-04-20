import { getStations, getProducts } from '@/lib/actions'
import { getSession } from '@/lib/session'
import SaisieWrapper from '@/components/SaisieWrapper'
import { format, subDays } from 'date-fns'
import { fr } from 'date-fns/locale'

export default async function SaisiePage() {
  const [stations, products, session] = await Promise.all([
    getStations(),
    getProducts(),
    getSession(),
  ])

  const isManager = session?.role === 'manager'
  const sessionStationId = session?.stationId as string | null ?? null

  // For the manager, find the station name from the session
  const managerStation = isManager && sessionStationId
    ? stations.find((s) => s.id === sessionStationId) ?? null
    : null

  const today = new Date()
  const yesterday = subDays(today, 1)

  const todayStr = format(today, 'dd / MM / yyyy', { locale: fr })
  const yesterdayStr = format(yesterday, 'dd / MM / yyyy', { locale: fr })

  const pageTitle = managerStation ? managerStation.name : 'Saisie journalière'
  const pageSubtitle = `Nous somme le : ${todayStr}`
  const pageHint = `Veuillez renseigner les informations de la veille (du ${yesterdayStr})`

  return (
    <div className="p-8 h-full flex flex-col items-center justify-start min-h-[calc(100vh-4rem)]">
      <div className="w-full max-w-5xl space-y-6">
        <div className="text-center md:text-left mb-8">
          <h1 className="text-3xl font-bold text-white">{pageTitle}</h1>
          <p className="text-zinc-400 mt-1">{pageSubtitle}</p>
          <p className="text-zinc-500 text-sm mt-1">{pageHint}</p>
        </div>
        <SaisieWrapper
          stations={stations}
          products={products}
          isManager={isManager}
          managerStationId={sessionStationId}
        />
      </div>
    </div>
  )
}
