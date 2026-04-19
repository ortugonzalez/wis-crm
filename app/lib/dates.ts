export function formatDateTime(dateStr: string | null) {
  if (!dateStr) return 'Sin fecha'
  return new Date(dateStr).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDate(dateStr: string | null) {
  if (!dateStr) return 'Sin fecha'
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function timeAgo(dateStr: string | null) {
  if (!dateStr) return 'sin registro'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'reci en este momento'
  if (mins < 60) return `hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  return `hace ${days}d`
}

export function toDatetimeLocal(dateStr: string | null) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const offsetMs = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

export function isOverdue(dateStr: string | null) {
  if (!dateStr) return false
  return new Date(dateStr).getTime() < Date.now()
}
