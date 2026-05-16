'use client'

import { useState, useMemo, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Drawer from '@/components/ui/drawer'
import Icon from '@/components/ui/icon'
import { StageBadge } from '@/components/ui/badge'
import type { InventoryItem, Contact } from '@/lib/types'

const STATUS_LABEL = { available: 'Disponible', reserved: 'Reservado', sold: 'Vendido' } as const
const STATUS_BADGE_CLASS = { available: 'badge badge-gold', reserved: 'badge badge-white', sold: 'badge badge-mute' }

// #6 — formato estricto U$S 000.000
function fmtUSD(n: number) {
  return 'U$S ' + Math.round(n).toLocaleString('es-AR')
}
function fmtARS(n: number, fx: number) {
  return '$ ' + Math.round(n * fx).toLocaleString('es-AR')
}

interface Props {
  initialInventory: InventoryItem[]
  contacts: (Contact & { stage?: { id: string; name: string; order: number; created_at: string } | null })[]
}

export default function StockManager({ initialInventory, contacts }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [, startTransition] = useTransition()
  const [items, setItems] = useState<InventoryItem[]>(initialInventory)
  const [brandFilter, setBrandFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [drawerItem, setDrawerItem] = useState<InventoryItem | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState({ brand: '', model: '', year: '2025', km: '0', price: '0', status: 'available' })
  const [saving, setSaving] = useState(false)
  // #5 — tipo de cambio desde localStorage
  const [fx, setFx] = useState(1200)

  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await supabase.from('settings').select('value').eq('key', 'fx_rate').single()
        if (data?.value) setFx(Number(data.value))
        else {
          const stored = localStorage.getItem('aurum_fx')
          if (stored) setFx(Number(stored))
        }
      } catch {
        const stored = localStorage.getItem('aurum_fx')
        if (stored) setFx(Number(stored))
      }
    })()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const brands = useMemo(() => Array.from(new Set(items.map(u => u.brand))).sort(), [items])

  const filtered = useMemo(() =>
    items.filter(u => {
      if (brandFilter !== 'all' && u.brand !== brandFilter) return false
      if (statusFilter !== 'all' && u.status !== statusFilter) return false
      if (priceMin && u.price < +priceMin) return false
      if (priceMax && u.price > +priceMax) return false
      return true
    }),
    [items, brandFilter, statusFilter, priceMin, priceMax]
  )

  function interestedFor(item: InventoryItem) {
    return contacts.filter(c => (c.car_interest ?? '').toLowerCase().includes(item.model.toLowerCase()))
  }

  async function changeStatus(id: string, status: InventoryItem['status']) {
    setItems(prev => prev.map(u => u.id === id ? { ...u, status } : u))
    setDrawerItem(prev => prev?.id === id ? { ...prev, status } : prev)
    await supabase.from('stock').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    startTransition(() => router.refresh())
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!addForm.brand || !addForm.model) return
    setSaving(true)
    const { data } = await supabase
      .from('stock')
      .insert({ ...addForm, year: +addForm.year, km: +addForm.km, price: +addForm.price })
      .select()
      .single()
    if (data) setItems(prev => [data as InventoryItem, ...prev])
    setAddForm({ brand: '', model: '', year: '2025', km: '0', price: '0', status: 'available' })
    setAddOpen(false)
    setSaving(false)
    startTransition(() => router.refresh())
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta unidad?')) return
    setItems(prev => prev.filter(u => u.id !== id))
    await supabase.from('stock').delete().eq('id', id)
    startTransition(() => router.refresh())
  }

  return (
    <>
      <div className="module-header">
        <div>
          <div className="module-title">Stock Manager</div>
          <div className="module-sub">
            {filtered.length} unidades · {items.filter(u => u.status === 'available').length} disponibles
          </div>
        </div>
        <div className="header-right">
          <select className="select" value={brandFilter} onChange={e => setBrandFilter(e.target.value)}>
            <option value="all">Todas las marcas</option>
            {brands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select className="select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">Todos los estados</option>
            <option value="available">Disponible</option>
            <option value="reserved">Reservado</option>
            <option value="sold">Vendido</option>
          </select>
          <input className="input" type="number" placeholder="Precio mín" value={priceMin} onChange={e => setPriceMin(e.target.value)} style={{ minWidth: 110 }} />
          <input className="input" type="number" placeholder="Precio máx" value={priceMax} onChange={e => setPriceMax(e.target.value)} style={{ minWidth: 110 }} />
          <button className="btn btn-primary" onClick={() => setAddOpen(true)}><Icon name="plus" size={14} /> Agregar unidad</button>
        </div>
      </div>

      <div className="module-body">
        <div className="card">
          {filtered.length === 0 ? (
            <div className="empty">
              <div style={{ color: 'var(--text-mute)' }}><Icon name="car" size={32} /></div>
              <div className="empty-title">Sin unidades</div>
              <div className="empty-sub">Ajustá los filtros o agregá una unidad.</div>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th style={{ fontWeight: 600 }}>Marca</th>
                  <th style={{ fontWeight: 600 }}>Modelo</th>
                  <th style={{ fontWeight: 600 }}>Año</th>
                  <th style={{ fontWeight: 600 }}>KM</th>
                  <th style={{ fontWeight: 600 }}>Precio USD</th>
                  <th style={{ fontWeight: 600 }}>Estado</th>
                  <th style={{ textAlign: 'right', fontWeight: 600 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} style={{ cursor: 'pointer' }} onClick={() => setDrawerItem(u)}>
                    <td style={{ fontWeight: 500 }}>{u.brand}</td>
                    <td className="muted">{u.model}</td>
                    <td className="muted tabular">{u.year}</td>
                    <td className="muted tabular">{u.km.toLocaleString('es-AR')}</td>
                    {/* #6 — formato U$S 000.000 + ARS abajo en gris */}
                    <td className="tabular">
                      <div style={{ fontWeight: 600 }}>{fmtUSD(u.price)}</div>
                      <div style={{ fontSize: 10, color: '#999', marginTop: 1 }}>{fmtARS(u.price, fx)}</div>
                    </td>
                    <td>
                      <span className={STATUS_BADGE_CLASS[u.status]}>
                        <span className="dot" />{STATUS_LABEL[u.status]}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn btn-sm" onClick={e => { e.stopPropagation(); setDrawerItem(u) }}>
                          Ver detalle <Icon name="arrowRight" size={10} />
                        </button>
                        <button className="btn-ghost btn-sm" onClick={e => { e.stopPropagation(); handleDelete(u.id) }} style={{ color: 'var(--danger)' }}>
                          <Icon name="close" size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detail Drawer */}
      {drawerItem && (
        <Drawer
          open={!!drawerItem}
          onClose={() => setDrawerItem(null)}
          title={`${drawerItem.brand} ${drawerItem.model}`}
          footer={
            <>
              {drawerItem.status !== 'available' && <button className="btn" onClick={() => changeStatus(drawerItem.id, 'available')}>Marcar disponible</button>}
              {drawerItem.status !== 'reserved' && <button className="btn" onClick={() => changeStatus(drawerItem.id, 'reserved')}>Reservar</button>}
              {drawerItem.status !== 'sold' && <button className="btn btn-primary" onClick={() => changeStatus(drawerItem.id, 'sold')}>Marcar vendido</button>}
            </>
          }
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <span className={STATUS_BADGE_CLASS[drawerItem.status]}><span className="dot" />{STATUS_LABEL[drawerItem.status]}</span>
            <span style={{ fontSize: 11, color: 'var(--text-mute)' }}>{drawerItem.brand} · {drawerItem.year}</span>
          </div>

          <div className="card" style={{ marginBottom: 18, padding: '4px 16px' }}>
            {[
              ['Año', String(drawerItem.year)],
              ['Kilometraje', `${drawerItem.km.toLocaleString('es-AR')} km`],
              ['Precio USD', fmtUSD(drawerItem.price)],
              ['Precio ARS', fmtARS(drawerItem.price, fx)],
              ['Transmisión', 'Automática'],
              ['Combustible', 'Gasolina premium'],
              ['VIN', `WP0AB2A99${drawerItem.id.slice(0, 8).toUpperCase()}`],
            ].map(([k, v]) => (
              <div className="spec-row" key={k}>
                <span className="k">{k}</span>
                <span className="v" style={k === 'Precio USD' ? { color: 'var(--gold)' } : k === 'Precio ARS' ? { color: '#999' } : undefined}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 11, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, marginBottom: 10 }}>
            Interesados desde Leads Hub
          </div>
          {(() => {
            const ints = interestedFor(drawerItem)
            if (!ints.length) return <div style={{ fontSize: 12, color: 'var(--text-mute)', padding: '12px 0' }}>Sin leads vinculados.</div>
            return (
              <div>
                {ints.map(l => (
                  <div className="interested-item" key={l.id}>
                    <div className="av">{l.name.split(' ').slice(0, 2).map(p => p[0]).join('')}</div>
                    <div className="meta">
                      <div className="nm">{l.name}</div>
                      <div className="sub">{l.origin} · {new Date(l.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}</div>
                    </div>
                    {l.stage && <StageBadge stageId={l.stage_id} stageName={l.stage.name} />}
                  </div>
                ))}
              </div>
            )
          })()}
        </Drawer>
      )}

      {/* Add Unit Drawer */}
      <Drawer
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Agregar unidad"
        footer={
          <>
            <button className="btn" onClick={() => setAddOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>{saving ? 'Guardando…' : 'Agregar'}</button>
          </>
        }
      >
        <form onSubmit={handleAdd}>
          <div className="field"><label className="label">Marca</label><input className="input-full" value={addForm.brand} onChange={e => setAddForm({ ...addForm, brand: e.target.value })} placeholder="Porsche" required /></div>
          <div className="field"><label className="label">Modelo</label><input className="input-full" value={addForm.model} onChange={e => setAddForm({ ...addForm, model: e.target.value })} placeholder="Cayenne S" required /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field"><label className="label">Año</label><input className="input-full" type="number" value={addForm.year} onChange={e => setAddForm({ ...addForm, year: e.target.value })} /></div>
            <div className="field"><label className="label">KM</label><input className="input-full" type="number" value={addForm.km} onChange={e => setAddForm({ ...addForm, km: e.target.value })} /></div>
          </div>
          <div className="field"><label className="label">Precio (USD)</label><input className="input-full" type="number" value={addForm.price} onChange={e => setAddForm({ ...addForm, price: e.target.value })} placeholder="165000" /></div>
          <div className="field"><label className="label">Estado</label>
            <select className="select-full" value={addForm.status} onChange={e => setAddForm({ ...addForm, status: e.target.value })}>
              <option value="available">Disponible</option>
              <option value="reserved">Reservado</option>
              <option value="sold">Vendido</option>
            </select>
          </div>
        </form>
      </Drawer>
    </>
  )
}
