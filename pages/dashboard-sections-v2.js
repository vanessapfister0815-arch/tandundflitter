/**
 * dashboard-sections-v2.js — Inventarjahrgänge · Historische Entwicklung
 * Tand & Flitter · v1.0 · 2026-06-20
 *
 * Exports: VintagesTable, HistoryCharts
 */

// -------------------------------------------------------------------------
// Hilfsfunktionen (lokal, bis core/helpers.js existiert)
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
// 6 — VintagesTable
// Props: { vintages }
// Spalten: Jahrgang · Aktiv € · Aktiv # · Verkauft € · Verkauft # · Δ %
// NULL-Jahrgang ganz unten, ohne Δ%
// Letzte Zeile: Σ Gesamt (fett)
// -------------------------------------------------------------------------

export function VintagesTable({ vintages }) {
  const rows = vintages || []

  // NULL-Jahrgänge trennen
  const withYear = rows.filter(r => r.purchase_year !== null && r.purchase_year !== undefined)
  const noYear   = rows.filter(r => r.purchase_year === null || r.purchase_year === undefined)

  // Absteigend nach Jahrgang
  withYear.sort((a, b) => parseInt(b.purchase_year) - parseInt(a.purchase_year))

  // Σ-Zeile
  const totals = [...withYear, ...noYear].reduce((acc, r) => {
    acc.active_value  += parseFloat(r.active_value  || 0)
    acc.active_count  += parseInt(r.active_count    || 0)
    acc.sold_value    += parseFloat(r.sold_value    || 0)
    acc.sold_count    += parseInt(r.sold_count      || 0)
    return acc
  }, { active_value: 0, active_count: 0, sold_value: 0, sold_count: 0 })

  function deltaCell(r) {
    const av = parseFloat(r.active_value || 0)
    const sv = parseFloat(r.sold_value   || 0)
    const total = av + sv
    if (total === 0) return '<td class="vt-num vt-muted">—</td>'
    const pct = (sv / total) * 100
    const color = pct >= 50 ? 'var(--neu-green)' : 'var(--neu-amber)'
    return `<td class="vt-num" style="color:${color}">${pct.toFixed(1)} %</td>`
  }

  function renderRow(r, opts = {}) {
    const label = opts.noYear
      ? '<span style="color:var(--neu-text-muted);font-style:italic;">kein Jahrgang</span>'
      : r.purchase_year
    const rowClass = opts.total ? 'vt-row vt-total' : 'vt-row'
    const deltaTd  = opts.total || opts.noYear ? '<td class="vt-num vt-muted">—</td>' : deltaCell(r)

    return `
      <tr class="${rowClass}">
        <td class="vt-label">${label}</td>
        <td class="vt-num">${fmt(r.active_value  || 0)}</td>
        <td class="vt-num vt-muted">${fmtN(r.active_count || 0)}</td>
        <td class="vt-num">${fmt(r.sold_value    || 0)}</td>
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
    active_value: totals.active_value,
    active_count: totals.active_count,
    sold_value:   totals.sold_value,
    sold_count:   totals.sold_count,
    purchase_year: 'Σ Gesamt',
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
// 7 — HistoryCharts
// Props: { history, currentYear }
// Zwei SVG-Line-Charts nebeneinander:
//   Daily Average (Teal)  ·  Calculation Basis (Grün)
// Quelle: get_yearly_history() UNION (echte Sales + Legacy)
// -------------------------------------------------------------------------

export function HistoryCharts({ history, currentYear }) {
  const rows = [...(history || [])].sort((a, b) => parseInt(a.year) - parseInt(b.year))
  if (rows.length < 2) {
    return `<div class="dash-card"><div class="section-title">Historische Entwicklung</div><div class="empty-hint">Nicht genug Daten</div></div>`
  }

  const chartAvg   = buildChart(rows, 'daily_average',    currentYear, 'var(--neu-accent)', 'rgba(20,184,166,0.12)')
  const chartBasis = buildChart(rows, 'calculation_basis', currentYear, 'var(--neu-green)',  'rgba(52,211,153,0.10)')

  return `
    <div class="history-grid">
      <div class="dash-card">
        <div class="section-title">Tages-Ø</div>
        ${chartAvg}
      </div>
      <div class="dash-card">
        <div class="section-title">Umsatz gesamt</div>
        ${chartBasis}
      </div>
    </div>
  `
}

function buildChart(rows, field, currentYear, stroke, fill) {
  const W = 300
  const H = 140
  const PAD = { top: 16, right: 12, bottom: 28, left: 8 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top  - PAD.bottom

  const values = rows.map(r => parseFloat(r[field] || 0))
  const maxVal  = Math.max(...values, 0.01)
  const minVal  = 0

  function xPos(i) { return PAD.left + (i / (rows.length - 1)) * innerW }
  function yPos(v) { return PAD.top + innerH - ((v - minVal) / (maxVal - minVal)) * innerH }

  // Pfad-Koordinaten
  const coords = rows.map((r, i) => ({
    x: xPos(i),
    y: yPos(parseFloat(r[field] || 0)),
    val: parseFloat(r[field] || 0),
    year: parseInt(r.year),
    isLegacy: r.source === 'legacy',
    isCurrent: parseInt(r.year) === currentYear,
  }))

  // Linie
  const linePath = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(' ')

  // Gefüllte Fläche
  const firstX = coords[0].x.toFixed(1)
  const lastX  = coords[coords.length - 1].x.toFixed(1)
  const baseY  = (PAD.top + innerH).toFixed(1)
  const fillPath = `${linePath} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`

  // Punkte
  const dots = coords.map(c => `
    <circle
      cx="${c.x.toFixed(1)}"
      cy="${c.y.toFixed(1)}"
      r="${c.isCurrent ? 5 : 3}"
      fill="${c.isCurrent ? stroke : 'var(--neu-bg)'}"
      stroke="${stroke}"
      stroke-width="${c.isCurrent ? 0 : 2}"
    />
  `).join('')

  // X-Achse: Jahreszahlen (jedes zweite wenn viele)
  const showEvery = rows.length > 6 ? 2 : 1
  const labels = coords.map((c, i) => {
    if (i % showEvery !== 0 && !c.isCurrent) return ''
    return `
      <text
        x="${c.x.toFixed(1)}"
        y="${(PAD.top + innerH + 14).toFixed(1)}"
        text-anchor="middle"
        font-size="9"
        fill="var(--neu-text-muted)"
      >${c.year}</text>
    `
  }).join('')

  const gradId = `grad_${field}_${Math.random().toString(36).slice(2, 7)}`

  const svg = `
    <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="history-svg">
      <defs>
        <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="${fill.replace('0.12','0.18').replace('0.10','0.14')}" />
          <stop offset="100%" stop-color="${fill.replace('0.12','0').replace('0.10','0')}" />
        </linearGradient>
      </defs>
      <path d="${fillPath}" fill="url(#${gradId})" />
      <path d="${linePath}" fill="none" stroke="${stroke}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
      ${dots}
      ${labels}
    </svg>
  `

  // Legende
  const legend = coords.map(c => `
    <div class="hist-legend-row">
      <span class="hist-legend-year">${c.year}</span>
      <span class="hist-legend-val">${fmt(c.val)}</span>
      ${c.isLegacy ? '<span class="hist-badge">L</span>' : ''}
    </div>
  `).join('')

  return `
    ${svg}
    <div class="hist-legend">${legend}</div>
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
    /* Vintages Table */
    .vt-wrap {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    .vt-table {
      border-collapse: collapse;
      font-size: 12px;
      min-width: 360px;
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

    /* History Charts */
    .history-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }
    @media (min-width: 640px) {
      .history-grid { grid-template-columns: repeat(2, 1fr); }
    }
    .history-svg {
      display: block;
      width: 100%;
      height: auto;
    }
    .hist-legend {
      display: flex;
      flex-direction: column;
      gap: 3px;
      margin-top: 12px;
    }
    .hist-legend-row {
      align-items: center;
      color: var(--neu-text-muted);
      display: flex;
      font-size: 11px;
      gap: 8px;
    }
    .hist-legend-year {
      color: var(--neu-text-strong);
      font-weight: 500;
      width: 32px;
    }
    .hist-legend-val { flex: 1; }
    .hist-badge {
      background: var(--neu-accent-light);
      border-radius: 4px;
      color: var(--neu-accent-dark);
      font-size: 9px;
      font-weight: 500;
      padding: 1px 5px;
    }
  `
  document.head.appendChild(style)
})()
