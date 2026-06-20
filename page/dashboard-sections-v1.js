/**
 * dashboard-sections-v1.js — KpiRow · MonthlyBars · TopCustomers · RecentSales
 * Tand & Flitter · v1.0 · 2026-06-20
 *
 * Exportiert named functions und registriert sie auf window.DashboardSections.
 * Muss vor dashboard.js geladen werden.
 *
 * Abhängigkeiten: keine externen Imports.
 * fmt() ist lokal deklariert — wird in core/helpers.js zentralisiert sobald vorhanden.
 */

;(function () {
  'use strict'

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

  // Rotierendes 4-Farben-Schema für Avatare
  const AVATAR_COLORS = [
    { bg: 'rgba(20,184,166,0.15)', text: '#0f766e' },
    { bg: 'rgba(52,211,153,0.15)', text: '#059669' },
    { bg: 'rgba(251,191,36,0.15)', text: '#b45309' },
    { bg: 'rgba(248,113,113,0.15)', text: '#b91c1c' },
  ]

  // Plattform → Farbe-Mapping (alle 8 Verkaufsplattformen + Fallback)
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
  // 1 — KpiRow
  // Props: { heroData, invStats, selYear }
  // -------------------------------------------------------------------------

  function KpiRow({ heroData, invStats, selYear }) {
    const calcBasis = parseFloat(heroData?.calcBasis || 0)
    const dailyAvg  = parseFloat(heroData?.dailyAvg  || 0)
    const elapsed   = heroData?.elapsedDays || 1
    const isLegacy  = !!heroData?.isLegacy
    const deltaPct  = heroData?.deltaPct ?? null

    const activeCount = parseInt(invStats?.active_count || 0)
    const activeValue = parseFloat(invStats?.active_value || 0)

    // Δ%-Badge oder Tage-Badge
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
        ${kpiCard({
          label: 'Umsatz',
          value: fmt(calcBasis),
          sub: umsatzSub,
        })}
        ${kpiCard({
          label: 'Tages-Ø',
          value: fmt(dailyAvg),
          sub: `${fmtN(elapsed)} Tage`,
        })}
        ${kpiCard({
          label: 'Aktive Artikel',
          value: fmtN(activeCount),
          sub: `Inventarwert: ${fmt(activeValue)}`,
        })}
        ${kpiCard({
          label: 'Inventarwert',
          value: fmt(activeValue),
          sub: `${fmtN(activeCount)} Artikel`,
        })}
      </div>
    `
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
  // 2 — MonthlyBars
  // Props: { months, history, selYear }
  // -------------------------------------------------------------------------

  function MonthlyBars({ months, history, selYear }) {
    const rows = (months || []).filter(m => parseFloat(m.revenue || 0) > 0)
    if (!rows.length) {
      return `<div class="dash-card"><div class="section-title">Monatliche Entwicklung</div><div class="empty-hint">Keine Verkäufe in ${selYear}</div></div>`
    }

    // Max-Wert für Skalierung
    const maxVal = Math.max(...rows.map(m => parseFloat(m.revenue || 0)))

    // Vorjahres-Monatsdurchschnitt für Referenzlinie
    const prevRow = (history || []).find(r => parseInt(r.year) === selYear - 1)
    const prevBasis = prevRow ? parseFloat(prevRow.calculation_basis || 0) : null
    const refAvg = (prevBasis !== null && prevBasis > 0) ? prevBasis / 12 : null
    const refPct = (refAvg !== null && maxVal > 0) ? (refAvg / maxVal) * 100 : null

    const MONTH_NAMES = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']

    const bars = rows.map((m, i) => {
      const val  = parseFloat(m.revenue || 0)
      const pct  = maxVal > 0 ? (val / maxVal) * 100 : 0
      const mIdx = parseInt(m.month || i + 1) - 1
      const name = MONTH_NAMES[mIdx] || `M${m.month}`

      // Tooltip-Werte (delta zum Vorjahres-Monatsdurchschnitt)
      let deltaEur = null, deltaPctM = null
      if (refAvg !== null) {
        deltaEur = val - refAvg
        deltaPctM = refAvg > 0 ? (deltaEur / refAvg) * 100 : null
      }

      return `
        <div class="bar-col"
          data-val="${val}"
          data-delta-eur="${deltaEur !== null ? deltaEur.toFixed(2) : ''}"
          data-delta-pct="${deltaPctM !== null ? deltaPctM.toFixed(1) : ''}"
        >
          <div class="bar-track">
            <div class="bar-fill" style="height:${pct}%"></div>
            ${refPct !== null ? `<div class="bar-ref" style="bottom:${refPct}%"></div>` : ''}
          </div>
          <div class="bar-name">${name}</div>
        </div>
      `
    }).join('')

    const refLabel = refPct !== null
      ? `<div class="bar-ref-label" style="bottom:calc(${refPct}% + 4px)">Ø VJ</div>`
      : ''

    return `
      <div class="dash-card">
        <div class="section-title">Monatliche Entwicklung ${selYear}</div>
        <div class="bars-wrap">
          <div class="bars-inner">
            ${bars}
          </div>
          ${refLabel}
        </div>
      </div>
      <div id="barTooltip" class="bar-tooltip" style="display:none;"></div>
    `
  }

  // Tooltip-Interaktion nach Render
  function MonthlyBarsInit(container) {
    const tooltip = document.getElementById('barTooltip')
    if (!tooltip) return

    function showTip(e, col) {
      const deltaEur = parseFloat(col.dataset.deltaEur || 'NaN')
      const deltaPct = parseFloat(col.dataset.deltaPct || 'NaN')
      if (isNaN(deltaEur)) { tooltip.style.display = 'none'; return }

      const sign  = deltaEur >= 0 ? '+' : ''
      const color = deltaEur >= 0 ? 'var(--neu-green)' : 'var(--neu-red)'
      tooltip.innerHTML = `
        <span style="color:${color};font-weight:500;">${sign}${fmt(deltaEur)}</span>
        ${!isNaN(deltaPct)
          ? `<span style="color:${color};margin-left:8px;">(${sign}${deltaPct.toFixed(1)} %)</span>`
          : ''}
      `
      tooltip.style.display = 'block'
      moveTip(e)
    }

    function moveTip(e) {
      tooltip.style.left = (e.clientX + 12) + 'px'
      tooltip.style.top  = (e.clientY - 36) + 'px'
    }

    function hideTip() {
      tooltip.style.display = 'none'
    }

    container.querySelectorAll('.bar-col').forEach(col => {
      col.addEventListener('mouseenter', e => showTip(e, col))
      col.addEventListener('mousemove', moveTip)
      col.addEventListener('mouseleave', hideTip)
    })
  }

  // -------------------------------------------------------------------------
  // 3 — TopCustomers
  // Props: { customers, year, onNavigate }
  // -------------------------------------------------------------------------

  function TopCustomers({ customers, year, onNavigate }) {
    const rows = [...(customers || [])]
      .sort((a, b) => parseFloat(b.calculation_basis_year || 0) - parseFloat(a.calculation_basis_year || 0))

    const items = rows.map((c, i) => {
      const col   = AVATAR_COLORS[i % AVATAR_COLORS.length]
      const basis = parseFloat(c.calculation_basis_year || 0)
      const count = parseInt(c.sales_count || 0)
      const avg   = count > 0 ? basis / count : 0
      const saldo = parseFloat(c.open_balance || 0)

      return `
        <div class="customer-row">
          <div class="customer-avatar" style="background:${col.bg};color:${col.text};">
            ${initials(c.customer_name)}
          </div>
          <div class="customer-info">
            <div class="customer-name">${c.customer_name || '—'}</div>
            <div class="customer-meta">${fmtN(count)} Verkäufe · Ø ${fmt(avg)}</div>
          </div>
          <div class="customer-nums">
            <div class="customer-basis">${fmt(basis)}</div>
            <div class="customer-saldo" style="color:${saldo > 0 ? 'var(--neu-amber)' : 'var(--neu-text-muted)'}">
              ${saldo > 0 ? fmt(saldo) + ' offen' : '—'}
            </div>
          </div>
        </div>
      `
    }).join('')

    return `
      <div class="dash-card">
        <div class="section-title">Top-Kunden ${year}</div>
        ${rows.length ? `<div class="customer-list">${items}</div>` : `<div class="empty-hint">Keine Daten</div>`}
        <button class="link-btn" onclick="(${function(fn){ fn('customers') }.toString()})(window.__dashNav)">
          → Alle Kunden
        </button>
      </div>
    `
  }

  // -------------------------------------------------------------------------
  // 4 — RecentSales
  // Props: { recent, onNavigate }
  // -------------------------------------------------------------------------

  function RecentSales({ recent, onNavigate }) {
    const rows = recent || []

    const items = rows.map(s => {
      const platColor = platformColor(s.platform)
      const basis = parseFloat(s.calculation_basis || 0)
      const op    = parseFloat(s.operator_fee || 0)
      const inv   = s.inventory_number || '—'
      const desc  = s.article_description_override || s.description || '—'

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
        <button class="link-btn" onclick="console.log('navigate:sales')">
          → Alle Verkäufe
        </button>
      </div>
    `
  }

  // -------------------------------------------------------------------------
  // CSS injizieren
  // -------------------------------------------------------------------------

  function injectCSS() {
    if (document.getElementById('dash-v1-css')) return
    const style = document.createElement('style')
    style.id = 'dash-v1-css'
    style.textContent = `
      /* KPI Grid */
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

      /* Gemeinsame Karte */
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
        font-size: 12px;
        margin-top: 16px;
        padding: 0;
        text-align: left;
        transition: color 0.15s ease;
      }
      .link-btn:hover { color: var(--neu-accent-dark); }

      /* Balken-Chart */
      .bars-wrap {
        position: relative;
        padding-right: 40px; /* Platz für "Ø VJ"-Label */
      }
      .bars-inner {
        display: flex;
        align-items: flex-end;
        gap: 6px;
        height: 140px;
        position: relative;
      }
      @media (min-width: 640px) {
        .bars-inner { height: 180px; gap: 8px; }
      }
      .bar-col {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        height: 100%;
        cursor: default;
        position: relative;
      }
      .bar-track {
        width: 100%;
        flex: 1;
        border-radius: 6px;
        box-shadow: inset 4px 4px 10px var(--neu-shadow-dark), inset -4px -4px 10px var(--neu-shadow-light);
        position: relative;
        overflow: visible;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
      }
      .bar-fill {
        width: 100%;
        background: linear-gradient(180deg, #34d399, #14b8a6);
        border-radius: 4px;
        min-height: 2px;
        transition: height 0.3s ease;
      }
      .bar-ref {
        position: absolute;
        left: -2px;
        right: -2px;
        height: 1.5px;
        background: var(--neu-text-muted);
        border-top: 1.5px dashed var(--neu-text-muted);
        pointer-events: none;
      }
      .bar-ref-label {
        position: absolute;
        right: 0;
        font-size: 10px;
        color: var(--neu-text-muted);
        white-space: nowrap;
        pointer-events: none;
      }
      .bar-name {
        color: var(--neu-text-muted);
        font-size: 10px;
        margin-top: 4px;
        text-align: center;
      }

      /* Tooltip */
      .bar-tooltip {
        background: var(--neu-bg);
        border-radius: var(--neu-radius-sm);
        box-shadow: 6px 6px 14px var(--neu-shadow-dark), -6px -6px 14px var(--neu-shadow-light);
        font-size: 12px;
        padding: 6px 12px;
        pointer-events: none;
        position: fixed;
        white-space: nowrap;
        z-index: 1000;
      }

      /* Kunden */
      .customer-list { display: flex; flex-direction: column; gap: 10px; }
      .customer-row {
        display: flex;
        align-items: center;
        gap: 10px;
      }
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
      .customer-meta {
        color: var(--neu-text-muted);
        font-size: 11px;
        margin-top: 2px;
      }
      .customer-nums { text-align: right; flex-shrink: 0; }
      .customer-basis {
        color: var(--neu-text-strong);
        font-size: 13px;
        font-weight: 500;
      }
      .customer-saldo {
        font-size: 11px;
        margin-top: 2px;
      }

      /* Letzte Verkäufe */
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
      .sale-plat {
        font-size: 11px;
        font-weight: 500;
        white-space: nowrap;
      }
      .sale-nums { text-align: right; }
      .sale-basis {
        color: var(--neu-text-strong);
        font-size: 13px;
        font-weight: 500;
      }
      .sale-op {
        color: var(--neu-text-muted);
        font-size: 11px;
        margin-top: 2px;
      }
    `
    document.head.appendChild(style)
  }

  // -------------------------------------------------------------------------
  // Registrierung
  // -------------------------------------------------------------------------

  injectCSS()

  window.DashboardSections = window.DashboardSections || {}
  Object.assign(window.DashboardSections, {
    KpiRow,
    MonthlyBars,
    MonthlyBarsInit,
    TopCustomers,
    RecentSales,
  })
})()
