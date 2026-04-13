import { getStations, getProducts, getUsers } from '@/lib/actions'
import ParametresClient from '@/components/ParametresClient'
import { UserSettingsClient } from '@/components/UserSettingsClient'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'

export default async function ParametresPage() {
  const session = await getSession()
  if (session?.role !== 'admin') {
    redirect('/')
  }

  const [stations, products, users] = await Promise.all([getStations(), getProducts(), getUsers()])

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Paramètres</h1>
        <p className="text-zinc-400 mt-1">Gérez les stations et produits du réseau</p>
      </div>

      <ParametresClient
        stations={stations}
        products={products}
      />

      <div className="max-w-4xl mt-8">
        <UserSettingsClient users={users} />
      </div>
    </div>
  )
}
