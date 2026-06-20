// pages/dashboard.js — Container, State, Load, Render
// Tand & Flitter · v2.0 · 2026-06-20
// Umgeschrieben von window-Globals auf native ES-Module.

import { sbRpc, sbQuery } from '../core/supabase.js'
import {
  KpiRow,
  MonthlyBars,
  MonthlyBarsInit,
  TopCustomers,
  RecentSales,
  injectSectionsCSS,
} from './dashboard-sections.js'

// -------------------------------------------------------------------------
// State
// -------------------------------------------------------------------------

const state = {
  selYear:     new Date().getFullYear(),
  invStats:    null,
  vintages:    null,
  history:     null,
  salesStats:  null,
  months:      null,
  customers:   null,
  recent:      null,
  baseLoading: true,
  yearLoading: false,
  baseError:   null,
  yearError:   null,
}

// -------------------------------------------------------------------------
// Daten laden
// -------------------------------------------------------------------------

async function loadBase() {
  state.baseLoading = true
  state.baseError   = null
  try {
    const [invStats, vintages, history] = await Promise.all([
      sbRpc('get_inventory_stats'),
      sbRpc('get_inventory_vintages'),
      sbRpc('get_yearly_history'),
    ])
    state.invStats  = invStats
    state.vintages  = vintages
    state.history   = history
  } catch (err) {
    state.baseError = err.message
  } finally {
    state.baseLoading = false
  }
}

async function loadYear(year) {
  state.yearLoading = true
  state.yearError   = null
  const y  = year
  const y1 = year + 1
  try {
    const [salesStats, months, customers, recent] = await Promise.all([
      sbRpc('get_sales_stats',      { p_year: y }),
      sbRpc('get_monthly_stats',    { p_year: y }),
      sbRpc('get_customer_summary', { p_year: y }),
      sbQuery(sb =>
        sb.from('vw_sales_detail')
          .select('*')
          .eq('status', 'successful')
          .gte('sale_date', `${y}-01-01`)
          .lt('sale_date',  `${y1}-01-01`)
          .order('sale_date', { ascending: false })
          .limit(10)
      ),
    ])
    state.salesStats = salesStats
    state.months     = months
    state.customers  = customers
    state.recent     = recent
  } catch (err) {
    state.yearError = err.message
  } finally {
    state.yearLoading = false
  }
}

// -------------------------------------------------------------------------
// Hero-Berechnung
// -------------------------------------------------------------------------

function buildHeroData() {
  const { salesStats, history, selYear } = state
  const today       = new Date()
  const currentYear = today.getFullYear()
  const isCurrentYear = selYear === currentYear

  const hasLiveSales = salesStats && parseFloat(salesStats.ytd_revenue || 0) > 0
  const legacyRow    = (history || []).find(
    r => parseInt(r.year) === selYear && r.source === 'legacy'
  )
  const isLegacy = !hasLiveSales && !!legacyRow

  if (isLegacy) {
    return {
      calcBasis:   parseFloat(legacyRow.calculation_basis || 0),
      dailyAvg:    parseFloat(legacyRow.daily_average     || 0),
      isLegacy:    true,
      elapsedDays: 365,
    }
  }

  const calcBasis = parseFloat(salesStats?.ytd_revenue || 0)
  let elapsedDays
  if (isCurrentYear) {
    const jan1 = new Date(currentYear, 0, 1)
    elapsedDays = Math.floor((today - jan1) / 86400000) + 1
  } else {
    elapsedDays = 365
  }
  const dailyAvg = elapsedDays > 0 ? calcBasis / elapsedDays : 0

  const prevRow   = (history || []).find(r => parseInt(r.year) === selYear - 1)
  const prevBasis = prevRow ? parseFloat(prevRow.calculation_basis || 0) : null
  const deltaPct  = (prevBasis !== null && prevBasis > 0)
    ? ((calcBasis - prevBasis) / prevBasis) * 100
    : null

  return { calcBasis, dailyAvg, isLegacy: false, elapsedDays, deltaPct }
}

// -------------------------------------------------------------------------
// Render
// -------------------------------------------------------------------------

function renderSpinner(el) {
  el.innerHTML = `<div class="dash-spinner">Laden…</div>`
}

function renderError(el, msg) {
  el.innerHTML = `<div class="dash-error">Fehler: ${msg}</div>`
}

function renderContent(root) {
  const main = root.querySelector('#dashMain')
  if (!main) return

  if (state.yearLoading) { renderSpinner(main); return }
  if (state.yearError)   { renderError(main, state.yearError); return }

  const heroData = buildHeroData()

  main.innerHTML = ''

  // 1 — KPI-Reihe
  const kpiEl = document.createElement('div')
  kpiEl.className = 'dash-section'
  kpiEl.innerHTML = KpiRow({ heroData, invStats: state.invStats, selYear: state.selYear })
  main.appendChild(kpiEl)

  // 2 — Monatliche Entwicklung
  const barsEl = document.createElement('div')
  barsEl.className = 'dash-section'
  barsEl.innerHTML = MonthlyBars({ months: state.months, history: state.history, selYear: state.selYear })
  MonthlyBarsInit(barsEl)
  main.appendChild(barsEl)

  // 3 + 4 — Kunden & Letzte Verkäufe
  const gridEl = document.createElement('div')
  gridEl.className = 'dash-section bottom-grid'

  const customersEl = document.createElement('div')
  customersEl.innerHTML = TopCustomers({ customers: state.customers, year: state.selYear })

  const recentEl = document.createElement('div')
  recentEl.innerHTML = RecentSales({ recent: state.recent })

  gridEl.appendChild(customersEl)
  gridEl.appendChild(recentEl)
  main.appendChild(gridEl)
}

