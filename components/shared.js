// components/shared.js — Wiederverwendbare UI-Bausteine

/**
 * Erstellt eine KPI-Karte.
 * @param {string} label — Anzeigetext
 * @param {string} value — Formatierter Wert
 * @param {string} [sub]  — Optionaler Subwert
 */
export function kpiCard(label, value, sub = '') {
  return `
    <div class="kpi-card">
      <div class="kpi-label">${label}</div>
      <div class="kpi-value">${value}</div>
      ${sub ? `<div class="kpi-sub">${sub}</div>` : ''}
    </div>
  `
}

/**
 * Erstellt einen Status-Badge.
 * @param {string} label
 * @param {'green'|'amber'|'red'|'default'} color
 */
export function badge(label, color = 'default') {
  const colorMap = {
    green:   'var(--neu-green)',
    amber:   'var(--neu-amber)',
    red:     'var(--neu-red)',
    default: 'var(--neu-accent)',
  }
  const bg = color === 'default'
    ? 'var(--neu-accent-light)'
    : `${colorMap[color]}22`
  const text = colorMap[color] ?? colorMap.default

  return `<span class="badge" style="background:${bg};color:${text}">${label}</span>`
}

/**
 * Erstellt eine leere State-Meldung.
 */
export function emptyState(message = 'Keine Einträge') {
  return `<div class="empty-state">${message}</div>`
}

/**
 * Erstellt eine Fehlermeldung.
 */
export function errorState(message = 'Fehler beim Laden') {
  return `<div class="error-state">${message}</div>`
}

/**
 * Einfacher Ladeindikator als HTML-String.
 */
export function loaderHtml() {
  return `<div class="loader-inline"><div class="loader-dot"></div></div>`
}

/**
 * Rendert eine zweispaltige Zeile (Label + Wert) für Detailansichten.
 */
export function detailRow(label, value) {
  return `
    <div class="detail-row">
      <span class="detail-label">${label}</span>
      <span class="detail-value">${value ?? '—'}</span>
    </div>
  `
}
