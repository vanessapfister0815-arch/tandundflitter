// pages/dashboard-sections.js — KpiRow · MonthlyBars · TopCustomers · RecentSales
// Tand & Flitter · v2.3 · 2026-07-01
// v2.3: KPI ohne Sub-Zeile · MonthlyBars + Umsatz/Abweichung/Kumuliert-Spalten
//       TopCustomers + 50%-Zeile · "Alle Kunden" als echter Link

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

function fmtDelta(n) {
  const sign = n >= 0 ? '+' : ''
  return sign + parseFloat(n).toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' €'
}

function initials(name) {
  if (!name) return '?'
  return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = [
  { bg: 'rgba(20,184,166,0.15)',  text: '#0f766e' },
  { bg: 'rgba(52,211,153,0.15)',  text: '#059669' },
  { bg: 'rgba(251,191,36,0.15)',  text: '#b45309' },
  { bg: 'rgba(248,113,113,0.15)', text: '#b91c1c' },
]

const PLATFORM_COLORS = {
  'Vinted':               '#14b8a6',
  'eBay':                 '#e53e3e',
  'Kleinanzeigen':        '#f6ad55',
  'ETSY':                 '#f97316',
  'Vestiaire Collective': '#9f7aea',
  'Catawiki':             '#48bb78',
  'Schrottkreisel':       '#4299e1',
  'Mädchenflohmarkt':     '#ed64a6',
}

function platformColor(name) {
  return PLATFORM_COLORS[name] || '#9898b0'
}

// -------------------------------------------------------------------------
// 1 — KpiRow (nur Kennzahl, keine Sub-Zeile)
// -------------------------------------------------------------------------

export function KpiRow({ heroData, invStats }) {
  const calcBasis   = parseFloat(heroData?.calcBasis || 0)
  const dailyAvg    = parseFloat(heroData?.dailyAvg  || 0)
  const activeCount = parseInt(invStats?.active_count || 0)
  const activeValue = parseFloat(invStats?.active_value || 0)

  function card(label, value) {
    return `
      <div class="kpi-card">
        <div class="kpi-label">${label}</div>
        <div class="kpi-value">${value}</div>
      </div>
    `
  }

  return `
    <div class="kpi-grid">
      ${card('Umsatz',        fmt(calcBasis))}
      ${card('Tages-Ø',      fmt(dailyAvg))}
      ${card('Aktive Artikel', fmtN(activeCount))}
      ${card('Inventarwert', fmt(activeValue))}
    </div>
  `
}

// -------------------------------------------------------------------------
// 2 — MonthlyBars mit Umsatz · Abweichung · Kumulierte Abweichung
// -------------------------------------------------------------------------

export function MonthlyBars({ months, history, selYear }) {
  const rows = (months || []).filter(m => parseFloat(m.revenue || 0) > 0)

  if (!rows.length) {
    return `
      <div class="dash-card">
        <div class="section-title">Monatliche Entwicklung ${selYear}</div>
        <div class="empty-hint">Keine Verkäufe in ${selYear}</div>
      </div>
    `
  }

  const maxVal    = Math.max(...rows.map(m => parseFloat(m.revenue || 0)))
  const prevRow   = (history || []).find(r => parseInt(r.year) === selYear - 1)
  const prevBasis = prevRow ? parseFloat(prevRow.calculation_basis || 0) : null
  const refAvg    = prevBasis !== null && prevBasis > 0 ? prevBasis / 12 : null
  const refPct    = refAvg !== null && maxVal > 0 ? Math.min((refAvg / maxVal) * 100, 100) : null

  const MONTH_NAMES = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']

  let cumDelta = 0

  const bars = rows.map((m, i) => {
    const val      = parseFloat(m.revenue || 0)
    const pct      = maxVal > 0 ? (val / maxVal) * 100 : 0
    const rawMonth = String(m.month || '')
    const mNum     = rawMonth.includes('-')
      ? parseInt(rawMonth.split('-')[1], 10)
      : parseInt(rawMonth, 10)
    const mIdx     = isNaN(mNum) ? i : mNum - 1
    const name     = MONTH_NAMES[mIdx] ?? `M${m.month}`

    const refLine = refPct !== null
      ? `<div class="hbar-ref" style="left:${refPct}%"></div>`
      : ''

    let deltaCell = ''
    let cumCell   = ''
    if (refAvg !== null) {
      const delta = val - refAvg
      cumDelta   += delta
      const dCol  = delta  >= 0 ? 'var(--neu-green)' : 'var(--neu-red)'
      const cCol  = cumDelta >= 0 ? 'var(--neu-green)' : 'var(--neu-red)'
      deltaCell = `<div class="hbar-delta" style="color:${dCol}">${fmtDelta(delta)}</div>`
      cumCell   = `<div class="hbar-cum"   style="color:${cCol}">${fmtDelta(cumDelta)}</div>`
    }

    return `
      <div class="hbar-row">
        <div class="hbar-month">${name}</div>
        <div class="hbar-track">
          <div class="hbar-fill" style="width:${pct}%"></div>
          ${refLine}
        </div>
        <div class="hbar-val">${fmt(val)}</div>
        ${deltaCell}
        ${cumCell}
      </div>
    `
  }).join('')

  const header = refAvg !== null ? `
    <div class="hbar-row hbar-header">
      <div class="hbar-month"></div>
      <div class="hbar-track-spacer"></div>
      <div class="hbar-val hbar-col-head">Umsatz</div>
      <div class="hbar-delta hbar-col-head">Abw. VJ-Ø</div>
      <div class="hbar-cum hbar-col-head">Kumuliert</div>
    </div>
  ` : ''

  const refLabel = refAvg !== null
    ? `<div class="hbar-ref-legend">— Ø ${selYear - 1}: ${fmt(refAvg)} / Monat</div>`
    : ''

  return `
    <div class="dash-card">
      <div class="section-title">Monatliche Entwicklung ${selYear}</div>
      ${header}
      <div class="hbars-wrap">${bars}</div>
      ${refLabel}
    </div>
  `
}

export function MonthlyBarsInit(_container) {}

// -------------------------------------------------------------------------
// 3 — TopCustomers (max. 10, mit 50%-Zeile)
// -------------------------------------------------------------------------

export function TopCustomers({ customers, year }) {
  const rows = [...(customers || [])]
    .sort((a, b) => parseFloat(b.calculation_basis_year || 0) - parseFloat(a.calculation_basis_year || 0))
    .slice(0, 10)

  const items = rows.map((c, i) => {
    const col   = AVATAR_COLORS[i % AVATAR_COLORS.length]
    const basis = parseFloat(c.calculation_basis_year || 0)
    const half  = basis / 2
    const count = parseInt(c.sales_count || 0)
    const avg   = count > 0 ? basis / count : 0
    const name  = c.customer_name || c.name || c.full_name || '—'

    return `
      <div class="customer-row">
        <div class="customer-avatar" style="background:${col.bg};color:${col.text};">
          ${initials(name)}
        </div>
        <div class="customer-info">
          <div class="customer-name">${name}</div>
          <div class="customer-meta">${fmtN(count)} Verkäufe · Ø ${fmt(avg)}</div>
        </div>
        <div class="customer-nums">
          <div class="customer-basis">${fmt(basis)}</div>
          <div class="customer-half">${fmt(half)}</div>
        </div>
      </div>
    `
  }).join('')

  return `
    <div class="dash-card">
      <div class="section-title">Top-Kunden ${year}</div>
      ${rows.length ? `<div class="customer-list">${items}</div>` : `<div class="empty-hint">Keine Daten</div>`}
      <a class="link-btn" href="#/customers" id="btn-all-customers">→ Alle Kunden</a>
    </div>
  `
}

// -------------------------------------------------------------------------
// 4 — RecentSales
// -------------------------------------------------------------------------

export function RecentSales({ recent }) {
  const rows = recent || []

  const items = rows.map(s => {
    const platColor = platformColor(s.platform)
    const basis = parseFloat(s.calculation_basis || 0)
    const op    = parseFloat(s.operator_fee || 0)
    const inv   = s.inventory_number || '—'
    const desc  = s.article_description_override
               || s.description
               || s.article_description
               || s.title
               || '—'

    return `
      <div class="sale-row">
        <div class="sale-inv">${inv}</div>
        <div class="sale-desc">${desc}</div>
        <div class="sale-plat" style="color:${platColor};">${s.platform || '—'}</div>
        <div class="sale-nums">
          <div class="sale-basis">${fmt(basis)}</div>
          <div class="sale-op">Mein Anteil: ${fmt(op)}</div>
        </div>
      </div>
    `
  }).join('')

  return `
    <div class="dash-card">
      <div class="section-title">Letzte Verkäufe</div>
      ${rows.length ? `<div class="sale-list">${items}</div>` : `<div class="empty-hint">Keine Verkäufe</div>`}
      <a class="link-btn" href="#/sales" id="btn-all-sales">→ Alle Verkäufe</a>
    </div>
  `
}

// -------------------------------------------------------------------------
// CSS
// -------------------------------------------------------------------------

export function injectSectionsCSS() {
  if (document.getElementById('dash-sections-css')) return
  const style = document.createElement('style')
  style.id = 'dash-sections-css'
  style.textContent = `
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    @media (min-width: 640px) {
      .kpi-grid { grid-template-columns: repeat(4, 1fr); gap: 16px; }
    }
    .kpi-card {
      background: var(--neu-bg);
      border-radius: var(--neu-radius-card);
      box-shadow: 6px 6px 14px var(--neu-shadow-dark), -6px -6px 14px var(--neu-shadow-light);
      padding: 14px 12px;
    }
    @media (min-width: 640px) {
      .kpi-card { padding: 18px 20px; }
    }
    .kpi-label {
      color: var(--neu-text-muted);
      font-size: 11px;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
      text-transform: uppercase;
    }
    .kpi-value {
      color: var(--neu-text-strong);
      font-size: 18px;
      font-weight: 500;
      line-height: 1.2;
    }
    @media (min-width: 640px) {
      .kpi-value { font-size: 22px; }
    }
    .dash-card {
      background: var(--neu-bg);
      border-radius: var(--neu-radius-card);
      box-shadow: 6px 6px 14px var(--neu-shadow-dark), -6px -6px 14px var(--neu-shadow-light);
      padding: 18px 20px;
    }
    .section-title {
      color: var(--neu-text-strong);
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 16px;
    }
    .empty-hint {
      color: var(--neu-text-muted);
      font-size: 13px;
      padding: 16px 0;
    }
    .link-btn {
      background: none;
      border: none;
      color: var(--neu-accent);
      cursor: pointer;
      display: inline-block;
      font-family: inherit;
      font-size: 12px;
      margin-top: 16px;
      padding: 0;
      text-decoration: none;
      transition: color 0.15s ease;
    }
    .link-btn:hover { color: var(--neu-accent-dark); }

    /* ── Horizontale Monatsbalken ── */
    .hbar-header { margin-bottom: 4px; }
    .hbar-col-head {
      color: var(--neu-text-muted) !important;
      font-size: 10px !important;
      letter-spacing: 0.4px;
      text-transform: uppercase;
    }
    .hbar-track-spacer { flex: 1; }
    .hbars-wrap { display: flex; flex-direction: column; gap: 8px; }
    .hbar-row { display: flex; align-items: center; gap: 10px; }
    .hbar-month {
      color: var(--neu-text-muted);
      font-size: 11px;
      text-align: right;
      width: 26px;
      flex-shrink: 0;
    }
    .hbar-track {
      flex: 1;
      height: 10px;
      border-radius: 50px;
      box-shadow: inset 3px 3px 7px var(--neu-shadow-dark), inset -3px -3px 7px var(--neu-shadow-light);
      overflow: visible;
      position: relative;
    }
    .hbar-fill {
      position: absolute;
      top: 0; left: 0;
      height: 100%;
      border-radius: 50px;
      background: linear-gradient(90deg, #14b8a6, #34d399);
      min-width: 2px;
      transition: width 0.35s ease;
    }
    .hbar-ref {
      position: absolute;
      top: -3px;
      bottom: -3px;
      width: 2px;
      background: var(--neu-text-muted);
      border-radius: 2px;
      pointer-events: none;
      opacity: 0.55;
    }
    .hbar-val {
      color: var(--neu-text-muted);
      font-size: 11px;
      text-align: right;
      width: 72px;
      flex-shrink: 0;
    }
    .hbar-delta {
      font-size: 11px;
      font-weight: 500;
      text-align: right;
      width: 72px;
      flex-shrink: 0;
    }
    .hbar-cum {
      font-size: 11px;
      font-weight: 500;
      text-align: right;
      width: 72px;
      flex-shrink: 0;
    }
    .hbar-ref-legend {
      color: var(--neu-text-muted);
      font-size: 10px;
      margin-top: 10px;
      text-align: right;
    }

    /* ── Kunden ── */
    .customer-list { display: flex; flex-direction: column; gap: 10px; }
    .customer-row { display: flex; align-items: center; gap: 10px; }
    .customer-avatar {
      border-radius: 50%;
      box-shadow: 3px 3px 7px var(--neu-shadow-dark), -3px -3px 7px var(--neu-shadow-light);
      flex-shrink: 0;
      font-size: 11px;
      font-weight: 500;
      height: 34px;
      line-height: 34px;
      text-align: center;
      width: 34px;
    }
    .customer-info { flex: 1; min-width: 0; }
    .customer-name {
      color: var(--neu-text-strong);
      font-size: 13px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .customer-meta { color: var(--neu-text-muted); font-size: 11px; margin-top: 2px; }
    .customer-nums { text-align: right; flex-shrink: 0; }
    .customer-basis { color: var(--neu-text-strong); font-size: 13px; font-weight: 500; }
    .customer-half  { color: var(--neu-text-muted);  font-size: 11px; margin-top: 2px; }

    /* ── Letzte Verkäufe ── */
    .sale-list { display: flex; flex-direction: column; gap: 10px; }
    .sale-row {
      display: grid;
      grid-template-columns: 48px 1fr auto auto;
      align-items: center;
      gap: 8px;
    }
    .sale-inv {
      color: var(--neu-text-muted);
      font-family: monospace;
      font-size: 11px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .sale-desc {
      color: var(--neu-text);
      font-size: 12px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .sale-plat { font-size: 11px; font-weight: 500; white-space: nowrap; }
    .sale-nums { text-align: right; }
    .sale-basis { color: var(--neu-text-strong); font-size: 13px; font-weight: 500; }
    .sale-op { color: var(--neu-text-muted); font-size: 11px; margin-top: 2px; }
  `
  document.head.appendChild(style)
}
