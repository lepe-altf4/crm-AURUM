interface BadgeProps {
  variant?: 'default' | 'gold' | 'white' | 'mute'
  dot?: boolean
  children: React.ReactNode
}

export default function Badge({ variant = 'default', dot = false, children }: BadgeProps) {
  const cls = {
    default: 'badge',
    gold: 'badge badge-gold',
    white: 'badge badge-white',
    mute: 'badge badge-mute',
  }[variant]

  return (
    <span className={cls}>
      {dot && <span className="dot" />}
      {children}
    </span>
  )
}

// Stage badge using stage_id
const STAGE_VARIANT: Record<string, 'mute' | 'white' | 'gold'> = {
  s1: 'mute',
  s2: 'white',
  s3: 'white',
  s4: 'gold',
  s5: 'gold',
}

interface StageBadgeProps {
  stageId: string
  stageName: string
}

export function StageBadge({ stageId, stageName }: StageBadgeProps) {
  return (
    <Badge variant={STAGE_VARIANT[stageId] ?? 'mute'} dot>
      {stageName}
    </Badge>
  )
}
