'use client'

import { useState, useTransition } from 'react'
import { Download, Loader2 } from 'lucide-react'

export default function ExportButton({ date }: { date: string }) {
  const [isPending, startTransition] = useTransition()

  function handleExport() {
    // Route to API export endpoint
    const url = `/api/export?startDate=${date}&endDate=${date}`
    window.open(url, '_blank')
  }

  return (
    <button
      onClick={handleExport}
      disabled={isPending}
      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
    >
      {isPending ? (
        <><Loader2 className="w-4 h-4 animate-spin" /> Export...</>
      ) : (
        <><Download className="w-4 h-4" /> Exporter Excel</>
      )}
    </button>
  )
}
