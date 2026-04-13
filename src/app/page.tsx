import { getDashboardStats } from '@/lib/actions'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  Fuel,
  TrendingUp,
  AlertTriangle,
  Building2,
  Activity,
} from 'lucide-react'
import DashboardChart from '@/components/DashboardChart'
import StationRanking from '@/components/StationRanking'

export default async function HomePage() {
  const stats = await getDashboardStats()

  const dataDate = new Date(stats.displayDate + 'T12:00:00')
  const dateLabel = format(dataDate, "EEEE d MMMM yyyy", { locale: fr })
  const isToday = stats.displayDate === new Date().toISOString().split('T')[0]

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <p className="text-sm text-zinc-500 capitalize">{dateLabel}</p>
        <h1 className="text-3xl font-bold text-white mt-1">Tableau de bord</h1>
        <p className="text-zinc-400 mt-1">
          {isToday
            ? "Vue d'ensemble des ventes et stocks du réseau"
            : `Dernier jour avec données — aucune saisie enregistrée pour aujourd'hui`}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Ventes du jour"
          value={`${stats.totalVentesToday.toLocaleString('fr-FR')} L`}
          icon={<Fuel className="w-5 h-5" />}
          color="blue"
          sub={`${stats.stationsWithData} station(s) avec données`}
        />
        <KpiCard
          label="Stations actives"
          value={`${stats.stationsWithData} / ${stats.totalStations}`}
          icon={<Building2 className="w-5 h-5" />}
          color="emerald"
          sub="Couverture du réseau"
        />
        <KpiCard
          label="Anomalies détectées"
          value={String(stats.totalAnomalies)}
          icon={<AlertTriangle className="w-5 h-5" />}
          color={stats.totalAnomalies > 0 ? "amber" : "emerald"}
          sub="Écarts > 2%"
        />
        <KpiCard
          label="Tendance 30j"
          value={`${stats.chartData.length} jours`}
          icon={<Activity className="w-5 h-5" />}
          color="violet"
          sub="Données disponibles"
        />
      </div>

      {/* Chart + Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <h2 className="font-semibold text-white">Évolution des ventes — 30 derniers jours</h2>
          </div>
          <DashboardChart data={stats.chartData} />
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Building2 className="w-5 h-5 text-blue-400" />
            <h2 className="font-semibold text-white">Classement stations</h2>
          </div>
          <StationRanking stations={stats.stationSummary} />
        </div>
      </div>
    </div>
  )
}

function KpiCard({
  label, value, icon, color, sub
}: {
  label: string
  value: string
  icon: React.ReactNode
  color: 'blue' | 'emerald' | 'amber' | 'violet'
  sub: string
}) {
  const colors = {
    blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/20 text-blue-400',
    emerald: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20 text-emerald-400',
    amber: 'from-amber-500/20 to-amber-600/5 border-amber-500/20 text-amber-400',
    violet: 'from-violet-500/20 to-violet-600/5 border-violet-500/20 text-violet-400',
  }
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-5`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-zinc-400 font-medium">{label}</p>
        <div className={`${colors[color].split(' ')[3]}`}>{icon}</div>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      <p className="text-xs text-zinc-500 mt-2">{sub}</p>
    </div>
  )
}
