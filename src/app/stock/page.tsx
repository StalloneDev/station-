import { getLatestStocks } from '@/lib/actions'
import { Package, Fuel, AlertCircle, CheckCircle2, Clock } from 'lucide-react'

export default async function StockPage() {
  const latestStocks = await getLatestStocks()

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Gestion des Stocks</h1>
        <p className="text-zinc-400 mt-1">État des stocks en temps réel par station</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {latestStocks.map((station) => (
          <div key={station.stationId} className="glass-card rounded-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-zinc-800/50 bg-white/5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white truncate max-w-[200px]">{station.stationName}</h2>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800">
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  station.products.every(p => p.status === 'à jour') ? 'bg-emerald-500' : 'bg-amber-500'
                }`} />
                <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">
                  {station.products.every(p => p.status === 'à jour') ? 'A jour' : 'Retard'}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-6 flex-1">
              {station.products.map((p) => (
                <div key={p.product} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${p.product === 'Essence' ? 'bg-sky-500/10 text-sky-400' : 'bg-orange-500/10 text-orange-400'}`}>
                        <Fuel size={14} />
                      </div>
                      <span className="text-sm font-semibold text-zinc-300">{p.product}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-white">{p.stockCalculé.toLocaleString('fr-FR')} L</p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">Stock Actuel</p>
                    </div>
                  </div>

                  {/* Progress Bar (Mock capacity at 30k for visual) */}
                  <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/50">
                    <div 
                      className={`h-full transition-all duration-1000 ${p.product === 'Essence' ? 'bg-sky-500' : 'bg-orange-500'}`}
                      style={{ width: `${Math.min(100, (p.stockCalculé / 30000) * 100)}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                      <p className="text-[10px] text-zinc-500 uppercase font-bold">Ouverture</p>
                      <p className="text-xs font-mono text-zinc-300">{p.stockOuverture.toLocaleString('fr-FR')} L</p>
                    </div>
                    <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                      <p className="text-[10px] text-zinc-500 uppercase font-bold">Dernière Jauge</p>
                      <p className="text-xs font-mono text-zinc-300">{p.jaugeDernière !== null ? p.jaugeDernière.toLocaleString('fr-FR') + ' L' : '—'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-zinc-900/50 border-t border-zinc-800/50 flex items-center gap-2">
              <Clock size={12} className="text-zinc-600" />
              <p className="text-[10px] text-zinc-500 italic">
                Dernière activité : {station.products[0]?.latestDate ? new Date(station.products[0].latestDate).toLocaleDateString('fr-FR') : 'Jamais'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
