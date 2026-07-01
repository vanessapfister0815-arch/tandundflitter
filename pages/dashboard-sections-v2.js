/**
 * dashboard-sections-v2.js — Inventarjahrgänge · Historische Entwicklung
 * Tand & Flitter · v1.3 · 2026-07-01
 * v1.3: Feldnamen korrigiert (vintage_year, sold_revenue, delta_pct, delta_eur)
 *       Ø-Verkauf als sold_revenue/sold_count berechnet
 *       HistoryCharts: kompaktes Layout, SVG-Schrift als relative Einheit
 */

// -------------------------------------------------------------------------
// Hilfsfunktionen
// -------------------------------------------------------------------------

function fmt(n) {
  return parseFloat(n || 0).toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' €'
}

function fmtN(n) {
  return parseFloat(n || 0).toLocaleString('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

// -------------------------------------------------------------------------
// 5 — VintagesTable
// Felder vom RPC get_inventory_vintages():
//   vintage_year, active_value, active_count,
//   sold_revenue, sold_count, delta_pct, delta_eur
// -------------------------------------------------------------------------

export function VintagesTable({ vintages }) {
  const rows = vintages || []

  // NULL-Jahrgänge trennen
  const withYear = rows.filter(r => r.vintage_year !== null && r.vintage_year !== undefined)
  const noYear   = rows.filter(r => r.vintage_year === null || r.vintage_year === undefined)

  withYear.sort((a, b) => parseInt(b.vintage_year) - parseInt(a.vintage_year))

  // Σ-Zeile manuell summieren
  const all    = [...withYear, ...noYear]
  const totals = all.reduce((acc, r) => {
    acc.active_value  += parseFloat(r.active_value  || 0)
    acc.active_count  += parseInt(r.active_count    || 0)
    acc.sold_revenue  += parseFloat(r.sold_revenue  || 0)
    acc.sold_count    += parseInt(r.sold_count      || 0)
    return acc
  }, { active_value: 0, active_count: 0, sold_revenue: 0, sold_count: 0 })

  function avgCell(r) {
    const sc = parseInt(r.sold_count   || 0)
    const sv = parseFloat(r.sold_revenue || 0)
    if (sc === 0) return '<td class="vt-num vt-muted">—</td>'
    return `<td class="vt-num">${fmt(sv / sc)}</td>`
  }

  function deltaCell(r) {
    const pct = r.delta_pct
    if (pct === null || pct === undefined) return '<td class="vt-num vt-muted">—</td>'
    const p     = parseFloat(pct)
    const color = p > 0 ? 'var(--neu-green)' : p < 0 ? 'var(--neu-red)' : 'var(--neu-text-muted)'
    const sign  = p > 0 ? '+' : ''
    const title = fmt(parseFloat(r.delta_eur || 0))
    return `<td class="vt-num" style="color:${color}" title="${title}">${sign}${p.toFixed(1)} %</td>`
  }

  function renderRow(r, opts = {}) {
    const label = opts.noYear
      ? '<span style="color:var(--neu-text-muted);font-style:italic;">kein Jahrgang</span>'
      : opts.total ? 'Σ Gesamt' : r.vintage_year
    const cls      = opts.total ? 'vt-row vt-total' : 'vt-row'
    const avgTd    = opts.total || opts.noYear ? '<td class="vt-num vt-muted">—</td>' : avgCell(r)
    const deltaTd  = opts.total || opts.noYear ? '<td class="vt-num vt-muted">—</td>' : deltaCell(r)

    return `
      <tr class="${cls}">
        <td class="vt-label">${label}</td>
        <td class="vt-num">${fmt(r.active_value  || 0)}</td>
        <td class="vt-num vt-muted">${fmtN(r.active_count || 0)}</td>
        ${avgTd}
        <td class="vt-num">${fmt(r.sold_revenue  || 0)}</td>
        <td class="vt-num vt-muted">${fmtN(r.sold_count   || 0)}</td>
        ${deltaTd}
      </tr>
    `
  }

  const bodyRows = [
    ...withYear.map(r => renderRow(r)),
    ...noYear.map(r  => renderRow(r, { noYear: true })),
  ].join('')

  const totalRow = renderRow({
    active_value:  totals.active_value,
    active_count:  totals.active_count,
    sold_revenue:  totals.sold_revenue,
    sold_count:    totals.sold_count,
  }, { total: true })

  return `
    <div class="dash-card">
      <div class="section-title">Inventarjahrgänge</div>
      <div class="vt-wrap">
        <table class="vt-table">
          <thead>
            <tr>
              <th class="vt-label">Jahrgang</th>
              <th class="vt-num">Aktiv €</th>
              <th class="vt-num vt-muted">#</th>
              <th class="vt-num">Ø Verkauf</th>
              <th class="vt-num">Verkauft €</th>
              <th class="vt-num vt-muted">#</th>
              <th class="vt-num">Δ %</th>
            </tr>
          </thead>
          <tbody>
            ${bodyRows}
            ${totalRow}
          </tbody>
        </table>
      </div>
    </div>
  `
}

// -------------------------------------------------------------------------
// 6 — HistoryCharts
// Links: Datentabelle. Rechts: zwei SVG-Charts nebeneinander.
// SVG nutzt foreignObject-freies Layout mit Text in % der ViewBox.
// -------------------------------------------------------------------------

export function HistoryCharts({ history, currentYear }) {
  const rows = [...(history || [])].sort((a, b) => parseInt(a.year) - parseInt(b.year))

  if (rows.length < 2) {
    return `
      <div class="dash-card">
        <div class="section-title">Historische Entwicklung</div>
        <div class="empty-hint">Nicht genug Daten</div>
      </div>
    `
  }

  const svgAvg   = buildSVG(rows, 'daily_average',     currentYear, '#14b8a6', 'rgba(20,184,166,0.10)')
  const svgBasis = buildSVG(rows, 'calculation_basis', currentYear, '#34d399', 'rgba(52,211,153,0.10)')

  const tableRows = rows.map(r => {
    const isCur = parseInt(r.year) === currentYear
    const isLeg = r.source === 'legacy'
    return `
      <tr class="${isCur ? 'hist-cur' : ''}">
        <td class="hist-td-year">
          ${r.year}${isLeg ? ' <span class="hist-badge">L</span>' : ''}
        </td>
        <td class="hist-td-num">${fmt(r.daily_average     || 0)}</td>
        <td class="hist-td-num">${fmt(r.calculation_basis || 0)}</td>
      </tr>
    `
  }).join('')

  return `
    <div class="dash-card">
      <div class="section-title">Historische Entwicklung</div>
      <div class="history-layout">
        <div class="history-table-wrap">
          <table class="hist-table">
            <thead>
              <tr>
                <th class="hist-th">Jahr</th>
                <th class="hist-th hist-th-num">Tages-Ø</th>
                <th class="hist-th hist-th-num">Umsatz</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </div>
        <div class="history-charts-wrap">
          <div class="history-chart-block">
            <div class="hist-chart-label">Tages-Ø</div>
            ${svgAvg}
          </div>
          <div class="history-chart-block">
            <div class="hist-chart-label">Umsatz gesamt</div>
            ${svgBasis}
          </div>
        </div>
      </div>
    </div>
  `
}

function buildSVG(rows, field, currentYear, stroke, fillColor) {
  // ViewBox bewusst groß — Text in ViewBox-Einheiten, skaliert proportional mit
  const W   = 400
  const H   = 180
  const PAD = { top: 16, right: 20, bottom: 36, left: 8 }
  const iW  = W - PAD.left - PAD.right
  const iH  = H - PAD.top  - PAD.bottom

  const values = rows.map(r => parseFloat(r[field] || 0))
  const maxVal = Math.max(...values, 0.01)

  const n = rows.length
  function xPos(i) { return PAD.left + (i / Math.max(n - 1, 1)) * iW }
  function yPos(v) { return PAD.top  + iH - (v / maxVal) * iH }

  const coords = rows.map((r, i) => ({
    x:         xPos(i),
    y:         yPos(parseFloat(r[field] || 0)),
    year:      parseInt(r.year),
    isCurrent: parseInt(r.year) === currentYear,
  }))

  const line = coords.map((c, i) =>
    `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`
  ).join(' ')

  const baseY = (PAD.top + iH).toFixed(1)
  const area  = `${line} L${coords[n-1].x.toFixed(1)},${baseY} L${coords[0].x.toFixed(1)},${baseY} Z`

  const dots = coords.map(c => `
    <circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}"
      r="${c.isCurrent ? 7 : 4}"
      fill="${c.isCurrent ? stroke : '#e8e8ee'}"
      stroke="${stroke}" stroke-width="2.5"/>
  `).join('')

  // Jahreszahlen: font-size in ViewBox-Einheiten = ~9% der Höhe → wirkt auf
  // jedem Bildschirm gleich relativ zum Chart
  const showEvery = n > 5 ? 2 : 1
  const labels = coords.map((c, i) => {
    if (i % showEvery !== 0 && !c.isCurrent) return ''
    return `
      <text x="${c.x.toFixed(1)}" y="${(PAD.top + iH + 22).toFixed(1)}"
        text-anchor="middle" font-size="14" fill="#9898b0">${c.year}</text>
    `
  }).join('')

  // Horizontale Rasterlinie bei maxVal/2
  const midY = yPos(maxVal / 2).toFixed(1)

  return `
    <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"
         class="history-svg" preserveAspectRatio="xMidYMid meet">
      <line x1="${PAD.left}" y1="${midY}" x2="${W - PAD.right}" y2="${midY}"
            stroke="#b8b8c4" stroke-width="0.5" stroke-dasharray="4,4"/>
      <path d="${area}" fill="${fillColor}"/>
      <path d="${line}"  fill="none" stroke="${stroke}"
            stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      ${dots}
      ${labels}
    </svg>
  `
}

// -------------------------------------------------------------------------
// CSS
// -------------------------------------------------------------------------

;(function injectCSS() {
  if (document.getElementById('dash-v2-css')) return
  const style = document.createElement('style')
  style.id = 'dash-v2-css'
  style.textContent = `
    /* ── Vintages ── */
    .vt-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .vt-table {
      border-collapse: collapse;
      font-size: 12px;
      min-width: 440px;
      width: 100%;
    }
    .vt-table thead th {
      color: var(--neu-text-muted);
      font-size: 10px;
      font-weight: 400;
      letter-spacing: 0.5px;
      padding: 0 6px 8px;
      text-transform: uppercase;
    }
    .vt-row td {
      border-top: 1px solid rgba(184,184,196,0.25);
      color: var(--neu-text);
      padding: 7px 6px;
    }
    .vt-total td {
      border-top: 1.5px solid rgba(184,184,196,0.5);
      color: var(--neu-text-strong);
      font-weight: 500;
      padding: 8px 6px;
    }
    .vt-label { text-align: left; }
    .vt-num   { text-align: right; }
    .vt-muted { color: var(--neu-text-muted) !important; font-weight: 400 !important; }

    /* ── History Layout ── */
    .history-layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
      align-items: start;
    }
    @media (min-width: 640px) {
      .history-layout { grid-template-columns: auto 1fr; }
    }
    .history-table-wrap { overflow-x: auto; flex-shrink: 0; }
    .hist-table { border-collapse: collapse; font-size: 12px; white-space: nowrap; }
    .hist-th {
      color: var(--neu-text-muted);
      font-size: 10px;
      font-weight: 400;
      letter-spacing: 0.5px;
      padding: 0 16px 8px 0;
      text-align: left;
      text-transform: uppercase;
    }
    .hist-th-num { text-align: right; }
    .hist-table tbody tr td {
      border-top: 1px solid rgba(184,184,196,0.2);
      color: var(--neu-text);
      padding: 6px 16px 6px 0;
    }
    .hist-cur td { color: var(--neu-text-strong); font-weight: 500; }
    .hist-td-year { min-width: 60px; }
    .hist-td-num  { text-align: right; }
    .hist-badge {
      background: var(--neu-accent-light);
      border-radius: 4px;
      color: var(--neu-accent-dark);
      font-size: 9px;
      font-weight: 500;
      padding: 1px 4px;
    }

    /* ── Charts ── */
    .history-charts-wrap {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      min-width: 0;
    }
    .history-chart-block { min-width: 0; }
    .hist-chart-label {
      color: var(--neu-text-muted);
      font-size: 11px;
      margin-bottom: 6px;
    }
    .history-svg {
      display: block;
      width: 100%;
      height: auto;
    }
  `
  document.head.appendChild(style)
})()
