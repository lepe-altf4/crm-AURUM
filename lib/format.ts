export function fmtUSD(n: number): string {
  return 'US$' + n.toLocaleString('en-US')
}

export function fmtUSDk(n: number): string {
  if (n >= 1_000_000) return 'US$' + (n / 1_000_000).toFixed(2) + 'M'
  return 'US$' + Math.round(n / 1000) + 'k'
}

export function fmtKm(n: number): string {
  return n.toLocaleString('es-AR') + ' km'
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}
