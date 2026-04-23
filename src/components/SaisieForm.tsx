'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveDailyState, getPreviousDayJauge } from '@/lib/actions'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  Calendar,
  Building2,
  Fuel,
  Save,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  TrendingDown,
  TrendingUp,
  Minus,
  ArrowLeft,
} from 'lucide-react'

interface Station { id: string; name: string }
interface Product { id: string; name: string }

interface SaisieFormProps {
  stations: Station[]
  products: Product[]
  initialStationId?: string
  onBack?: () => void
  isManager?: boolean
}

export default function SaisieForm({ stations, products, initialStationId, onBack, isManager }: SaisieFormProps) {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [stationId, setStationId] = useState(initialStationId ?? stations[0]?.id ?? '')
  const [productId, setProductId] = useState(products[0]?.id ?? '')
  const [stockOuverture, setStockOuverture] = useState<number>(0)
  const [volumeVendu, setVolumeVendu] = useState<number>(0)
  const [reception, setReception] = useState<number>(0)
  const [jaugeDuJour, setJaugeDuJour] = useState<number>(0)
  const [observation, setObservation] = useState('')
  const router = useRouter()
  const [loadingJauge, setLoadingJauge] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Computed values
  const stockFermeture = stockOuverture + reception - volumeVendu
  const ecart = jaugeDuJour - stockFermeture
  const tauxEcart = stockFermeture > 0 ? (ecart / stockFermeture) * 100 : 0
  // Anomaly threshold updated to 0.5%
  const flagAnomalie = Math.abs(tauxEcart) > 0.5

  // Auto-load previous day's jauge as stock ouverture
  useEffect(() => {
    if (!stationId || !productId || !date) return
    setLoadingJauge(true)
    getPreviousDayJauge(stationId, productId, date).then((jauge) => {
      if (jauge !== null) setStockOuverture(jauge)
      setLoadingJauge(false)
    })
  }, [stationId, productId, date])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      await saveDailyState({
        date,
        stationId,
        productId,
        stockOuverture,
        volumeVendu,
        reception,
        jaugeDuJour,
        observation,
      })
      setSaved(true)
      
      // Delay redirection for 2 seconds to let the user see the success message
      setTimeout(() => {
        window.location.href = '/saisie'
      }, 2000)
    })
  }

  // Readonly class for manager fields that are locked
  const readonlyCls = 'input-field bg-zinc-800/50 text-zinc-500 border-zinc-800 cursor-not-allowed opacity-70'

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {/* Selectors Row */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            Contexte de la saisie
          </h2>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="text-sm flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label="Date de l'état">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              readOnly={isManager}
              className={isManager ? readonlyCls : 'input-field'}
            />
          </FormField>
          <FormField label="Station">
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
              <select
                value={stationId}
                onChange={(e) => setStationId(e.target.value)}
                disabled={isManager}
                className={isManager ? `${readonlyCls} pl-10` : 'input-field pl-10'}
              >
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </FormField>
          <FormField label="Produit">
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="input-field"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </FormField>
        </div>
      </div>

      {/* Manual Inputs */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="font-semibold text-white mb-4">Valeurs à saisir</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Stock ouverture — always readonly (auto-computed) */}
          {!isManager && (
            <FormField label="Stock d'ouverture (L)" hint={loadingJauge ? 'Chargement...' : 'Hérité de la jauge de la veille'}>
              <div className="relative">
                {loadingJauge && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 animate-spin" />
                )}
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={stockOuverture}
                  onChange={(e) => setStockOuverture(parseFloat(e.target.value) || 0)}
                  readOnly={isManager}
                  className={isManager ? `${readonlyCls} border-blue-500/10` : 'input-field bg-blue-500/5 border-blue-500/20'}
                />
              </div>
            </FormField>
          )}

          {/* Volume vendu — editable for everyone including managers */}
          <FormField label="Volume Vendu de la veille (L)" hint="Saisie manuelle obligatoire">
            <input
              type="number"
              min={0}
              step={0.01}
              value={volumeVendu}
              onChange={(e) => setVolumeVendu(parseFloat(e.target.value) || 0)}
              className="input-field"
              required
            />
          </FormField>

          {/* Réception — editable for everyone including managers */}
          <FormField label="Réception de la Veille (L)" hint="Laisser à 0 si pas de livraison">
            <input
              type="number"
              min={0}
              step={0.01}
              value={reception}
              onChange={(e) => setReception(parseFloat(e.target.value) || 0)}
              className="input-field"
            />
          </FormField>

          {/* Jauge — editable for everyone including managers */}
          <FormField label="Jauge au matin du jour actuelle (L)" hint="Mesure physique — obligatoire">
            <input
              type="number"
              min={0}
              step={0.01}
              value={jaugeDuJour}
              onChange={(e) => setJaugeDuJour(parseFloat(e.target.value) || 0)}
              className="input-field border-amber-500/30"
              required
            />
          </FormField>
        </div>

        <div className="mt-4">
          <FormField label="Observations (optionnel)">
            <textarea
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              rows={2}
              placeholder="Anomalie, panne, perte..."
              className="input-field resize-none"
            />
          </FormField>
        </div>
      </div>

      {/* Auto-calculated Results */}
      {!isManager && (
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-semibold text-white mb-4">Résultats calculés automatiquement</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ResultCard label="Stock de fermeture" value={`${stockFermeture.toFixed(2)} L`} color="blue" />
            <ResultCard label="Écart" value={`${ecart.toFixed(2)} L`} color={ecart < 0 ? 'red' : 'emerald'} />
            <ResultCard label="Taux d'écart" value={`${tauxEcart.toFixed(2)}%`} color={flagAnomalie ? 'amber' : 'emerald'} />
            <ResultCard
              label="Statut"
              value={flagAnomalie ? 'Anomalie' : 'Normal'}
              color={flagAnomalie ? 'amber' : 'emerald'}
              icon={flagAnomalie ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            />
          </div>
          {flagAnomalie && (
            <div className="mt-4 flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-sm text-amber-300">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>L'écart dépasse 0.5% du stock théorique. Un commentaire dans "Observations" est recommandé.</p>
            </div>
          )}
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-blue-600/20"
        >
          {isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</>
          ) : (
            <><Save className="w-4 h-4" /> Valider l'état</>
          )}
        </button>

        {saved && (
          <div className="flex items-center gap-2 text-emerald-400 text-sm animate-pulse">
            <CheckCircle2 className="w-4 h-4" />
            État enregistré avec succès !
          </div>
        )}
      </div>
    </form>
  )
}

function FormField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-zinc-300">{label}</label>
      {children}
      {hint && <p className="text-xs text-zinc-600">{hint}</p>}
    </div>
  )
}

function ResultCard({
  label, value, color, icon
}: {
  label: string; value: string; color: string; icon?: React.ReactNode
}) {
  const colors: Record<string, string> = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  }
  return (
    <div className={`rounded-xl border p-4 ${colors[color] ?? colors.blue}`}>
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        {icon}
        <p className="font-bold text-lg">{value}</p>
      </div>
    </div>
  )
}
