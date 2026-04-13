'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, ClipboardList, PlusCircle,
  History, Settings, Fuel, BarChart3, X, Menu, LogOut
} from 'lucide-react'
import { logout } from '@/lib/auth'

const navItems = [
  { href: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/saisie', label: 'Saisie journalière', icon: PlusCircle },
  { href: '/etats', label: 'États journaliers', icon: ClipboardList },
  { href: '/historique', label: 'Historique', icon: History },
  { href: '/analyse', label: 'Analyse', icon: BarChart3, adminOnly: true },
  { href: '/parametres', label: 'Paramètres', icon: Settings, adminOnly: true },
]

function NavLinks({ role, onClose }: { role: string; onClose?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  return (
    <>
      {navItems.filter(i => !i.adminOnly || role === 'admin').map(({ href, label, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '10px 12px', borderRadius: '10px',
              fontSize: '14px', fontWeight: 500, textDecoration: 'none',
              transition: 'all 0.15s',
              backgroundColor: active ? '#2563eb' : 'transparent',
              color: active ? 'white' : '#a1a1aa',
              boxShadow: active ? '0 4px 14px rgba(37,99,235,0.3)' : 'none',
            }}
            onMouseEnter={(e) => {
              if (!active) { e.currentTarget.style.backgroundColor = '#27272a'; e.currentTarget.style.color = 'white' }
            }}
            onMouseLeave={(e) => {
              if (!active) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#a1a1aa' }
            }}
          >
            <Icon size={16} />
            {label}
          </Link>
        )
      })}
      
      <div style={{ flex: 1 }} />
      <button
        onClick={async () => {
          await logout()
          router.push('/login')
          router.refresh()
          if (onClose) onClose()
        }}
        style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '10px 12px', borderRadius: '10px',
          fontSize: '14px', fontWeight: 500, border: 'none',
          backgroundColor: 'transparent',
          color: '#ef4444', cursor: 'pointer', textAlign: 'left',
          marginTop: 'auto'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)' }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
      >
        <LogOut size={16} />
        Déconnexion
      </button>
    </>
  )
}

function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div className="animated-gradient" style={{
        width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Fuel size={18} color="white" />
      </div>
      <div>
        <p style={{ fontWeight: 700, color: 'white', lineHeight: 1.2, margin: 0, fontSize: '15px' }}>My Stations</p>
        <p style={{ fontSize: '11px', color: '#71717a', margin: 0 }}>Gestion des stocks</p>
      </div>
    </div>
  )
}

// Desktop sidebar (hidden on small screens via CSS)
export function DesktopSidebar({ role }: { role: string }) {
  return (
    <aside className="hidden-mobile" style={{
      position: 'fixed', top: 0, left: 0, bottom: 0,
      width: '256px', zIndex: 40,
      display: 'flex', flexDirection: 'column',
      backgroundColor: '#09090b',
      borderRight: '1px solid #27272a',
    }}>
      <div style={{ padding: '24px', borderBottom: '1px solid #27272a' }}>
        <Logo />
      </div>
      <nav style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
        <NavLinks role={role} />
      </nav>
      <div style={{ padding: '16px', borderTop: '1px solid #27272a', textAlign: 'center' }}>
        <p style={{ fontSize: '11px', color: '#3f3f46', margin: 0 }}>v1.0.0 — Avril 2026</p>
      </div>
    </aside>
  )
}

// Mobile top bar + slide-in drawer
export function MobileNav({ role }: { role: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Top bar — only on mobile */}
      <header className="mobile-header" style={{
        display: 'none', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        backgroundColor: 'rgba(9,9,11,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #27272a',
        padding: '12px 16px', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Logo />
        <button
          onClick={() => setOpen(true)}
          style={{
            background: 'rgba(39,39,42,0.8)', border: '1px solid #3f3f46',
            borderRadius: '8px', padding: '6px', cursor: 'pointer', color: 'white',
            display: 'flex', alignItems: 'center',
          }}
        >
          <Menu size={20} />
        </button>
      </header>

      {/* Drawer overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 60,
            backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          }}
        />
      )}

      {/* Drawer panel */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 70,
        width: '260px', backgroundColor: '#09090b',
        borderRight: '1px solid #27272a',
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s ease',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Logo />
          <button
            onClick={() => setOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717a', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>
        <nav style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
          <NavLinks role={role} onClose={() => setOpen(false)} />
        </nav>
        <div style={{ padding: '12px 16px', borderTop: '1px solid #27272a', textAlign: 'center' }}>
          <p style={{ fontSize: '11px', color: '#3f3f46', margin: 0 }}>v1.0.0 — Avril 2026</p>
        </div>
      </div>
    </>
  )
}

// Default export for backwards compatibility
export default function Sidebar({ role }: { role: string }) {
  return (
    <>
      <DesktopSidebar role={role} />
      <MobileNav role={role} />
    </>
  )
}
