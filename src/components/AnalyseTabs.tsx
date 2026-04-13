'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { getAnalyseData } from '@/lib/actions'
import { TrendingUp, Building2, AlertTriangle, Loader2 } from 'lucide-react'

interface Station { id: string; name: string }
interface AnalyseTabsProps { stations: Station[] }

const TABS = [
  { id: 'tendances', label: 'Tendances des ventes', icon: TrendingUp },
  { id: 'performance', label: 'Performance par station', icon: Building2 },
  { id: 'anomalies', label: 'Registre des anomalies', icon: AlertTriangle },
]

export default function AnalyseTabs({ stations }: AnalyseTabsProps) {
  const [activeTab, setActiveTab] = useState('tendances')
  const [stationFilter, setStationFilter] = useState('')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getAnalyseData(stationFilter || undefined).then((d: any) => {
      setData(d)
      setLoading(false)
    })
  }, [stationFilter])

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="glass-card rounded-2xl p-4 flex items-center gap-4 flex-wrap">
        <label className="text-sm text-zinc-400 font-medium flex-shrink-0">Station :</label>
        <select
          value={stationFilter}
          onChange={(e) => setStationFilter(e.target.value)}
          className="input-field max-w-xs"
        >
          <option value="">Toutes les stations</option>
          {stations.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <span className="text-xs text-zinc-500 ml-auto">Période : 30 derniers jours</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl w-fit" style={{ background: 'rgba(24,24,27,0.8)', border: '1px solid #27272a' }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 18px', borderRadius: '12px', fontSize: '13px', fontWeight: 500,
              transition: 'all 0.2s', border: 'none', cursor: 'pointer',
              background: activeTab === id
                ? 'linear-gradient(135deg, #2563eb, #4f46e5)'
                : 'transparent',
              color: activeTab === id ? 'white' : '#71717a',
              boxShadow: activeTab === id ? '0 4px 12px rgba(37,99,235,0.35)' : 'none',
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="glass-card rounded-2xl p-16 flex items-center justify-center gap-3 text-zinc-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          Chargement des données…
        </div>
      ) : !data ? null : activeTab === 'tendances' ? (
        <TendancesTab data={data.trendData} />
      ) : activeTab === 'performance' ? (
        <PerformanceTab data={data.stationPerformance} />
      ) : (
        <AnomaliesTab data={data.anomalies} />
      )}
    </div>
  )
}

// ─── LINE CHART (SVG) ────────────────────────────────────────────────────────

const LineChart = React.memo(function LineChart({ data, keys, colors, labels }: {
  data: any[]
  keys: string[]
  colors: string[]
  labels: string[]
}) {
  if (data.length < 2) {
    return <div className="text-zinc-600 text-sm text-center py-10">Pas assez de données pour tracer la courbe</div>
  }

  const W = 800
  const H = 260
  const PAD = { top: 16, right: 20, bottom: 48, left: 52 }

  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const maxVal = Math.max(...data.flatMap((d) => keys.map((k) => d[k] ?? 0)), 1)

  function xPos(i: number) {
    return PAD.left + (i / (data.length - 1)) * chartW
  }
  function yPos(v: number) {
    return PAD.top + chartH - (v / maxVal) * chartH
  }

  function smoothPath(points: [number, number][]) {
    if (points.length < 2) return ''
    let d = `M ${points[0][0]} ${points[0][1]}`
    for (let i = 1; i < points.length; i++) {
      const [x1, y1] = points[i - 1]
      const [x2, y2] = points[i]
      const cx = (x1 + x2) / 2
      d += ` C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`
    }
    return d
  }

  const yTicks = 4
  const step = maxVal / yTicks

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: 'auto', overflow: 'visible' }}
    >
      {/* Grid lines + Y labels */}
      {Array.from({ length: yTicks + 1 }, (_, i) => {
        const v = step * i
        const y = yPos(v)
        return (
          <g key={i}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y}
              stroke="#27272a" strokeWidth="1" strokeDasharray={i === 0 ? '0' : '4 4'} />
            <text x={PAD.left - 8} y={y + 4} textAnchor="end" fill="#52525b" fontSize="10">
              {v.toLocaleString('fr-FR')}
            </text>
          </g>
        )
      })}

      {/* X labels */}
      {data.map((d, i) => {
        if (data.length > 15 && i % 3 !== 0) return null
        const x = xPos(i)
        const label = new Date(d.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
        return (
          <text key={i} x={x} y={H - 10} textAnchor="middle" fill="#52525b" fontSize="10">{label}</text>
        )
      })}

      {/* Lines + Area fill */}
      {keys.map((key, ki) => {
        const pts: [number, number][] = data.map((d, i) => [xPos(i), yPos(d[key] ?? 0)])
        const path = smoothPath(pts)
        const areaClose = `L ${pts[pts.length - 1][0]} ${PAD.top + chartH} L ${pts[0][0]} ${PAD.top + chartH} Z`

        return (
          <g key={key}>
            {/* Area */}
            <defs>
              <linearGradient id={`grad-${ki}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={colors[ki]} stopOpacity="0.25" />
                <stop offset="100%" stopColor={colors[ki]} stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <path d={path + ' ' + areaClose} fill={`url(#grad-${ki})`} />
            {/* Line */}
            <path d={path} fill="none" stroke={colors[ki]} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {/* Dots */}
            {pts.map(([x, y], j) => (
              data.length <= 20 && (
                <circle key={j} cx={x} cy={y} r="3.5" fill={colors[ki]} stroke="#09090b" strokeWidth="2" />
              )
            ))}
          </g>
        )
      })}
    </svg>
  )
})

