import { getStations } from '@/lib/actions'
import AnalyseTabs from '@/components/AnalyseTabs'
import { BarChart3 } from 'lucide-react'

export default async function AnalysePage() {
  const stations = await getStations()

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Analyse</h1>
          <p className="text-zinc-400 text-sm mt-0.5">Tableaux de bord analytiques du réseau</p>
        </div>
      </div>
      <AnalyseTabs stations={stations} />
    </div>
  )
}
