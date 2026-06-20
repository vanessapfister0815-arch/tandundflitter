// pages/dashboard-sections.js — KpiRow · MonthlyBars · TopCustomers · RecentSales
// Tand & Flitter · v2.1 · 2026-06-20
// Änderungen v2.1:
//   - MonthlyBars: vertikale Säulen → horizontale Balken (Mockup-Layout)
//   - TopCustomers: auf 10 Einträge begrenzt, "offen"-Badge entfernt
//   - RecentSales: erweiterter Beschreibungs-Fallback (article_description_override → description → article_description → '—')

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

function kpiCard({ label, value, sub }) {
  return `
    <div class="kpi-card">
      <div class="kpi-label">${label}</div>
      <div class="kpi-value">${value}</div>
      <div class="kpi-sub">${sub}</div>
    </div>
  `
}

// -------------------------------------------------------------------------
// 1 — KpiRow
// -------------------------------------------------------------------------

export function KpiRow({ heroData, invStats, selYear }) {
  const calcBasis   = parseFloat(heroData?.calcBasis || 0)
  const dailyAvg    = parseFloat(heroData?.dailyAvg  || 0)
  const elapsed     = heroData?.elapsedDays || 1
  const isLegacy    = !!heroData?.isLegacy
  const deltaPct    = heroData?.deltaPct ?? null
  const activeCount = parseInt(invStats?.active_count || 0)
  const activeValue = parseFloat(invStats?.active_value || 0)

  let umsatzSub
  if (!isLegacy && deltaPct !== null) {
    const sign  = deltaPct >= 0 ? '+' : ''
    const color = deltaPct >= 0 ? 'var(--neu-green)' : 'var(--neu-red)'
    umsatzSub = `<span style="color:${color};font-weight:500;">${sign}${deltaPct.toFixed(1)} %</span> vs. Vorjahr`
  } else {
    umsatzSub = `${fmtN(elapsed)} Tage`
  }

  return `
    <div class="kpi-grid">
      ${kpiCard({ label: 'Umsatz',          value: fmt(calcBasis),    sub: umsatzSub })}
      ${kpiCard({ label: 'Tages-Ø',         value: fmt(dailyAvg),     sub: `${fmtN(elapsed)} Tage` })}
      ${kpiCard({ label: 'Aktive Artikel',   value: fmtN(activeCount), sub: `Inventarwert: ${fmt(activeValue)}` })}
      ${kpiCard({ label: 'Inventarwert',     value: fmt(activeValue),  sub: `${fmtN(activeCount)} Artikel` })}
    </div>
  `
}

// -------------------------------------------------------------------------
// 2 — MonthlyBars (horizontal, Mockup-Layout)
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

  const bars = rows.map((m, i) => {
    const val  = parseFloat(m.revenue || 0)
    const pct  = maxVal > 0 ? (val / maxVal) * 100 : 0
    // month kann "1", "01" oder "2026-01" sein
    const rawMonth = String(m.month || '')
    const mNum = rawMonth.includes('-')
      ? parseInt(rawMonth.split('-')[1], 10)
      : parseInt(rawMonth, 10)
    const mIdx = isNaN(mNum) ? i : mNum - 1
    const name = MONTH_NAMES[mIdx] ?? `M${m.month}`

    const refLine = refPct !== null
      ? `<div class="hbar-ref" style="left:${refPct}%"></div>`
      : ''

    return `
      <div class="hbar-row">
        <div class="hbar-month">${name}</div>
        <div class="hbar-track">
          <div class="hbar-fill" style="width:${pct}%"></div>
          ${refLine}
        </div>
        <div class="hbar-val">${fmt(val)}</div>
      </div>
    `
  }).join('')

  const refLabel = refPct !== null
    ? `<div class="hbar-ref-legend">— Ø VJ ${fmt(refAvg)}</div>`
    : ''

  return `
    <div class="dash-card">
      <div class="section-title">Monatliche Entwicklung ${selYear}</div>
      <div class="hbars-wrap">${bars}</div>
      ${refLabel}
    </div>
  `
}

// MonthlyBarsInit bleibt exportiert, macht bei horizontalen Balken nichts
export function MonthlyBarsInit(_container) {}

// -------------------------------------------------------------------------
// 3 — TopCustomers (max. 10, kein "offen"-Label)
// -------------------------------------------------------------------------

export function TopCustomers({ customers, year, onNavigate }) {
  const rows = [...(customers || [])]
    .sort((a, b) => parseFloat(b.calculation_basis_year || 0) - parseFloat(a.calculation_basis_year || 0))
    .slice(0, 10)

  const items = rows.map((c, i) => {
    const col   = AVATAR_COLORS[i % AVATAR_COLORS.length]
    const basis = parseFloat(c.calculation_basis_year || 0)
    const count = parseInt(c.sales_count || 0)
    const avg   = count > 0 ? basis / count : 0

    // Namensfeld: get_customer_summary kann 'customer_name', 'name' oder 'full_name' liefern
    const name = c.customer_name || c.name || c.full_name || '—'

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
        </div>
      </div>
    `
  }).join('')

  return `
    <div class="dash-card">
      <div class="section-title">Top-Kunden ${year}</div>
      ${rows.length ? `<div class="customer-list">${items}</div>` : `<div class="empty-hint">Keine Daten</div>`}
      <button class="link-btn" id="btn-all-customers">→ Alle Kunden</button>
    </div>
  `
}

// -------------------------------------------------------------------------
// 4 — RecentSales
// -------------------------------------------------------------------------

export function RecentSales({ recent, onNavigate }) {
  const rows = recent || []

  const items = rows.map(s => {
    const platColor = platformColor(s.platform)
    const basis = parseFloat(s.calculation_basis || 0)
    const op    = parseFloat(s.operator_fee || 0)
    const inv   = s.inventory_number || '—'
    // Alle möglichen Beschreibungsfelder die vw_sales_detail liefern kann
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
      <button class="link-btn" id="btn-all-sales">→ Alle Verkäufe</button>
    </div>
  `
}

// -------------------------------------------------------------------------
// CSS (einmalig injizieren)
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
      margin-bottom: 4px;
    }
    @media (min-width: 640px) {
      .kpi-value { font-size: 22px; }
    }
    .kpi-sub {
      color: var(--neu-text-muted);
      font-size: 11px;
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
      font-family: inherit;
      font-size: 12px;
      margin-top: 16px;
      padding: 0;
      transition: color 0.15s ease;
    }
    .link-btn:hover { color: var(--neu-accent-dark); }

    /* ── Horizontale Monatsbalken ── */
    .hbars-wrap {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .hbar-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }
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
    .hbar-ref-legend {
      color: var(--neu-text-muted);
      font-size: 10px;
      margin-top: 10px;
      text-align: right;
    }
    .hbar-val {
      color: var(--neu-text-muted);
      font-size: 11px;
      text-align: right;
      width: 72px;
      flex-shrink: 0;
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
