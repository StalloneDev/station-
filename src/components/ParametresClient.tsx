'use client'

import { useState, useTransition } from 'react'
import { createStation, deleteStation } from '@/lib/actions'
import { Plus, Trash2, Building2, Fuel, Loader2 } from 'lucide-react'

interface Station { id: string; name: string }
interface Product { id: string; name: string }

export default function ParametresClient({ stations, products }: { stations: Station[]; products: Product[] }) {
  const [newStation, setNewStation] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleAddStation(e: React.FormEvent) {
    e.preventDefault()
    if (!newStation.trim()) return
    startTransition(async () => {
      await createStation(newStation.trim())
      setNewStation('')
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Supprimer cette station ?')) return
    startTransition(async () => {
      await deleteStation(id)
    })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
      {/* Stations */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-400" />
          <h2 className="font-semibold text-white">Stations</h2>
          <span className="ml-auto text-xs text-zinc-600">{stations.length} station(s)</span>
        </div>

        <form onSubmit={handleAddStation} className="flex gap-2">
          <input
            type="text"
            value={newStation}
            onChange={(e) => setNewStation(e.target.value)}
            placeholder="Nom de la station..."
            className="input-field flex-1"
          />
          <button
            type="submit"
            disabled={isPending || !newStation.trim()}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white px-3 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Ajouter
          </button>
        </form>

        <ul className="space-y-1 max-h-96 overflow-y-auto">
          {stations.map((s) => (
            <li key={s.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-zinc-800/40 hover:bg-zinc-800/70 transition-colors group">
              <span className="text-zinc-300 text-sm">{s.name}</span>
              <button
                onClick={() => handleDelete(s.id)}
                className="text-zinc-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                disabled={isPending}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
          {stations.length === 0 && (
            <li className="text-zinc-600 text-sm text-center py-4">Aucune station enregistrée</li>
          )}
        </ul>
      </div>

      {/* Products (read-only) */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Fuel className="w-5 h-5 text-orange-400" />
          <h2 className="font-semibold text-white">Produits</h2>
          <span className="ml-auto text-xs text-zinc-600">{products.length} produit(s)</span>
        </div>
        <p className="text-xs text-zinc-600">Les produits sont gérés par l'administrateur.</p>
        <ul className="space-y-1">
          {products.map((p) => (
            <li key={p.id} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-zinc-800/40">
              <div className={`w-2 h-2 rounded-full ${p.name === 'Essence' ? 'bg-sky-400' : 'bg-orange-400'}`} />
              <span className="text-zinc-300 text-sm">{p.name}</span>
            </li>
          ))}
          {products.length === 0 && (
            <li className="text-zinc-600 text-sm text-center py-4">Aucun produit. <br/>
              <a href="/api/seed" className="text-blue-400 hover:underline">Initialiser les données →</a>
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}
