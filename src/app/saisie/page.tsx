import { getStations, getProducts } from '@/lib/actions'
import SaisieWrapper from '@/components/SaisieWrapper'

export default async function SaisiePage() {
  const [stations, products] = await Promise.all([getStations(), getProducts()])

  return (
    <div className="p-8 h-full flex flex-col items-center justify-start min-h-[calc(100vh-4rem)]">
      <div className="w-full max-w-5xl space-y-6">
        <div className="text-center md:text-left mb-8">
          <h1 className="text-3xl font-bold text-white">Saisie journalière</h1>
          <p className="text-zinc-400 mt-1">Gérez l'état des ventes et les stocks pour le réseau</p>
        </div>
        <SaisieWrapper stations={stations} products={products} />
      </div>
    </div>
  )
}