// ─── BAR CHART (SVG histogram) ──────────────────────────────────────────────

const BarChart = React.memo(function BarChart({ data }: { data: { label: string; essence: number; gasoil: number; total: number }[] }) {
  if (data.length === 0) {
    return <div className="text-zinc-600 text-sm text-center py-10">Aucune donnée disponible</div>
  }

  const W = 800
  const H = 280
  const PAD = { top: 16, right: 20, bottom: 80, left: 64 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const maxVal = Math.max(...data.map((d) => d.total), 1)
  const groupW = chartW / data.length
  const barW = Math.min((groupW - 8) / 2, 28)
  const yTicks = 4

  function yPos(v: number) {
    return PAD.top + chartH - (v / maxVal) * chartH
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
      {/* Grid */}
      {Array.from({ length: yTicks + 1 }, (_, i) => {
        const v = (maxVal / yTicks) * i
        const y = yPos(v)
        return (
          <g key={i}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y}
              stroke="#27272a" strokeWidth="1" strokeDasharray={i === 0 ? '0' : '4 4'} />
            <text x={PAD.left - 8} y={y + 4} textAnchor="end" fill="#52525b" fontSize="10">
              {v.toLocaleString('fr-FR')}
            </text>
          </g>
        )
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const cx = PAD.left + i * groupW + groupW / 2
        const essH = (d.essence / maxVal) * chartH
        const gasH = (d.gasoil / maxVal) * chartH

        // Short label (first word)
        const shortLabel = d.label.split(' ')[0].substring(0, 8)

        return (
          <g key={i}>
            {/* Essence bar */}
            <rect
              x={cx - barW - 2} y={yPos(d.essence)}
              width={barW} height={essH}
              rx="4" fill="#3b82f6" opacity="0.85"
            />
            {/* Gasoil bar */}
            <rect
              x={cx + 2} y={yPos(d.gasoil)}
              width={barW} height={gasH}
              rx="4" fill="#f97316" opacity="0.85"
            />
            {/* Label */}
            <text
              x={cx} y={H - 8}
              textAnchor="middle" fill="#52525b" fontSize="9"
              style={{ fontFamily: 'sans-serif' }}
            >
              {shortLabel}
            </text>
          </g>
        )
      })}
    </svg>
  )
})

// ─── TABS ────────────────────────────────────────────────────────────────────

function TendancesTab({ data }: { data: any[] }) {
  const totalEssence = useMemo(() => data.reduce((s: number, d: any) => s + d.essence, 0), [data])
  const totalGasoil = useMemo(() => data.reduce((s: number, d: any) => s + d.gasoil, 0), [data])
  const totalGeneral = totalEssence + totalGasoil

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard label="Total Essence" value={`${totalEssence.toLocaleString('fr-FR')} L`} color="blue" />
        <SummaryCard label="Total Gasoil" value={`${totalGasoil.toLocaleString('fr-FR')} L`} color="orange" />
        <SummaryCard label="Total Général" value={`${totalGeneral.toLocaleString('fr-FR')} L`} color="violet" />
      </div>

      {/* Line Chart */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-white">Courbe d'évolution des ventes</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Volumes journaliers en litres</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5"><div style={{ width: 12, height: 12, borderRadius: '50%', background: '#3b82f6' }} /> Essence</div>
            <div className="flex items-center gap-1.5"><div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f97316' }} /> Gasoil</div>
            <div className="flex items-center gap-1.5"><div style={{ width: 12, height: 12, borderRadius: '50%', background: '#a78bfa' }} /> Total</div>
          </div>
        </div>
        <LineChart
          data={data}
          keys={['essence', 'gasoil', 'total']}
          colors={['#3b82f6', '#f97316', '#a78bfa']}
          labels={['Essence', 'Gasoil', 'Total']}
        />
      </div>
    </div>
  )
}

