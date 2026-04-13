'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Filter } from 'lucide-react'

interface Station { id: string; name: string }

function HistoriqueFiltersInner({ stations, currentStation }: { stations: Station[]; currentStation: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function update(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set('stationId', value)
    else params.delete('stationId')
    router.push(`/historique?${params.toString()}`)
  }

  return (
    <div className="glass-card rounded-2xl p-4 flex items-center gap-4 flex-wrap">
      <Filter className="w-4 h-4 text-zinc-500 flex-shrink-0" />
      <label className="text-sm text-zinc-400 font-medium flex-shrink-0">Station :</label>
      <select
        defaultValue={currentStation}
        onChange={(e) => update(e.target.value)}
        className="input-field max-w-xs"
      >
        <option value="">Toutes les stations</option>
        {stations.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
    </div>
  )
}

export default function HistoriqueFilters({ stations, currentStation }: { stations: Station[]; currentStation: string }) {
  return (
    <Suspense fallback={<div className="glass-card rounded-2xl p-4 text-zinc-500 text-sm">Chargement des filtres…</div>}>
      <HistoriqueFiltersInner stations={stations} currentStation={currentStation} />
    </Suspense>
  )
}
