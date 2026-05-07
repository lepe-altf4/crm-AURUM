'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Icon from './ui/icon'
import type { Profile } from '@/lib/types'

const NAV_ITEMS = [
  { href: '/leads', label: 'Leads Hub', icon: 'leads' },
  { href: '/pipeline', label: 'Visual Pipeline', icon: 'pipeline' },
  { href: '/stock', label: 'Stock Manager', icon: 'stock' },
  { href: '/dashboard', label: 'Executive Dashboard', icon: 'dash' },
  { href: '/settings', label: 'Admin Settings', icon: 'settings' },
] as const

interface SidebarProps {
  profile: Profile | null
}

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const displayName = profile?.name ?? 'Usuario'
  const displayRole = profile?.role ?? 'Closer'
  const displayInitials = profile?.initials ?? displayName.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="mark">A</div>
        <div className="word">AURUM</div>
      </div>
      <div className="sidebar-section">Workspace</div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.filter(item => item.href !== '/settings' || profile?.role === 'Admin').map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-item ${pathname.startsWith(item.href) ? 'active' : ''}`}
          >
            <span className="ico"><Icon name={item.icon} size={16} /></span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="sidebar-user">
        <div className="avatar">{displayInitials}</div>
        <div className="meta">
          <div className="name">{displayName}</div>
          <div className="role">{displayRole}</div>
        </div>
        <button className="menu-dot" onClick={handleSignOut} title="Cerrar sesión">
          <Icon name="more" size={14} />
        </button>
      </div>
    </aside>
  )
}