function PerformanceTab({ data }: { data: any[] }) {
  return (
    <div className="space-y-5">
      {/* Histogram */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-white">Histogramme des ventes par station</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Volumes Essence et Gasoil — 30 derniers jours</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5"><div style={{ width: 12, height: 12, borderRadius: '3px', background: '#3b82f6' }} /> Essence</div>
            <div className="flex items-center gap-1.5"><div style={{ width: 12, height: 12, borderRadius: '3px', background: '#f97316' }} /> Gasoil</div>
          </div>
        </div>
        <BarChart
          data={data.map((s: any) => ({
            label: s.name,
            essence: s.essence,
            gasoil: s.gasoil,
            total: s.total,
          }))}
        />
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="divide-y divide-zinc-800/50">
          {data.map((s: any, i: number) => (
            <div key={s.name} className="px-5 py-3 flex items-center gap-4 hover:bg-zinc-800/20 transition-colors">
              <span className="text-zinc-600 font-bold text-xs w-5">{i + 1}</span>
              <p className="text-white text-sm font-medium flex-1 truncate">{s.name}</p>
              <div className="flex gap-4 text-xs text-zinc-400">
                <span>Ess. <strong className="text-sky-400">{s.essence.toLocaleString('fr-FR')} L</strong></span>
                <span>Gas. <strong className="text-orange-400">{s.gasoil.toLocaleString('fr-FR')} L</strong></span>
                <span>Total <strong className="text-white">{s.total.toLocaleString('fr-FR')} L</strong></span>
              </div>
              {s.anomalies > 0 && (
                <span className="text-xs bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full flex-shrink-0">
                  {s.anomalies} anomalie(s)
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AnomaliesTab({ data }: { data: any[] }) {
  const [page, setPage] = useState(1)
  const itemsPerPage = 10
  const totalPages = Math.ceil(data.length / itemsPerPage)
  const paginatedData = data.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-zinc-800">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Registre des anomalies — 30 derniers jours
        </h2>
        <p className="text-xs text-zinc-500 mt-1">{data.length} anomalie(s) détectée(s)</p>
      </div>
      {data.length === 0 ? (
        <div className="p-10 text-center">
          <p className="text-emerald-400 font-medium">✓ Aucune anomalie détectée</p>
          <p className="text-zinc-600 text-sm mt-1">Tous les écarts sont dans les normes (&lt; 2%)</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-400 border-b border-zinc-800">
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Station</th>
                <th className="px-4 py-3 text-left font-medium">Produit</th>
                <th className="px-4 py-3 text-right font-medium">Écart (L)</th>
                <th className="px-4 py-3 text-right font-medium">Taux</th>
                <th className="px-4 py-3 text-left font-medium">Observation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40">
              {paginatedData.map((a: any) => (
                <tr key={a.id} className="hover:bg-amber-500/5 transition-colors">
                  <td className="px-4 py-3 text-zinc-300 text-xs">{new Date(a.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</td>
                  <td className="px-4 py-3 text-white text-xs max-w-[160px] truncate">{a.station}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${a.product.trim() === 'Essence' ? 'bg-sky-500/20 text-sky-300' : 'bg-orange-500/20 text-orange-300'}`}>
                      {a.product}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold ${(a.ecart ?? 0) < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {(a.ecart ?? 0) > 0 ? '+' : ''}{(a.ecart ?? 0).toFixed(1)} L
                  </td>
                  <td className="px-4 py-3 text-right text-amber-400 font-medium">
                    {(a.tauxEcart ?? 0).toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs max-w-[200px] truncate">
                    {a.observation || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800/50">
               <span className="text-xs text-zinc-500">Page {page} sur {totalPages}</span>
               <div className="flex gap-2">
                 <button 
                   onClick={() => setPage(p => Math.max(1, p - 1))}
                   disabled={page === 1}
                   className="px-3 py-1 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                 >
                   Précédent
                 </button>
                 <button 
                   onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                   disabled={page === totalPages}
                   className="px-3 py-1 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                 >
                   Suivant
                 </button>
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  const styles: Record<string, string> = {
    blue: 'border-blue-500/20 bg-blue-500/10 text-blue-400',
    orange: 'border-orange-500/20 bg-orange-500/10 text-orange-400',
    violet: 'border-violet-500/20 bg-violet-500/10 text-violet-400',
  }
  return (
    <div className={`border rounded-2xl p-4 ${styles[color]}`}>
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  )
}
