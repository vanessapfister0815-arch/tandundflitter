// core/helpers.js — Formatierungs- und Utility-Funktionen

/**
 * Formatiert einen numerischen Betrag als Euro-String.
 * @param {number|null} value
 * @param {number} decimals — Standard 2
 */
export function fmt(value, decimals = 2) {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Formatiert einen numerischen Wert ohne Währungssymbol.
 */
export function fmtNum(value, decimals = 2) {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Formatiert ein Datum als deutsches Kurzformat: 12.03.2026
 * @param {string|Date} value
 */
export function fmtDate(value) {
  if (!value) return '—'
  const d = value instanceof Date ? value : new Date(value)
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/**
 * Gibt das aktuelle Jahr zurück.
 */
export function currentYear() {
  return new Date().getFullYear()
}

/**
 * Escaped HTML-Sonderzeichen für sichere DOM-Ausgabe.
 */
export function esc(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Setzt einen einzelnen CSS-Custom-Property auf :root.
 */
export function setCssVar(name, value) {
  document.documentElement.style.setProperty(name, value)
}

/**
 * Debounce: Führt fn erst nach `wait` ms ohne weiteren Aufruf aus.
 */
export function debounce(fn, wait = 300) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), wait)
  }
}

/**
 * Status-Label-Mapping für articles.status
 */
export const ARTICLE_STATUS_LABELS = {
  active: 'Aktiv',
  sold: 'Verkauft',
  returned: 'Retour',
  partial_sold: 'Teil-verkauft',
  lost: 'Verloren',
  discontinued: 'Eingestellt',
}

/**
 * Status-Label-Mapping für sales.status
 */
export const SALE_STATUS_LABELS = {
  pending: 'Ausstehend',
  successful: 'Erfolgreich',
  returned: 'Retour',
  disputed: 'Strittig',
}

/**
 * Status-Label-Mapping für sales.payout_status
 */
export const PAYOUT_STATUS_LABELS = {
  unpaid: 'Offen',
  partial: 'Teilweise',
  fully_paid: 'Bezahlt',
}

/**
 * Status-Label-Mapping für payouts.status
 */
export const PAYOUTS_STATUS_LABELS = {
  pending: 'Ausstehend',
  completed: 'Abgeschlossen',
  cancelled: 'Storniert',
}
