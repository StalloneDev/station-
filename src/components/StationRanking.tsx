'use client'

import { AlertTriangle } from 'lucide-react'

interface Station { name: string; ventes: number; anomalies: number }

export default function StationRanking({ stations }: { stations: Station[] }) {
  if (stations.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-zinc-600 text-sm">
        Aucune donnée pour aujourd'hui
      </div>
    )
  }

  const max = stations[0]?.ventes ?? 1

  return (
    <div className="space-y-3">
      {stations.slice(0, 6).map((s, idx) => (
        <div key={s.name} className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-zinc-600 font-mono text-xs w-5">{idx + 1}</span>
              <span className="text-zinc-300 font-medium truncate max-w-[120px]">{s.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {s.anomalies > 0 && (
                <AlertTriangle className="w-3 h-3 text-amber-400" />
              )}
              <span className="text-zinc-400 text-xs">{s.ventes.toLocaleString('fr-FR')} L</span>
            </div>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${max > 0 ? (s.ventes / max) * 100 : 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
