export function daysBetween(d1, d2) {
  const diff = new Date(d2 + 'T12:00:00') - new Date(d1 + 'T12:00:00')
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}
export function daysUntil(dateStr) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T12:00:00')
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24))
}
export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}
export function fmtMoney(n) {
  return Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
export function calcProject(p) {
  const dias = daysBetween(p.start, p.end)
  const hours = Number(p.hours) || 8
  const diario = dias > 0 ? p.amount / dias : 0
  const porHora = dias > 0 ? p.amount / (dias * hours) : 0
  const left = daysUntil(p.end)
  const pct = dias > 0 ? Math.max(0, Math.min(100, ((dias - left) / dias) * 100)) : 0
  return { dias, diario, porHora, left, pct }
}
export function loadStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}
export function saveStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}
