'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Icon from '@/components/ui/icon'
import { StageBadge } from '@/components/ui/badge'
import ActivityTimeline from '@/components/activities/activity-timeline'
import type { Contact, Stage, Profile } from '@/lib/types'

type Tab = 'pipeline' | 'daily' | 'calendar' | 'metrics' | 'closed'

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

interface Props {
  initialLeads: Contact[]
  stages: Stage[]
  vendors: Profile[]
}

function pad2(n: number) { return String(n).padStart(2, '0') }
function todayStr() { return new Date().toISOString().split('T')[0] }

export default function SalesPanel({ initialLeads, stages: initialStages, vendors }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [leads, setLeads] = useState<Contact[]>(initialLeads)
  // Mirroring VisualPipeline: stages in local state + client-side fetch on mount
  const [stages, setStages] = useState<Stage[]>(initialStages)
  const [activeTab, setActiveTab] = useState<Tab>('pipeline')
  const [selectedLead, setSelectedLead] = useState<Contact | null>(null)
  const [editingDate, setEditingDate] = useState<string | null>(null)
  const [savingDate, setSavingDate] = useState(false)

  // Fetch stages client-side on mount — same as VisualPipeline does via realtime
  useEffect(() => {
    supabase.from('pipeline_stages').select('*').order('position')
      .then(({ data }) => { if (data && data.length > 0) setStages(data as Stage[]) })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime: leads changes
  useEffect(() => {
    const ch = supabase
      .channel('rt-sales-leads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        supabase
          .from('leads')
          .select('*, stage:pipeline_stages(*), vendor:users(*)')
          .order('updated_at', { ascending: false })
          .then(({ data }) => { if (data) setLeads(data as Contact[]) })
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime: stage name changes (same as VisualPipeline)
  useEffect(() => {
    const stagesCh = supabase
      .channel('rt-sales-stages')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pipeline_stages' }, payload => {
        setStages(prev => prev.map(s => s.id === (payload.new as Stage).id ? { ...s, ...payload.new as Stage } : s))
      })
      .subscribe()
    return () => { supabase.removeChannel(stagesCh) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const today = todayStr()

  // Closed stage = last by position; fallback 's5' if stages not loaded yet
  const closedStageId = stages.length > 0
    ? stages.reduce((a, b) => ((b as any).position ?? 0) > ((a as any).position ?? 0) ? b : a).id
    : 's5'

  const activeLeads = leads.filter(l => l.stage_id !== closedStageId)
  const closedLeads = leads.filter(l => l.stage_id === closedStageId)
  const leadsToday = activeLeads.filter(l => l.next_action_date === today)
  const overdueLeads = activeLeads.filter(l => l.next_action_date && l.next_action_date < today)
  const noActionLeads = activeLeads.filter(l => !l.next_action_date)

  async function saveNextActionDate(leadId: string, date: string) {
    setSavingDate(true)
    const val = date || null
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, next_action_date: val } : l))
    if (selectedLead?.id === leadId) setSelectedLead(prev => prev ? { ...prev, next_action_date: val } : prev)
    await supabase.from('leads').update({ next_action_date: val, updated_at: new Date().toISOString() }).eq('id', leadId)
    setEditingDate(null)
    setSavingDate(false)
    startTransition(() => router.refresh())
  }

  const TABS: { id: Tab; label: string; icon: string; count?: number }[] = [
    { id: 'pipeline', label: 'Pipeline', icon: 'pipeline', count: activeLeads.length },
    { id: 'daily', label: 'Trabajo diario', icon: 'list', count: leadsToday.length + overdueLeads.length },
    { id: 'calendar', label: 'Calendario', icon: 'calendar' },
    { id: 'metrics', label: 'Métricas', icon: 'target' },
    { id: 'closed', label: 'Cerrados', icon: 'checkCircle', count: closedLeads.length },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div className="module-header">
        <div>
          <div className="module-title">Panel de Ventas</div>
          <div className="module-sub">
            {activeLeads.length} activos · {overdueLeads.length} atrasados · {leadsToday.length} para hoy
          </div>
        </div>
        <div className="header-right">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', fontSize: 12, fontWeight: 500, borderRadius: 6, border: 'none',
                background: activeTab === tab.id ? 'var(--surface-2)' : 'transparent',
                color: activeTab === tab.id ? 'var(--text)' : 'var(--text-mute)',
                cursor: 'pointer', transition: 'all 0.12s',
                outline: activeTab === tab.id ? '1px solid var(--border-strong)' : 'none',
              }}
            >
              <Icon name={tab.icon} size={13} />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span style={{
                  background: tab.id === 'daily' && (overdueLeads.length > 0) ? '#E04444' : 'var(--gold)',
                  color: '#000', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10, lineHeight: '14px',
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Body — two-column when lead selected */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {activeTab === 'pipeline' && (
            <PipelineView leads={leads} stages={stages} onSelect={setSelectedLead} selected={selectedLead} />
          )}
          {activeTab === 'daily' && (
            <DailyView
              leadsToday={leadsToday} overdue={overdueLeads} noAction={noActionLeads}
              onSelect={setSelectedLead} selected={selectedLead}
            />
          )}
          {activeTab === 'calendar' && (
            <CalendarView leads={activeLeads} onSelect={setSelectedLead} />
          )}
          {activeTab === 'metrics' && (
            <MetricsView leads={leads} stages={stages} today={today} />
          )}
          {activeTab === 'closed' && (
            <ClosedView leads={closedLeads} onSelect={setSelectedLead} selected={selectedLead} />
          )}
        </div>

        {/* Lead detail panel */}
        {selectedLead && (
          <LeadDetailPanel
            lead={selectedLead}
            stages={stages}
            vendors={vendors}
            editingDate={editingDate}
            savingDate={savingDate}
            onClose={() => setSelectedLead(null)}
            onEditDate={setEditingDate}
            onSaveDate={saveNextActionDate}
          />
        )}
      </div>
    </div>
  )
}

/* ── PIPELINE VIEW ── */
function PipelineView({ leads, stages, onSelect, selected }: {
  leads: Contact[]; stages: Stage[]
  onSelect: (l: Contact) => void; selected: Contact | null
}) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 8 }}>
      {stages.map(stage => {
        const stageLeads = leads.filter(l => l.stage_id === stage.id)
        return (
          <div key={stage.id} style={{ minWidth: 220, flex: '0 0 220px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 4px', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {stage.name}
              </span>
              <span style={{ fontSize: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-mute)', borderRadius: 10, padding: '1px 7px' }}>
                {stageLeads.length}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stageLeads.map(lead => (
                <LeadCard key={lead.id} lead={lead} selected={selected?.id === lead.id} onClick={() => onSelect(lead)} />
              ))}
              {stageLeads.length === 0 && (
                <div style={{ padding: '16px 12px', textAlign: 'center', fontSize: 11, color: 'var(--text-mute)', background: 'var(--surface-1)', border: '1px dashed var(--border)', borderRadius: 6 }}>
                  Sin leads
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── DAILY WORK VIEW ── */
function DailyView({ leadsToday, overdue, noAction, onSelect, selected }: {
  leadsToday: Contact[]; overdue: Contact[]; noAction: Contact[]
  onSelect: (l: Contact) => void; selected: Contact | null
}) {
  const cols = [
    { title: 'Leads de hoy', icon: 'clock', leads: leadsToday, accent: 'var(--gold)', desc: 'Próxima acción = hoy' },
    { title: 'Atrasados', icon: 'alert', leads: overdue, accent: '#E04444', desc: 'Próxima acción vencida' },
    { title: 'Sin próxima acción', icon: 'more', leads: noAction, accent: 'var(--text-mute)', desc: 'Sin fecha definida' },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, alignItems: 'flex-start' }}>
      {cols.map(col => (
        <div key={col.title}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '8px 12px', background: 'var(--surface-1)', border: '1px solid var(--border)', borderTopWidth: 2, borderTopColor: col.accent, borderRadius: 8 }}>
            <span style={{ color: col.accent, display: 'flex' }}><Icon name={col.icon} size={14} /></span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{col.title}</div>
              <div style={{ fontSize: 10, color: 'var(--text-mute)' }}>{col.desc} · {col.leads.length} leads</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {col.leads.map(lead => (
              <LeadCard key={lead.id} lead={lead} selected={selected?.id === lead.id} onClick={() => onSelect(lead)} showDate />
            ))}
            {col.leads.length === 0 && (
              <div style={{ padding: '20px 12px', textAlign: 'center', fontSize: 11, color: 'var(--text-mute)', background: 'var(--surface-1)', border: '1px dashed var(--border)', borderRadius: 6 }}>
                ✓ Sin pendientes
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── CALENDAR VIEW ── */
function CalendarView({ leads, onSelect }: { leads: Contact[]; onSelect: (l: Contact) => void }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDow = new Date(year, month, 1).getDay()
  const today = todayStr()

  const leadsByDate: Record<string, Contact[]> = {}
  leads.forEach(l => {
    if (!l.next_action_date) return
    const d = l.next_action_date.split('T')[0]
    if (!leadsByDate[d]) leadsByDate[d] = []
    leadsByDate[d].push(l)
  })

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1)
  }

  const totalWithAction = leads.filter(l => l.next_action_date).length
  const monthLeads = leads.filter(l => {
    if (!l.next_action_date) return false
    const d = new Date(l.next_action_date + 'T12:00:00')
    return d.getFullYear() === year && d.getMonth() === month
  })

  // Atrasados: cualquier lead con fecha < hoy, siempre visibles sin importar el mes
  const overdueAll = leads.filter(l => l.next_action_date && l.next_action_date.split('T')[0] < today)

  return (
    <div>
      {/* Banner de atrasados — siempre visible */}
      {overdueAll.length > 0 && (
        <div style={{ background: 'rgba(224,68,68,0.08)', border: '1px solid rgba(224,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{ color: '#E04444', flexShrink: 0, display: 'flex', marginTop: 1 }}><Icon name="alert" size={14} /></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#E04444', marginBottom: 6 }}>
              {overdueAll.length} lead{overdueAll.length > 1 ? 's' : ''} atrasado{overdueAll.length > 1 ? 's' : ''}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {overdueAll.map(l => (
                <button
                  key={l.id}
                  onClick={() => onSelect(l)}
                  style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(224,68,68,0.15)', border: '1px solid rgba(224,68,68,0.4)', color: '#E04444', cursor: 'pointer' }}
                >
                  {l.name} · {new Date(l.next_action_date! + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Calendar header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn" onClick={prevMonth} style={{ padding: '5px 10px' }}>‹</button>
          <span style={{ fontSize: 15, fontWeight: 600, minWidth: 160, textAlign: 'center' }}>
            {MONTHS_ES[month]} {year}
          </span>
          <button className="btn" onClick={nextMonth} style={{ padding: '5px 10px' }}>›</button>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-mute)' }}>
          {monthLeads.length} acciones en este mes · {totalWithAction} leads con fecha
        </div>
      </div>

      {/* Day-of-week headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        {DAYS_ES.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: 'var(--text-mute)', padding: '4px 0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {/* Empty cells before first day */}
        {Array(firstDow).fill(null).map((_, i) => (
          <div key={`empty-${i}`} style={{ minHeight: 80, background: 'var(--surface-1)', borderRadius: 6, opacity: 0.3 }} />
        ))}
        {/* Day cells */}
        {Array(daysInMonth).fill(null).map((_, i) => {
          const day = i + 1
          const dateStr = `${year}-${pad2(month + 1)}-${pad2(day)}`
          const dayLeads = leadsByDate[dateStr] ?? []
          const isToday = dateStr === today
          const isPast = dateStr < today
          return (
            <div
              key={day}
              style={{
                minHeight: 80, background: isToday ? 'rgba(250,197,28,0.06)' : 'var(--surface-1)',
                border: `1px solid ${isToday ? 'var(--gold)' : 'var(--border)'}`,
                borderRadius: 6, padding: '6px 7px', position: 'relative',
              }}
            >
              <div style={{
                fontSize: 11, fontWeight: isToday ? 700 : 400,
                color: isToday ? 'var(--gold)' : isPast ? 'var(--text-mute)' : 'var(--text-dim)',
                marginBottom: 4,
              }}>
                {day}
              </div>
              {dayLeads.slice(0, 3).map(lead => (
                <div
                  key={lead.id}
                  onClick={() => onSelect(lead)}
                  title={lead.name}
                  style={{
                    fontSize: 9, lineHeight: '14px', padding: '1px 5px', borderRadius: 3, marginBottom: 2,
                    background: 'var(--gold)', color: '#000', fontWeight: 600,
                    cursor: 'pointer', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                  }}
                >
                  {lead.name}
                </div>
              ))}
              {dayLeads.length > 3 && (
                <div style={{ fontSize: 9, color: 'var(--text-mute)', marginTop: 2 }}>
                  +{dayLeads.length - 3} más
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 14, fontSize: 11, color: 'var(--text-mute)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, background: 'var(--gold)', borderRadius: 2 }} />
          Acción planificada
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, border: '1px solid var(--gold)', borderRadius: 2 }} />
          Hoy
        </span>
      </div>
    </div>
  )
}

/* ── METRICS VIEW ── */
function MetricsView({ leads, stages, today }: { leads: Contact[]; stages: Stage[]; today: string }) {
  // Determine closed stage dynamically (last by position) — no hardcoded 's5'
  const closedStageId = stages.length > 0
    ? stages.reduce((a, b) => ((b as any).position ?? 0) > ((a as any).position ?? 0) ? b : a).id
    : 's5'

  const activeLeads = leads.filter(l => l.stage_id !== closedStageId)
  const closedLeads = leads.filter(l => l.stage_id === closedStageId)
  const overdueLeads = activeLeads.filter(l => l.next_action_date && l.next_action_date < today)
  const noActionLeads = activeLeads.filter(l => !l.next_action_date)

  // Stage breakdown: all non-closed stages with their lead counts
  const stageBreakdown = stages
    .filter(s => s.id !== closedStageId)
    .map(s => ({ ...s, count: activeLeads.filter(l => l.stage_id === s.id).length }))
    .sort((a, b) => b.count - a.count)

  const topStage = stageBreakdown[0]
  const topCount = topStage?.count ?? 0
  const topName = topStage?.name ?? '—'
  const breakdownDetail = stageBreakdown
    .filter(s => s.count > 0)
    .slice(0, 3)
    .map(s => `${s.name}: ${s.count}`)
    .join(' · ') || 'Sin leads activos'

  const metrics = [
    {
      label: 'Leads Activos',
      value: activeLeads.length,
      desc: '¿Cuántos leads tenemos en proceso?',
      detail: 'Cuenta los leads donde Estado = Activo',
      color: 'var(--gold)',
      icon: 'leads',
    },
    {
      label: 'Por Etapa',
      value: topCount,
      desc: `${topCount > 0 ? `${topCount} en ${topName}` : '¿En qué fase se atascan?'}`,
      detail: breakdownDetail,
      color: '#60a5fa',
      icon: 'pipeline',
    },
    {
      label: 'Atrasados',
      value: overdueLeads.length,
      desc: '¿Tenemos leads olvidados?',
      detail: 'Leads con Fecha próxima acción vencida',
      color: '#E04444',
      icon: 'clock',
    },
    {
      label: 'Sin Acción',
      value: noActionLeads.length,
      desc: '¿Estamos haciendo seguimiento?',
      detail: 'Leads sin Fecha próxima acción definida',
      color: '#f97316',
      icon: 'alert',
    },
    {
      label: 'Ventas',
      value: closedLeads.length,
      desc: '¿Se están cerrando ventas?',
      detail: 'Leads en Etapa = Cerrado',
      color: '#22c55e',
      icon: 'checkCircle',
    },
  ]

  return (
    <div style={{ maxWidth: 860 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
        {metrics.map(m => (
          <div key={m.label} style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderTopWidth: 2, borderTopColor: m.color, borderRadius: 8, padding: '18px 16px' }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: m.color, lineHeight: 1, marginBottom: 8 }}>{m.value}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{m.label}</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic', marginBottom: 6 }}>{m.desc}</div>
            <div style={{ fontSize: 10, color: 'var(--text-mute)', lineHeight: 1.4 }}>{m.detail}</div>
          </div>
        ))}
      </div>

      {/* Stage breakdown */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>
          Distribución por Etapa
        </div>
        {stageBreakdown.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--text-mute)', padding: '12px 0' }}>Sin leads activos en ninguna etapa.</div>
        ) : stageBreakdown.map(s => {
          const pct = activeLeads.length > 0 ? (s.count / activeLeads.length) * 100 : 0
          return (
            <div key={s.id} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{s.name}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                  {s.count} <span style={{ color: 'var(--text-mute)', fontWeight: 400 }}>({pct.toFixed(0)}%)</span>
                </span>
              </div>
              <div style={{ height: 4, background: 'var(--surface-2)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: 'var(--gold)', borderRadius: 2, transition: 'width 0.4s' }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── CLOSED VIEW ── */
function ClosedView({ leads, onSelect, selected }: {
  leads: Contact[]; onSelect: (l: Contact) => void; selected: Contact | null
}) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-mute)', marginBottom: 14 }}>
        {leads.length} operaciones cerradas · Solo consulta
      </div>
      {leads.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', fontSize: 12, color: 'var(--text-mute)', background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 8 }}>
          Sin ventas cerradas aún.
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th style={{ fontWeight: 600 }}>Cliente</th>
                <th style={{ fontWeight: 600 }}>Auto de interés</th>
                <th style={{ fontWeight: 600 }}>Vendedor</th>
                <th style={{ fontWeight: 600 }}>Monto</th>
                <th style={{ fontWeight: 600 }}>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(l => (
                <tr
                  key={l.id}
                  style={{ cursor: 'pointer', background: selected?.id === l.id ? 'var(--surface-2)' : undefined }}
                  onClick={() => onSelect(l)}
                >
                  <td style={{ fontWeight: 500 }}>{l.name}</td>
                  <td className="muted">{l.car_interest ?? '—'}</td>
                  <td className="muted">{(l.vendor as any)?.name ?? '—'}</td>
                  <td className="tabular" style={{ fontWeight: 600, color: 'var(--gold)' }}>
                    {l.amount ? `U$S ${l.amount.toLocaleString('es-AR')}` : '—'}
                  </td>
                  <td className="muted tabular">
                    {new Date(l.updated_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ── LEAD DETAIL PANEL ── */
function LeadDetailPanel({ lead, stages, vendors, editingDate, savingDate, onClose, onEditDate, onSaveDate }: {
  lead: Contact; stages: Stage[]; vendors: Profile[]
  editingDate: string | null; savingDate: boolean
  onClose: () => void
  onEditDate: (id: string) => void
  onSaveDate: (id: string, date: string) => void
}) {
  const [dateInput, setDateInput] = useState(lead.next_action_date ?? '')
  const phone = (lead.phone ?? '').replace(/[^\d]/g, '')
  const firstName = lead.name.split(' ')[0]
  const car = lead.car_interest ?? 'el vehículo de tu interés'
  const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(`Hola ${firstName}, te contactamos desde AURUM CARS respecto al ${car}.`)}`

  // Days since last contact
  const daysSince = Math.floor((Date.now() - new Date(lead.updated_at).getTime()) / 86_400_000)

  const rows: [string, string][] = [
    ['Nombre', lead.name],
    ['Auto de interés', lead.car_interest ?? '—'],
    ['Etapa', (lead.stage as any)?.name ?? lead.stage_id],
    ['Responsable', (lead.vendor as any)?.name ?? '—'],
    ['Origen', lead.origin ?? '—'],
    ['Monto estimado', lead.amount ? `U$S ${lead.amount.toLocaleString('es-AR')}` : '—'],
    ['Días sin contacto', `${daysSince}d`],
  ]

  return (
    <div style={{
      width: 320, minWidth: 320, borderLeft: '1px solid var(--border)', overflowY: 'auto',
      background: 'var(--surface-1)', display: 'flex', flexDirection: 'column',
    }}>
      {/* Panel header */}
      <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{lead.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-mute)' }}>{lead.car_interest ?? '—'}</div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'var(--text-mute)', cursor: 'pointer', padding: 4 }}
        >
          <Icon name="close" size={14} />
        </button>
      </div>

      <div style={{ padding: '14px 18px', flex: 1 }}>
        {/* Info principal */}
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
          Info principal
        </div>
        <div className="card" style={{ padding: '4px 14px', marginBottom: 16 }}>
          {rows.map(([k, v]) => (
            <div className="spec-row" key={k}>
              <span className="k">{k}</span>
              <span className="v" style={k === 'Monto estimado' ? { color: 'var(--gold)' } : k === 'Días sin contacto' && daysSince > 7 ? { color: '#E04444' } : undefined}>{v}</span>
            </div>
          ))}
        </div>

        {/* Seguimiento */}
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
          Seguimiento
        </div>
        <div className="card" style={{ padding: '12px 14px', marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-mute)', marginBottom: 6 }}>Próxima acción</div>
          {editingDate === lead.id ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="date"
                className="input"
                value={dateInput}
                onChange={e => setDateInput(e.target.value)}
                style={{ flex: 1, fontSize: 12 }}
              />
              <button
                className="btn btn-primary"
                style={{ padding: '4px 10px', fontSize: 11 }}
                disabled={savingDate}
                onClick={() => onSaveDate(lead.id, dateInput)}
              >
                {savingDate ? '…' : 'OK'}
              </button>
            </div>
          ) : (
            <div
              onClick={() => { setDateInput(lead.next_action_date ?? ''); onEditDate(lead.id) }}
              style={{
                padding: '6px 10px', borderRadius: 6, border: '1px dashed var(--border-strong)',
                cursor: 'pointer', fontSize: 12,
                color: lead.next_action_date
                  ? (lead.next_action_date < new Date().toISOString().split('T')[0] ? '#E04444' : 'var(--gold)')
                  : 'var(--text-mute)',
              }}
            >
              {lead.next_action_date
                ? new Date(lead.next_action_date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'short' })
                : '+ Definir fecha de seguimiento'}
            </div>
          )}
        </div>

        {/* WhatsApp */}
        {lead.phone && (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-wa"
            style={{ width: '100%', justifyContent: 'center', marginBottom: 16, display: 'flex' }}
          >
            <Icon name="wa" size={12} /> Contactar por WhatsApp
          </a>
        )}

        {/* Historial */}
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
          Historial de actividades
        </div>
        <ActivityTimeline contactId={lead.id} />
      </div>
    </div>
  )
}

/* ── SHARED LEAD CARD ── */
function LeadCard({ lead, selected, onClick, showDate }: {
  lead: Contact; selected: boolean; onClick: () => void; showDate?: boolean
}) {
  const today = todayStr()
  const isOverdue = lead.next_action_date && lead.next_action_date < today
  const isToday = lead.next_action_date === today

  return (
    <div
      onClick={onClick}
      style={{
        background: selected ? 'var(--surface-2)' : 'var(--surface-1)',
        border: `1px solid ${selected ? 'var(--border-strong)' : 'var(--border)'}`,
        borderRadius: 6, padding: '10px 12px', cursor: 'pointer',
        transition: 'background 0.1s, border-color 0.1s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', flex: 1, lineHeight: 1.3 }}>{lead.name}</div>
        {(lead.stage as any)?.name && (
          <StageBadge stageId={lead.stage_id} stageName={(lead.stage as any).name} />
        )}
      </div>
      {lead.car_interest && (
        <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 3 }}>{lead.car_interest}</div>
      )}
      {showDate && lead.next_action_date && (
        <div style={{
          fontSize: 10, marginTop: 6, padding: '2px 6px', borderRadius: 4, display: 'inline-block',
          background: isOverdue ? 'rgba(224,68,68,0.15)' : isToday ? 'rgba(250,197,28,0.15)' : 'var(--surface-2)',
          color: isOverdue ? '#E04444' : isToday ? 'var(--gold)' : 'var(--text-mute)',
        }}>
          {new Date(lead.next_action_date + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
        </div>
      )}
      {lead.amount ? (
        <div style={{ fontSize: 10, color: 'var(--text-mute)', marginTop: 4 }}>
          U$S {lead.amount.toLocaleString('es-AR')}
        </div>
      ) : null}
    </div>
  )
}
