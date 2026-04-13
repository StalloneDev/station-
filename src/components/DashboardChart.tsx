'use client'

interface ChartPoint { date: string; total: number }

export default function DashboardChart({ data }: { data: ChartPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-zinc-600 text-sm">
        Aucune donnée disponible pour les 30 derniers jours
      </div>
    )
  }

  const max = Math.max(...data.map((d) => d.total))
  const barWidth = Math.floor(100 / data.length)

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-1 h-48">
        {data.map((d, i) => {
          const height = max > 0 ? (d.total / max) * 100 : 0
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
              <div className="relative w-full">
                <div
                  className="w-full bg-blue-500 rounded-t-sm opacity-80 group-hover:opacity-100 transition-all duration-300 cursor-pointer"
                  style={{ height: `${height * 1.6}px`, minHeight: d.total > 0 ? '4px' : '0' }}
                  title={`${d.date}: ${d.total.toLocaleString('fr-FR')} L`}
                />
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex justify-between text-[10px] text-zinc-600">
        <span>{data[0]?.date?.slice(5)}</span>
        <span>{data[Math.floor(data.length / 2)]?.date?.slice(5)}</span>
        <span>{data[data.length - 1]?.date?.slice(5)}</span>
      </div>
    </div>
  )
}
