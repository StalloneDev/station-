'use client'

import { AlertTriangle, CheckCircle2 } from 'lucide-react'

interface DailyState {
  id: string
  date: Date
  stockOuverture: number
  volumeVendu: number
  reception: number
  stockTheoriqueFermeture: number
  jaugeDuJour: number | null
  ecart: number | null
  tauxEcart: number | null
  observation: string | null
  flagAnomalie: boolean
  etatValidation: string
  station: { name: string }
  product: { name: string }
}

export default function EtatsTable({ states }: { states: DailyState[] }) {
  if (states.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center">
        <p className="text-zinc-500">Aucun état enregistré pour cette date.</p>
        <p className="text-zinc-600 text-sm mt-1">Utilisez la page "Saisie journalière" pour ajouter des données.</p>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400">
              <th className="px-4 py-3 text-left font-medium">Station</th>
              <th className="px-4 py-3 text-left font-medium">Produit</th>
              <th className="px-4 py-3 text-right font-medium">Stk. Ouv.</th>
              <th className="px-4 py-3 text-right font-medium">Volume Vendu</th>
              <th className="px-4 py-3 text-right font-medium">Réception</th>
              <th className="px-4 py-3 text-right font-medium">Stk. Ferm.</th>
              <th className="px-4 py-3 text-right font-medium">Jauge</th>
              <th className="px-4 py-3 text-right font-medium">Écart</th>
              <th className="px-4 py-3 text-right font-medium">Taux %</th>
              <th className="px-4 py-3 text-center font-medium">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {states.map((s) => (
              <tr key={s.id} className={`hover:bg-zinc-800/30 transition-colors ${s.flagAnomalie ? 'bg-amber-500/5' : ''}`}>
                <td className="px-4 py-3 text-white font-medium max-w-[140px] truncate">{s.station.name}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${s.product.name === 'Essence' ? 'bg-sky-500/20 text-sky-300' : 'bg-orange-500/20 text-orange-300'}`}>
                    {s.product.name}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-zinc-300">{s.stockOuverture.toLocaleString('fr-FR')}</td>
                <td className="px-4 py-3 text-right text-white font-semibold">{s.volumeVendu.toLocaleString('fr-FR')}</td>
                <td className="px-4 py-3 text-right text-zinc-400">{s.reception.toLocaleString('fr-FR')}</td>
                <td className="px-4 py-3 text-right text-zinc-300">{s.stockTheoriqueFermeture.toLocaleString('fr-FR')}</td>
                <td className="px-4 py-3 text-right text-amber-300 font-semibold">
                  {s.jaugeDuJour !== null ? s.jaugeDuJour.toLocaleString('fr-FR') : '—'}
                </td>
                <td className={`px-4 py-3 text-right font-medium ${(s.ecart ?? 0) < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {s.ecart !== null ? s.ecart.toFixed(2) : '—'}
                </td>
                <td className={`px-4 py-3 text-right font-medium ${Math.abs(s.tauxEcart ?? 0) > 0.5 ? 'text-amber-400' : 'text-zinc-400'}`}>
                  {s.tauxEcart !== null ? `${s.tauxEcart.toFixed(2)}%` : '—'}
                </td>
                <td className="px-4 py-3 text-center">
                  {s.flagAnomalie ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400 mx-auto" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-zinc-800 flex justify-between text-xs text-zinc-600">
        <span>{states.length} enregistrement(s)</span>
        <span>
          Total vendu: <strong className="text-zinc-400">
            {states.reduce((s, r) => s + r.volumeVendu, 0).toLocaleString('fr-FR')} L
          </strong>
        </span>
      </div>
    </div>
  )
}
