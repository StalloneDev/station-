'use client'

import { useState } from 'react'
import SaisieForm from '@/components/SaisieForm'
import { Building2, ArrowRight } from 'lucide-react'

interface Station { id: string; name: string }
interface Product { id: string; name: string }

export default function SaisieWrapper({ stations, products }: { stations: Station[], products: Product[] }) {
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null)

  if (selectedStationId) {
    return (
      <SaisieForm 
        stations={stations} 
        products={products} 
        initialStationId={selectedStationId} 
        onBack={() => setSelectedStationId(null)}
      />
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
      {stations.map(station => (
        <div key={station.id} className="glass-card rounded-2xl p-6 flex flex-col items-center text-center shadow-lg border border-zinc-800/60 hover:border-blue-500/30 transition-all group">
          <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4 text-blue-400 group-hover:scale-110 transition-transform">
            <Building2 size={28} />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">{station.name}</h2>
          <p className="text-sm text-zinc-400 mb-6">Saisie des volumes de vente et jauges du jour</p>
          
          <button
            onClick={() => setSelectedStationId(station.id)}
            className="w-full bg-zinc-800 hover:bg-blue-600 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors border border-zinc-700 hover:border-blue-500"
          >
            Saisir <ArrowRight size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}
