import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import { getSession } from '@/lib/auth'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'My Stations | Suivi Ventes & Stocks',
  description: "Tableau de bord de suivi des ventes et stocks de stations-service",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  const role = session?.role || 'guest'

  return (
    <html lang="fr">
      <body className={inter.className} style={{ margin: 0, backgroundColor: '#09090b', color: '#fafafa', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {role !== 'guest' && <Sidebar role={role} />}
        <div className={role !== 'guest' ? "app-layout" : "w-full flex-1 flex flex-col"}>
          <main className={role !== 'guest' ? "app-main" : "flex-1"}>
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
