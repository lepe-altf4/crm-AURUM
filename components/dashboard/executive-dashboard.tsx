'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Icon from '@/components/ui/icon'

interface ContactSnap { id: string; amount: number; stage_id: string; vendor_id: string | null }
interface InventorySnap { id: string; price: number; status: string }
interface WeeklySale { id: string; week: string; units: number; revenue: number; target: number }
interface ProfileSnap { id: string; name: string; initials: string }
interface ClosedContact { id: string; name: string; car_interest: string | null; amount: number; created_at: string; vendor_id: string | null; vendor?: { name: string } | null }

interface Props {
  contacts: ContactSnap[]
  inventory: InventorySnap[]
  weeklySales: WeeklySale[]
  profiles: ProfileSnap[]
  recentClosed: ClosedContact[]
}

function fmtUSDk(n: number) {
  if (n >= 1_000_000) return 'US$' + (n / 1_000_000).toFixed(2) + 'M'
  return 'US$' + Math.round(n / 1000) + 'k'
}
function fmtUSD(n: number) { return 'US$' + n.toLocaleString('en-US') }

export default function ExecutiveDashboard({ contacts: initialContacts, inventory: initialInventory, weeklySales, profiles, recentClosed }: Props) {
  const supabase = createClient()
  const [contacts, setContacts] = useState<ContactSnap[]>(initialContacts)
  const [inventory, setInventory] = useState<InventorySnap[]>(initialInventory)
  const [period, setPeriod] = useState('Abril 2026')

  // Real-time subscriptions
  useEffect(() => {
    const contactCh = supabase
      .channel('rt-contacts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        supabase.from('leads').select('id, amount, stage_id, vendor_id').then(({ data }) => {
          if (data) setContacts(data)
        })
      })
      .subscribe()

    const inventoryCh = supabase
      .channel('rt-inventory')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock' }, () => {
        supabase.from('stock').select('id, price, status').then(({ data }) => {
          if (data) setInventory(data)
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(contactCh)
      supabase.removeChannel(inventoryCh)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Compute KPIs from live data
  const closedContacts = contacts.filter(c => c.stage_id === 's5')
  const totalRevenue = closedContacts.reduce((acc, c) => acc + (c.amount ?? 0), 0)
  const unitsSold = inventory.filter(i => i.status === 'sold').length
  const unitsTarget = 30
  const totalLeads = contacts.length
  const convRate = totalLeads > 0 ? ((closedContacts.length / totalLeads) * 100).toFixed(1) : '0.0'
  const avgTicket = closedContacts.length > 0 ? totalRevenue / closedContacts.length : 0

  // Vendor rankings
  const vendorStats = profiles.map(p => {
    const vendorDeals = closedContacts.filter(c => c.vendor_id === p.id)
    const vendorRevenue = vendorDeals.reduce((acc, c) => acc + (c.amount ?? 0), 0)
    const vendorTotal = contacts.filter(c => c.vendor_id === p.id).length
    const rate = vendorTotal > 0 ? Math.round((vendorDeals.length / vendorTotal) * 100) : 0
    return { ...p, deals: vendorDeals.length, revenue: vendorRevenue, rate }
  }).sort((a, b) => b.revenue - a.revenue)

  const maxRevenue = Math.max(...weeklySales.map(w => w.revenue), 1)

  return (
    <>
      <div className="module-header">
        <div>
          <div className="module-title">Executive Dashboard</div>
          <div className="module-sub">{period} · vista del Owner · datos en tiempo real</div>
        </div>
        <div className="header-right">
          <select className="select" value={period} onChange={e => setPeriod(e.target.value)}>
            <option>Abril 2026</option>
            <option>Marzo 2026</option>
            <option>Q1 2026</option>
          </select>
          <button className="btn"><Icon name="export" size={12} /> Exportar PDF</button>
        </div>
      </div>

      <div className="module-body">
        {/* KPIs */}
        <div className="kpi-grid">
          {/* Revenue */}
          <div className="kpi">
            <div className="kpi-label">Revenue del mes</div>
            <div className="kpi-value">{fmtUSDk(totalRevenue)}</div>
            <div className="kpi-delta up"><Icon name="trend" size={11} /><span>Deals cerrados este periodo</span></div>
          </div>
          {/* Units */}
          <div className="kpi">
            <div className="kpi-label">Unidades vendidas</div>
            <div className="kpi-value">{unitsSold} / {unitsTarget}</div>
            <div className="kpi-delta"><span>Meta mensual · {Math.round((unitsSold / unitsTarget) * 100)}%</span></div>
            <div className="kpi-progress"><div className="fill" style={{ width: `${Math.min((unitsSold / unitsTarget) * 100, 100)}%` }} /></div>
          </div>
          {/* Conv rate */}
          <div className="kpi">
            <div className="kpi-label">Tasa de conversión</div>
            <div className="kpi-value">{convRate}%</div>
            <div className="kpi-delta up"><Icon name="trend" size={11} /><span>Leads → Cerrados</span></div>
          </div>
          {/* Ticket */}
          <div className="kpi">
            <div className="kpi-label">Ticket promedio</div>
            <div className="kpi-value">{fmtUSDk(avgTicket)}</div>
            <div className="kpi-delta up"><Icon name="trend" size={11} /><span>Por deal cerrado</span></div>
          </div>
        </div>

        {/* Charts row */}
        <div className="dash-grid">
          {/* Bar chart */}
          <div className="card">
            <div className="card-head">
              <div className="card-title">Ventas por semana</div>
              <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-mute)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, background: 'var(--gold)', borderRadius: 2 }} /> Cumplido
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, background: '#2a2a2a', borderRadius: 2 }} /> Meta
                </span>
              </div>
            </div>
            <div className="chart-shell">
              <div className="bars">
                {weeklySales.map(w => {
                  const hPct = (w.revenue / maxRevenue) * 100
                  const targetPct = ((w.target * 160000) / maxRevenue) * 100
                  return (
                    <div className="bar-col" key={w.id}>
                      <div className="bar-val">{fmtUSDk(w.revenue)}</div>
                      <div className="bar-stack">
                        <div className="bar" style={{ height: `${hPct}%` }} />
                        {targetPct > hPct && (
                          <div className="bar dim" style={{ height: `${targetPct - hPct}%` }} />
                        )}
                      </div>
                      <div className="bar-label">{w.week}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Rankings */}
          <div className="card">
            <div className="card-head">
              <div className="card-title">Ranking de vendedores</div>
              <div style={{ fontSize: 11, color: 'var(--text-mute)' }}>{period}</div>
            </div>
            <div className="card-pad" style={{ paddingTop: 6, paddingBottom: 6 }}>
              {vendorStats.map((v, i) => (
                <div key={v.id} className={`rank-row${i === 0 ? ' top' : ''}`}>
                  <div className="rank-num">{String(i + 1).padStart(2, '0')}</div>
                  <div>
                    <div className="rank-name">{v.name}</div>
                    <div className="rank-stats">{v.deals} deals cerrados</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="rank-rev">{fmtUSDk(v.revenue)}</div>
                    <div className="rank-rate">{v.rate}% cierre</div>
                  </div>
                </div>
              ))}
              {vendorStats.length === 0 && (
                <div style={{ fontSize: 12, color: 'var(--text-mute)', padding: '20px 0', textAlign: 'center' }}>Sin datos de vendedores.</div>
              )}
            </div>
          </div>
        </div>

        {/* Recent closed */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">Últimas operaciones cerradas</div>
            <button className="btn-ghost btn-sm">Ver todas</button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Vehículo</th>
                <th>Cliente</th>
                <th>Vendedor</th>
                <th>Fecha</th>
                <th style={{ textAlign: 'right' }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {recentClosed.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>{c.car_interest ?? '—'}</td>
                  <td className="muted">{c.name}</td>
                  <td className="muted">{c.vendor?.name ?? '—'}</td>
                  <td className="muted tabular">{new Date(c.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}</td>
                  <td className="tabular gold-text" style={{ fontWeight: 600, textAlign: 'right' }}>{fmtUSD(c.amount)}</td>
                </tr>
              ))}
              {recentClosed.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '28px 14px', color: 'var(--text-mute)', fontSize: 12 }}>Sin operaciones cerradas aún.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
