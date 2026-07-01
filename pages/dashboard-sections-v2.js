/**
 * dashboard-sections-v2.js — Inventarjahrgänge · Historische Entwicklung
 * Tand & Flitter · v1.2 · 2026-07-01
 * v1.2: Jahrgang korrekt aus allen möglichen Feldnamen gelesen,
 *       Ø-Verkaufspreis-Spalte ergänzt, HistoryCharts Desktop-Layout überarbeitet
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
// Spalten: Jahrgang · Aktiv € · # · Ø Verkauf · Verkauft € · Verkauft # · Δ %
// -------------------------------------------------------------------------

export function VintagesTable({ vintages }) {
  const rows = vintages || []

  // Jahrgang-Feld-Fallback: RPC kann 'purchase_year', 'year' oder 'vintage' liefern
  function getYear(r) {
    return r.purchase_year ?? r.year ?? r.vintage ?? null
  }

  const withYear = rows.filter(r => getYear(r) !== null && getYear(r) !== undefined)
  const noYear   = rows.filter(r => getYear(r) === null || getYear(r) === undefined)

  withYear.sort((a, b) => parseInt(getYear(b)) - parseInt(getYear(a)))

  const totals = [...withYear, ...noYear].reduce((acc, r) => {
    acc.active_value  += parseFloat(r.active_value  || 0)
    acc.active_count  += parseInt(r.active_count    || 0)
    acc.sold_value    += parseFloat(r.sold_value    || 0)
    acc.sold_count    += parseInt(r.sold_count      || 0)
    return acc
  }, { active_value: 0, active_count: 0, sold_value: 0, sold_count: 0 })

  function avgSold(r) {
    const sc = parseInt(r.sold_count || 0)
    const sv = parseFloat(r.sold_value || 0)
    if (sc === 0) return '<td class="vt-num vt-muted">—</td>'
    return `<td class="vt-num">${fmt(sv / sc)}</td>`
  }

  function deltaCell(r) {
    const av    = parseFloat(r.active_value || 0)
    const sv    = parseFloat(r.sold_value   || 0)
    const total = av + sv
    if (total === 0) return '<td class="vt-num vt-muted">—</td>'
    const pct   = (sv / total) * 100
    const color = pct >= 50 ? 'var(--neu-green)' : 'var(--neu-amber)'
    return `<td class="vt-num" style="color:${color}">${pct.toFixed(1)} %</td>`
  }

  function renderRow(r, opts = {}) {
    const yr = getYear(r)
    const label = opts.noYear
      ? '<span style="color:var(--neu-text-muted);font-style:italic;">kein Jahrgang</span>'
      : opts.total ? 'Σ Gesamt' : yr
    const rowClass = opts.total ? 'vt-row vt-total' : 'vt-row'
    const avgTd    = opts.total || opts.noYear ? '<td class="vt-num vt-muted">—</td>' : avgSold(r)
    const deltaTd  = opts.total || opts.noYear ? '<td class="vt-num vt-muted">—</td>' : deltaCell(r)

    return `
      <tr class="${rowClass}">
        <td class="vt-label">${label}</td>
        <td class="vt-num">${fmt(r.active_value  || 0)}</td>
        <td class="vt-num vt-muted">${fmtN(r.active_count || 0)}</td>
        ${avgTd}
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
    active_value:  totals.active_value,
    active_count:  totals.active_count,
    sold_value:    totals.sold_value,
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
// Desktop: Tabelle + zwei kompakte SVG-Charts nebeneinander
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

  const svgAvg   = buildSVG(rows, 'daily_average',     currentYear, '#14b8a6')
  const svgBasis = buildSVG(rows, 'calculation_basis', currentYear, '#34d399')

  // Datentabelle
  const tableRows = rows.map(r => {
    const isCur = parseInt(r.year) === currentYear
    const avg   = parseFloat(r.daily_average    || 0)
    const basis = parseFloat(r.calculation_basis || 0)
    const isLeg = r.source === 'legacy'
    return `
      <tr class="${isCur ? 'hist-cur' : ''}">
        <td class="hist-td-year">${r.year}${isLeg ? ' <span class="hist-badge">L</span>' : ''}</td>
        <td class="hist-td-num">${fmt(avg)}</td>
        <td class="hist-td-num">${fmt(basis)}</td>
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
            <div class="hist-chart-title">Tages-Ø</div>
            ${svgAvg}
          </div>
          <div class="history-chart-block">
            <div class="hist-chart-title">Umsatz gesamt</div>
            ${svgBasis}
          </div>
        </div>
      </div>
    </div>
  `
}

function buildSVG(rows, field, currentYear, stroke) {
  const W   = 260
  const H   = 120
  const PAD = { top: 12, right: 16, bottom: 24, left: 8 }
  const iW  = W - PAD.left - PAD.right
  const iH  = H - PAD.top  - PAD.bottom

  const values = rows.map(r => parseFloat(r[field] || 0))
  const maxVal = Math.max(...values, 0.01)

  function xPos(i) { return PAD.left + (i / Math.max(rows.length - 1, 1)) * iW }
  function yPos(v) { return PAD.top  + iH - (v / maxVal) * iH }

  const coords = rows.map((r, i) => ({
    x:         xPos(i),
    y:         yPos(parseFloat(r[field] || 0)),
    year:      parseInt(r.year),
    isCurrent: parseInt(r.year) === currentYear,
  }))

  const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')
  const area = `${line} L${coords[coords.length-1].x.toFixed(1)},${(PAD.top+iH).toFixed(1)} L${coords[0].x.toFixed(1)},${(PAD.top+iH).toFixed(1)} Z`

  const fillColor = stroke === '#14b8a6' ? 'rgba(20,184,166,0.10)' : 'rgba(52,211,153,0.10)'

  const dots = coords.map(c => `
    <circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}"
      r="${c.isCurrent ? 5 : 3}"
      fill="${c.isCurrent ? stroke : 'var(--neu-bg)'}"
      stroke="${stroke}" stroke-width="2"/>
  `).join('')

  const showEvery = rows.length > 5 ? 2 : 1
  const labels = coords.map((c, i) => {
    if (i % showEvery !== 0 && !c.isCurrent) return ''
    return `<text x="${c.x.toFixed(1)}" y="${(PAD.top+iH+14).toFixed(1)}"
      text-anchor="middle" font-size="9" fill="var(--neu-text-muted)">${c.year}</text>`
  }).join('')

  return `
    <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="history-svg">
      <path d="${area}" fill="${fillColor}"/>
      <path d="${line}"  fill="none" stroke="${stroke}" stroke-width="1.5"
            stroke-linejoin="round" stroke-linecap="round"/>
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
    /* Vintages */
    .vt-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .vt-table {
      border-collapse: collapse;
      font-size: 12px;
      min-width: 420px;
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

    /* History Layout */
    .history-layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
    }
    @media (min-width: 640px) {
      .history-layout { grid-template-columns: auto 1fr; align-items: start; }
    }
    .history-table-wrap { overflow-x: auto; }
    .hist-table {
      border-collapse: collapse;
      font-size: 12px;
      white-space: nowrap;
    }
    .hist-th {
      color: var(--neu-text-muted);
      font-size: 10px;
      font-weight: 400;
      letter-spacing: 0.5px;
      padding: 0 8px 8px 0;
      text-align: left;
      text-transform: uppercase;
    }
    .hist-th-num { text-align: right; }
    .hist-table tbody tr td {
      border-top: 1px solid rgba(184,184,196,0.2);
      color: var(--neu-text);
      padding: 6px 8px 6px 0;
    }
    .hist-cur td {
      color: var(--neu-text-strong);
      font-weight: 500;
    }
    .hist-td-year { color: var(--neu-text-strong); padding-right: 20px !important; }
    .hist-td-num  { text-align: right; }
    .hist-badge {
      background: var(--neu-accent-light);
      border-radius: 4px;
      color: var(--neu-accent-dark);
      font-size: 9px;
      font-weight: 500;
      padding: 1px 4px;
    }
    .history-charts-wrap {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .history-chart-block {}
    .hist-chart-title {
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
