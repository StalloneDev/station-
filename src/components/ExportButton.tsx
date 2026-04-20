'use client'

import { Download, FileText } from 'lucide-react'

interface ExportButtonProps {
  startDate: string
  endDate: string
  stationId?: string
}

export default function ExportButton({ startDate, endDate, stationId }: ExportButtonProps) {

  function handleExportExcel() {
    const params = new URLSearchParams({ startDate, endDate })
    if (stationId) params.set('stationId', stationId)
    const url = `/api/export?${params.toString()}`
    window.open(url, '_blank')
  }

  function handleExportPdf() {
    const params = new URLSearchParams({ startDate, endDate, format: 'pdf' })
    if (stationId) params.set('stationId', stationId)
    const url = `/api/export-pdf?${params.toString()}`
    window.open(url, '_blank')
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleExportExcel}
        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
      >
        <Download className="w-4 h-4" /> Exporter Excel
      </button>
      <button
        onClick={handleExportPdf}
        className="flex items-center gap-2 bg-red-700 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
      >
        <FileText className="w-4 h-4" /> Exporter PDF
      </button>
    </div>
  )
}