function renderNav(root) {
  const thisYear = new Date().getFullYear()
  const years    = []
  for (let y = thisYear; y >= 2022; y--) years.push(y)

  const navEl = root.querySelector('#dashNav')
  navEl.innerHTML = `
    <nav class="topbar">
      <div class="topbar-brand">Tand & Flitter</div>
      <select class="year-select" id="yearSelect">
        ${years.map(y => `<option value="${y}"${y === state.selYear ? ' selected' : ''}>${y}</option>`).join('')}
      </select>
    </nav>
    <div class="nav-pills-wrap">
      <div class="nav-pills">
        <button class="nav-pill nav-pill--active">Dashboard</button>
        <button class="nav-pill" disabled>Inventar</button>
        <button class="nav-pill" disabled>Verkäufe</button>
        <button class="nav-pill" disabled>Auszahlungen</button>
        <button class="nav-pill" disabled>Kunden</button>
        <button class="nav-pill" disabled>Buchhaltung</button>
      </div>
    </div>
  `

  navEl.querySelector('#yearSelect').addEventListener('change', async e => {
    state.selYear = parseInt(e.target.value)
    renderSpinner(root.querySelector('#dashMain'))
    await loadYear(state.selYear)
    renderContent(root)
  })
}

// -------------------------------------------------------------------------
// CSS (Layout + Feedback)
// -------------------------------------------------------------------------

function injectLayoutCSS() {
  if (document.getElementById('dash-layout-css')) return
  const style = document.createElement('style')
  style.id = 'dash-layout-css'
  style.textContent = `
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px 12px;
    }
    .topbar-brand {
      font-size: 18px;
      font-weight: 500;
      color: var(--neu-text-strong);
      letter-spacing: -0.3px;
    }
    .year-select {
      background: var(--neu-bg);
      border: none;
      border-radius: var(--neu-radius-sm);
      box-shadow: inset 4px 4px 10px var(--neu-shadow-dark), inset -4px -4px 10px var(--neu-shadow-light);
      color: var(--neu-text-strong);
      font-family: inherit;
      font-size: 13px;
      font-weight: 500;
      padding: 6px 12px;
      cursor: pointer;
    }
    .year-select:focus { outline: 2px solid var(--neu-accent); }
    .nav-pills-wrap { padding: 0 20px 16px; }
    .nav-pills {
      display: flex;
      gap: 6px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
    }
    .nav-pills::-webkit-scrollbar { display: none; }
    .nav-pill {
      background: var(--neu-bg);
      border: none;
      border-radius: var(--neu-radius-pill);
      box-shadow: 3px 3px 7px var(--neu-shadow-dark), -3px -3px 7px var(--neu-shadow-light);
      color: var(--neu-text);
      cursor: pointer;
      font-family: inherit;
      font-size: 13px;
      font-weight: 400;
      padding: 6px 16px;
      white-space: nowrap;
      transition: box-shadow 0.15s ease;
    }
    .nav-pill--active {
      box-shadow: inset 4px 4px 10px var(--neu-shadow-dark), inset -4px -4px 10px var(--neu-shadow-light);
      color: var(--neu-accent);
      font-weight: 500;
    }
    .nav-pill:disabled { opacity: 0.5; cursor: default; }
    .dash-content { padding: 0 16px 32px; }
    .dash-section { margin-bottom: 16px; }
    .bottom-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 640px) {
      .dash-content { padding: 0 24px 32px; }
      .bottom-grid  { grid-template-columns: repeat(2, 1fr); }
    }
    .dash-error {
      background: var(--neu-bg);
      border-radius: var(--neu-radius-card);
      box-shadow: 6px 6px 14px var(--neu-shadow-dark), -6px -6px 14px var(--neu-shadow-light);
      color: var(--neu-red);
      font-size: 13px;
      padding: 18px 20px;
    }
    .dash-spinner {
      color: var(--neu-text-muted);
      font-size: 13px;
      padding: 32px 20px;
      text-align: center;
    }
  `
  document.head.appendChild(style)
}

// -------------------------------------------------------------------------
// Mount (Default Export)
// -------------------------------------------------------------------------

export default async function PageDashboard(root) {
  injectLayoutCSS()
  injectSectionsCSS()

  root.innerHTML = `
    <div id="dashNav"></div>
    <div class="dash-content">
      <div id="dashMain"></div>
    </div>
  `

  renderNav(root)
  renderSpinner(root.querySelector('#dashMain'))

  await loadBase()

  if (state.baseError) {
    renderError(root.querySelector('#dashMain'), state.baseError)
    return
  }

  await loadYear(state.selYear)
  renderContent(root)
}
