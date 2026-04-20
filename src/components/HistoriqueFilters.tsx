'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Filter } from 'lucide-react'

interface Station { id: string; name: string }

interface HistoriqueFiltersProps {
  stations: Station[]
  currentStation: string
  currentStartDate: string
  currentEndDate: string
}

function HistoriqueFiltersInner({ stations, currentStation, currentStartDate, currentEndDate }: HistoriqueFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/historique?${params.toString()}`)
  }

  return (
    <div className="glass-card rounded-2xl p-4 flex items-center gap-4 flex-wrap">
      <Filter className="w-4 h-4 text-zinc-500 flex-shrink-0" />
      <label className="text-sm text-zinc-400 font-medium flex-shrink-0">Du :</label>
      <input
        type="date"
        defaultValue={currentStartDate}
        onChange={(e) => update('startDate', e.target.value)}
        className="input-field max-w-[180px]"
      />
      <label className="text-sm text-zinc-400 font-medium flex-shrink-0">Au :</label>
      <input
        type="date"
        defaultValue={currentEndDate}
        onChange={(e) => update('endDate', e.target.value)}
        className="input-field max-w-[180px]"
      />
      <label className="text-sm text-zinc-400 font-medium flex-shrink-0">Station :</label>
      <select
        defaultValue={currentStation}
        onChange={(e) => update('stationId', e.target.value)}
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

export default function HistoriqueFilters(props: HistoriqueFiltersProps) {
  return (
    <Suspense fallback={<div className="glass-card rounded-2xl p-4 text-zinc-500 text-sm">Chargement des filtres…</div>}>
      <HistoriqueFiltersInner {...props} />
    </Suspense>
  )
}
