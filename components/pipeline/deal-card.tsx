'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Contact, Profile } from '@/lib/types'

interface Props {
  contact: Contact
  vendors: Profile[]
  overlay?: boolean
}

export default function DealCard({ contact, vendors, overlay = false }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: contact.id,
    data: { stageId: contact.stage_id },
  })

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined

  const vendor = vendors.find(v => v.id === contact.vendor_id)

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={overlay ? undefined : style}
      {...(overlay ? {} : { ...listeners, ...attributes })}
      className={`deal${isDragging && !overlay ? ' dragging' : ''}`}
    >
      <div className="deal-name">{contact.name}</div>
      <div className="deal-car">{contact.car_interest ?? '—'}</div>
      <div className="deal-foot">
        <div className="deal-vendor">
          <span className="av">{vendor?.initials ?? '??'}</span>
          <span>{vendor?.name.split(' ')[0] ?? '—'}</span>
        </div>
        <div className={`deal-days${(contact.days ?? 0) > 3 ? ' warn' : ''}`}>
          {contact.days ?? 0}d
        </div>
      </div>
    </div>
  )
}
