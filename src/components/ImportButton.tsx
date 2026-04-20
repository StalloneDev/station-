'use client'

import { useRef, useState } from 'react'
import { Upload, CheckCircle2, AlertTriangle, Loader2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

type ImportResult = {
  success: boolean
  imported?: number
  sheets?: number
  skippedStations?: string[]
  error?: string
}

export default function ImportButton() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const router = useRouter()

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setLoading(true)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/import-excel', {
        method: 'POST',
        body: formData,
      })
      const data: ImportResult = await res.json()
      setResult(data)
      if (data.success) {
        router.refresh() // Refresh page data after successful import
      }
    } catch {
      setResult({ success: false, error: 'Erreur réseau lors de l\'import.' })
    } finally {
      setLoading(false)
      // Reset input so same file can be re-imported
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="flex items-center gap-2 bg-blue-700 hover:bg-blue-600 disabled:bg-zinc-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Import en cours...</>
          : <><Upload className="w-4 h-4" /> Importer Excel</>
        }
      </button>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Result toast */}
      {result && (
        <div className={`relative flex items-start gap-3 px-4 py-3 rounded-xl text-sm border max-w-xs shadow-lg
          ${result.success
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
            : 'bg-red-500/10 border-red-500/20 text-red-300'
          }`}
        >
          {result.success
            ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            : <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          }
          <div className="flex-1">
            {result.success ? (
              <>
                <p className="font-semibold">Import réussi !</p>
                <p className="text-xs mt-0.5 text-emerald-400/80">
                  {result.imported} enregistrements · {result.sheets} feuilles
                </p>
                {result.skippedStations && result.skippedStations.length > 0 && (
                  <p className="text-xs mt-1 text-amber-400">
                    ⚠️ Stations ignorées : {result.skippedStations.join(', ')}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="font-semibold">Erreur d'import</p>
                <p className="text-xs mt-0.5">{result.error}</p>
              </>
            )}
          </div>
          <button
            onClick={() => setResult(null)}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {fileName && loading && (
        <p className="text-xs text-zinc-500">{fileName}</p>
      )}
    </div>
  )
}
