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

// #6 — formato estricto U$S 000.000
function fmtUSD(n: number) {
  return 'U$S ' + Math.round(n).toLocaleString('es-AR')
}
function fmtARS(n: number, fx: number) {
  return '$ ' + Math.round(n * fx).toLocaleString('es-AR')
}
function fmtShort(n: number, currency: 'USD' | 'ARS', fx: number) {
  const v = currency === 'ARS' ? n * fx : n
  if (v >= 1_000_000_000) return (currency === 'ARS' ? '$ ' : 'U$S ') + (v / 1_000_000_000).toFixed(2).replace('.', ',') + 'B'
  if (v >= 1_000_000) return (currency === 'ARS' ? '$ ' : 'U$S ') + (v / 1_000_000).toFixed(2).replace('.', ',') + 'M'
  return currency === 'ARS' ? fmtARS(n, fx) : fmtUSD(n)
}

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function ExecutiveDashboard({ contacts: initialContacts, inventory: initialInventory, weeklySales, profiles, recentClosed }: Props) {
  const supabase = createClient()
  const [contacts, setContacts] = useState<ContactSnap[]>(initialContacts)
  const [inventory, setInventory] = useState<InventorySnap[]>(initialInventory)

  const now = new Date()
  const [period, setPeriod] = useState(`${MONTHS[now.getMonth()]} ${now.getFullYear()}`)

  // #5 — toggle USD/ARS + exchange rate from localStorage
  const [currency, setCurrency] = useState<'USD' | 'ARS'>('USD')
  const [fx, setFx] = useState(1200)

  useEffect(() => {
    const stored = localStorage.getItem('aurum_fx')
    if (stored) setFx(Number(stored))
  }, [])

  // Realtime subscriptions
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

  // KPIs
  const closedContacts = contacts.filter(c => c.stage_id === 's5')
  const totalRevenue = closedContacts.reduce((acc, c) => acc + (c.amount ?? 0), 0)
  const unitsSold = inventory.filter(i => i.status === 'sold').length
  const unitsTarget = 30
  const totalLeads = contacts.length
  const convRate = totalLeads > 0 ? ((closedContacts.length / totalLeads) * 100).toFixed(1) : '0.0'
  const avgTicket = closedContacts.length > 0 ? totalRevenue / closedContacts.length : 0

  const vendorStats = profiles.map(p => {
    const vendorDeals = closedContacts.filter(c => c.vendor_id === p.id)
    const vendorRevenue = vendorDeals.reduce((acc, c) => acc + (c.amount ?? 0), 0)
    const vendorTotal = contacts.filter(c => c.vendor_id === p.id).length
    const rate = vendorTotal > 0 ? Math.round((vendorDeals.length / vendorTotal) * 100) : 0
    return { ...p, deals: vendorDeals.length, revenue: vendorRevenue, rate }
  }).sort((a, b) => b.revenue - a.revenue)

  const maxRevenue = Math.max(...weeklySales.map(w => w.revenue), 1)

  // #10 — Export PDF con jsPDF
  async function exportPDF() {
    const { default: jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const genDate = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })

    const setGold  = () => doc.setTextColor(250, 197, 28)
    const setWhite = () => doc.setTextColor(255, 255, 255)
    const setDark  = () => doc.setTextColor(34, 34, 34)
    const setGray  = () => doc.setTextColor(120, 120, 120)

    // ── Header negro
    doc.setFillColor(0, 0, 0)
    doc.rect(0, 0, 210, 36, 'F')

    setGold()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(24)
    doc.text('AURUM', 14, 17)

    setWhite()
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text('Reporte Ejecutivo', 14, 27)
    doc.setFontSize(9)
    doc.text(period, 196, 17, { align: 'right' })
    setGray()
    doc.text('Generado: ' + genDate, 196, 27, { align: 'right' })

    // ── Sección 1: KPIs
    let y = 48
    setGold()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text('MÉTRICAS PRINCIPALES', 14, y)

    y += 6
    const kpis = [
      { label: 'Revenue del mes',    value: fmtUSD(totalRevenue) },
      { label: 'Unidades vendidas',  value: `${unitsSold} / ${unitsTarget}` },
      { label: 'Tasa de conversión', value: `${convRate}%` },
      { label: 'Ticket promedio',    value: fmtUSD(avgTicket) },
    ]

    kpis.forEach((kpi, i) => {
      const col = i % 2 === 0 ? 14 : 113
      const ky = y + Math.floor(i / 2) * 26
      doc.setFillColor(245, 245, 245)
      doc.roundedRect(col, ky, 89, 22, 2, 2, 'F')
      setGray()
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.text(kpi.label.toUpperCase(), col + 6, ky + 8)
      setDark()
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.text(kpi.value, col + 6, ky + 18)
    })

    // ── Sección 2: Ranking de vendedores
    y += 58
    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.3)
    doc.line(14, y - 4, 196, y - 4)
    setGold()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text('RANKING DE VENDEDORES', 14, y)

    y += 7
    vendorStats.forEach((v, i) => {
      const rowY = y + i * 12
      if (i === 0) {
        doc.setFillColor(34, 34, 34)
        doc.roundedRect(14, rowY - 4, 182, 11, 1.5, 1.5, 'F')
      }
      doc.setFont('helvetica', i === 0 ? 'bold' : 'normal')
      doc.setFontSize(9)
      if (i === 0) setGold(); else setDark()
      doc.text(`${String(i + 1).padStart(2, '0')}  ${v.name}`, 18, rowY + 3.5)
      setGray()
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.text(`${v.deals} deals · ${v.rate}% cierre`, 95, rowY + 3.5)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      setDark()
      doc.text(fmtUSD(v.revenue), 192, rowY + 3.5, { align: 'right' })
    })

    // ── Sección 3: Últimas operaciones cerradas
    y += vendorStats.length * 12 + 12
    doc.setDrawColor(220, 220, 220)
    doc.line(14, y - 4, 196, y - 4)
    setGold()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text('ÚLTIMAS OPERACIONES CERRADAS', 14, y)

    y += 6
    doc.setFillColor(34, 34, 34)
    doc.rect(14, y, 182, 7, 'F')
    setWhite()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.text('VEHÍCULO', 18, y + 4.8)
    doc.text('CLIENTE', 78, y + 4.8)
    doc.text('VENDEDOR', 120, y + 4.8)
    doc.text('FECHA', 155, y + 4.8)
    doc.text('MONTO', 192, y + 4.8, { align: 'right' })

    y += 7
    recentClosed.forEach((c, i) => {
      const rowY = y + i * 9
      if (i % 2 === 0) {
        doc.setFillColor(250, 250, 250)
        doc.rect(14, rowY, 182, 9, 'F')
      }
      setDark()
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.text((c.car_interest ?? '—').slice(0, 28), 18, rowY + 6)
      setGray()
      doc.text(c.name.slice(0, 24), 78, rowY + 6)
      doc.text((c.vendor?.name ?? '—').slice(0, 18), 120, rowY + 6)
      doc.text(new Date(c.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }), 155, rowY + 6)
      doc.setFont('helvetica', 'bold')
      setDark()
      doc.text(fmtUSD(c.amount), 192, rowY + 6, { align: 'right' })
    })

    // ── Footer
    doc.setFillColor(0, 0, 0)
    doc.rect(0, 286, 210, 11, 'F')
    setGray()
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.text('AURUM CRM · Reporte generado el ' + genDate, 14, 293)
    doc.text('Confidencial', 196, 293, { align: 'right' })

    doc.save(`AURUM-Reporte-${period.replace(' ', '-')}.pdf`)
  }

  const periodOptions = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
  })

  return (
    <>
      <div className="module-header">
        <div>
          <div className="module-title">Executive Dashboard</div>
          <div className="module-sub">{period} · vista del Owner · datos en tiempo real</div>
        </div>
        <div className="header-right">
          {/* #5 — toggle USD/ARS */}
          <div style={{ display: 'flex', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, padding: 2, gap: 2 }}>
            {(['USD', 'ARS'] as const).map(c => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                style={{
                  padding: '5px 14px', fontSize: 11, fontWeight: 600, borderRadius: 4, border: 'none',
                  background: currency === c ? 'var(--gold)' : 'transparent',
                  color: currency === c ? '#000' : 'var(--text-mute)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {c}
              </button>
            ))}
          </div>
          <select className="select" value={period} onChange={e => setPeriod(e.target.value)}>
            {periodOptions.map(p => <option key={p}>{p}</option>)}
          </select>
          <button className="btn" onClick={exportPDF}><Icon name="export" size={12} /> Exportar PDF</button>
        </div>
      </div>

      <div className="module-body">
        {/* KPIs */}
        <div className="kpi-grid">
          <div className="kpi">
            <div className="kpi-label">Revenue del mes</div>
            <div className="kpi-value">{fmtShort(totalRevenue, currency, fx)}</div>
            {currency === 'ARS' && <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{fmtUSD(totalRevenue)}</div>}
            <div className="kpi-delta up"><Icon name="trend" size={11} /><span>Deals cerrados este periodo</span></div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Unidades vendidas</div>
            <div className="kpi-value">{unitsSold} / {unitsTarget}</div>
            <div className="kpi-delta"><span>Meta mensual · {Math.round((unitsSold / unitsTarget) * 100)}%</span></div>
            <div className="kpi-progress"><div className="fill" style={{ width: `${Math.min((unitsSold / unitsTarget) * 100, 100)}%` }} /></div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Tasa de conversión</div>
            <div className="kpi-value">{convRate}%</div>
            <div className="kpi-delta up"><Icon name="trend" size={11} /><span>Leads → Cerrados</span></div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Ticket promedio</div>
            <div className="kpi-value">{fmtShort(avgTicket, currency, fx)}</div>
            {currency === 'ARS' && <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{fmtUSD(avgTicket)}</div>}
            <div className="kpi-delta up"><Icon name="trend" size={11} /><span>Por deal cerrado</span></div>
          </div>
        </div>

        {/* Charts row */}
        <div className="dash-grid">
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
                      <div className="bar-val" style={{ fontSize: 10 }}>
                        {currency === 'ARS' ? fmtShort(w.revenue, 'ARS', fx) : fmtUSD(w.revenue)}
                      </div>
                      <div className="bar-stack">
                        <div className="bar" style={{ height: `${hPct}%` }} />
                        {targetPct > hPct && <div className="bar dim" style={{ height: `${targetPct - hPct}%` }} />}
                      </div>
                      <div className="bar-label">{w.week}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

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
                    <div className="rank-rev">{fmtShort(v.revenue, currency, fx)}</div>
                    {currency === 'ARS' && <div style={{ fontSize: 10, color: '#999' }}>{fmtUSD(v.revenue)}</div>}
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
                <th style={{ fontWeight: 600 }}>Vehículo</th>
                <th style={{ fontWeight: 600 }}>Cliente</th>
                <th style={{ fontWeight: 600 }}>Vendedor</th>
                <th style={{ fontWeight: 600 }}>Fecha</th>
                <th style={{ fontWeight: 600, textAlign: 'right' }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {recentClosed.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>{c.car_interest ?? '—'}</td>
                  <td className="muted">{c.name}</td>
                  <td className="muted">{c.vendor?.name ?? '—'}</td>
                  <td className="muted tabular">{new Date(c.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="tabular gold-text" style={{ fontWeight: 600 }}>{fmtUSD(c.amount)}</div>
                    {currency === 'ARS' && <div style={{ fontSize: 10, color: '#999', textAlign: 'right' }}>{fmtARS(c.amount, fx)}</div>}
                  </td>
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
