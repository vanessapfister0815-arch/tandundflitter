/**
 * dashboard.js — Container, State, Load, Render
 * Tand & Flitter · v1.0 · 2026-06-20
 *
 * Voraussetzungen:
 *   - window.supabase (Supabase JS SDK via CDN)
 *   - window.DashboardSections (befüllt von v1/v2/v3 bevor dieses Modul lädt)
 *   - sbRpc(name, params?)  → data (wirft bei Fehler)
 *   - sbQuery(view, opts)   → Array (wirft bei Fehler)
 *
 * Ladereihenfolge in index.html:
 *   dashboard-sections-v1.js → v2 → v3 → dashboard.js
 */

// ---------------------------------------------------------------------------
// Supabase-Hilfsfunktionen (provisorisch bis core/supabase.js existiert)
// ---------------------------------------------------------------------------

const SUPABASE_URL = 'https://yejkhxeroxccvwsadqku.supabase.co'
const SUPABASE_ANON_KEY = window.__SUPABASE_ANON_KEY || ''

function getClient() {
  if (!window._sbClient) {
    window._sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  }
  return window._sbClient
}

async function sbRpc(name, params = {}) {
  const { data, error } = await getClient().rpc(name, params)
  if (error) throw new Error(`RPC ${name}: ${error.message}`)
  return data
}

async function sbQuery(view, opts = {}) {
  let q = getClient().from(view).select(opts.select || '*')
  if (opts.filters) {
    for (const f of opts.filters) {
      // Format: 'column=operator.value'
      const eq = f.indexOf('=')
      const col = f.slice(0, eq)
      const rest = f.slice(eq + 1)
      const dot = rest.indexOf('.')
      const op = rest.slice(0, dot)
      const val = rest.slice(dot + 1)
      if (op === 'eq')  q = q.eq(col, val)
      else if (op === 'gte') q = q.gte(col, val)
      else if (op === 'lt')  q = q.lt(col, val)
      else if (op === 'lte') q = q.lte(col, val)
      else if (op === 'neq') q = q.neq(col, val)
    }
  }
  if (opts.order) {
    const [col, dir] = opts.order.split('.')
    q = q.order(col, { ascending: dir === 'asc' })
  }
  if (opts.limit) q = q.limit(opts.limit)
  const { data, error } = await q
  if (error) throw new Error(`Query ${view}: ${error.message}`)
  return data || []
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const state = {
  selYear: new Date().getFullYear(),
  // Base data (laden einmalig)
  invStats: null,
  vintages: null,
  history: null,
  // Jahres-abhängige Daten
  salesStats: null,
  months: null,
  customers: null,
  recent: null,
  platRows: null,
  // Ladezustände
  baseLoading: true,
  yearLoading: false,
  baseError: null,
  yearError: null,
}

// ---------------------------------------------------------------------------
// Daten laden
// ---------------------------------------------------------------------------

async function loadBase() {
  state.baseLoading = true
  state.baseError = null
  try {
    const [invStats, vintages, history] = await Promise.all([
      sbRpc('get_inventory_stats'),
      sbRpc('get_inventory_vintages'),
      sbRpc('get_yearly_history'),
    ])
    state.invStats = invStats
    state.vintages = vintages
    state.history = history
  } catch (err) {
    state.baseError = err.message
  } finally {
    state.baseLoading = false
  }
}

async function loadYear(year) {
  state.yearLoading = true
  state.yearError = null
  const y = year
  const y1 = year + 1
  try {
    const [salesStats, months, customers, recent, platRows] = await Promise.all([
      sbRpc('get_sales_stats', { p_year: y }),
      sbRpc('get_monthly_stats', { p_year: y }),
      sbRpc('get_customer_summary', { p_year: y }),
      sbQuery('vw_sales_detail', {
        filters: [
          'status=eq.successful',
          `sale_date=gte.${y}-01-01`,
          `sale_date=lt.${y1}-01-01`,
        ],
        order: 'sale_date.desc',
        limit: 10,
      }),
      sbQuery('vw_sales_detail', {
        select: 'platform,calculation_basis',
        filters: [
          'status=eq.successful',
          `sale_date=gte.${y}-01-01`,
          `sale_date=lt.${y1}-01-01`,
        ],
        limit: 5000,
      }),
    ])
    state.salesStats = salesStats
    state.months = months
    state.customers = customers
    state.recent = recent
    state.platRows = platRows
  } catch (err) {
    state.yearError = err.message
  } finally {
    state.yearLoading = false
  }
}

// ---------------------------------------------------------------------------
// Hero-Berechnung
// ---------------------------------------------------------------------------

function buildHeroData() {
  const { salesStats, history, selYear } = state
  const today = new Date()
  const currentYear = today.getFullYear()
  const isCurrentYear = selYear === currentYear

  // Prüfen ob echter Sale-Eintrag existiert (Legacy-Jahre haben ytd_revenue === 0 oder null)
  const hasLiveSales = salesStats && parseFloat(salesStats.ytd_revenue || 0) > 0

  // Legacy-Eintrag suchen
  const legacyRow = (history || []).find(
    r => parseInt(r.year) === selYear && r.source === 'legacy'
  )

  const isLegacy = !hasLiveSales && !!legacyRow

  if (isLegacy) {
    const basis = parseFloat(legacyRow.calculation_basis || 0)
    const avg = parseFloat(legacyRow.daily_average || 0)
    return { calcBasis: basis, dailyAvg: avg, isLegacy: true, elapsedDays: 365 }
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

  // Vorjahres-Umsatz für Δ%
  const prevRow = (history || []).find(r => parseInt(r.year) === selYear - 1)
  const prevBasis = prevRow ? parseFloat(prevRow.calculation_basis || 0) : null

  let deltaPct = null
  if (prevBasis !== null && prevBasis > 0) {
    deltaPct = ((calcBasis - prevBasis) / prevBasis) * 100
  }

  return { calcBasis, dailyAvg, isLegacy: false, elapsedDays, deltaPct }
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function getSection(name) {
  const s = window.DashboardSections?.[name]
  if (!s) console.warn(`DashboardSections.${name} nicht gefunden`)
  return s
}

function renderNav(container) {
  const thisYear = new Date().getFullYear()
  const years = []
  for (let y = thisYear; y >= 2022; y--) years.push(y)

  const navItems = [
    { label: 'Dashboard', active: true },
    { label: 'Inventar', active: false },
    { label: 'Verkäufe', active: false },
    { label: 'Auszahlungen', active: false },
    { label: 'Kunden', active: false },
    { label: 'Buchhaltung', active: false },
  ]

  container.innerHTML = `
    <nav class="topbar">
      <div class="topbar-brand">Tand & Flitter</div>
      <select class="year-select" id="yearSelect">
        ${years.map(y => `<option value="${y}"${y === state.selYear ? ' selected' : ''}>${y}</option>`).join('')}
      </select>
    </nav>
    <div class="nav-pills-wrap">
      <div class="nav-pills">
        ${navItems.map(item => `
          <button
            class="nav-pill${item.active ? ' nav-pill--active' : ''}"
            style="${!item.active ? 'pointer-events:none;cursor:default;' : ''}"
          >${item.label}</button>
        `).join('')}
      </div>
    </div>
  `

  container.querySelector('#yearSelect').addEventListener('change', async e => {
    state.selYear = parseInt(e.target.value)
    await loadYear(state.selYear)
    renderContent()
  })
}

function renderError(el, msg) {
  el.innerHTML = `<div class="dash-error">Fehler: ${msg}</div>`
}

function renderSpinner(el) {
  el.innerHTML = `<div class="dash-spinner">Laden…</div>`
}

function renderContent() {
  const main = document.getElementById('dashMain')
  if (!main) return

  if (state.yearLoading) {
    renderSpinner(main)
    return
  }

  if (state.yearError) {
    renderError(main, state.yearError)
    return
  }

  const heroData = buildHeroData()
  const S = window.DashboardSections || {}

  // Vorjahres-Basis für Monatschart-Referenzlinie
  const prevRow = (state.history || []).find(
    r => parseInt(r.year) === state.selYear - 1
  )

  main.innerHTML = ''

  // 1 — KPI-Reihe
  const kpiEl = document.createElement('div')
  kpiEl.className = 'dash-section'
  if (S.KpiRow) {
    kpiEl.innerHTML = S.KpiRow({ heroData, invStats: state.invStats, selYear: state.selYear })
  }
  main.appendChild(kpiEl)

  // 2 — Monatliche Entwicklung
  const barsEl = document.createElement('div')
  barsEl.className = 'dash-section'
  if (S.MonthlyBars) {
    barsEl.innerHTML = S.MonthlyBars({
      months: state.months,
      history: state.history,
      selYear: state.selYear,
    })
    // Event-Listener für Tooltip (delegiert nach Render)
    if (S.MonthlyBarsInit) S.MonthlyBarsInit(barsEl)
  }
  main.appendChild(barsEl)

  // 3 + 4 — Kunden & Letzte Verkäufe (nebeneinander)
  const gridEl = document.createElement('div')
  gridEl.className = 'dash-section bottom-grid'
  const customersEl = document.createElement('div')
  const recentEl = document.createElement('div')
  if (S.TopCustomers) {
    customersEl.innerHTML = S.TopCustomers({
      customers: state.customers,
      year: state.selYear,
      onNavigate: target => console.log('navigate:', target),
    })
  }
  if (S.RecentSales) {
    recentEl.innerHTML = S.RecentSales({
      recent: state.recent,
      onNavigate: target => console.log('navigate:', target),
    })
  }
  gridEl.appendChild(customersEl)
  gridEl.appendChild(recentEl)
  main.appendChild(gridEl)
}

// ---------------------------------------------------------------------------
// Mount
// ---------------------------------------------------------------------------

async function mountDashboard() {
  const app = document.getElementById('app')
  if (!app) return

  // Grundstruktur
  app.innerHTML = `
    <div id="dashNav"></div>
    <div class="dash-content">
      <div id="dashMain"></div>
    </div>
  `

  // Nav rendern (sofort, mit Spinner im Main)
  renderNav(document.getElementById('dashNav'))
  renderSpinner(document.getElementById('dashMain'))

  // Base laden
  await loadBase()

  if (state.baseError) {
    renderError(document.getElementById('dashMain'), state.baseError)
    return
  }

  // Jahres-Daten laden
  await loadYear(state.selYear)

  // Content rendern
  renderContent()
}

// ---------------------------------------------------------------------------
// CSS (einmalig injizieren)
// ---------------------------------------------------------------------------

function injectDashboardCSS() {
  if (document.getElementById('dash-css')) return
  const style = document.createElement('style')
  style.id = 'dash-css'
  style.textContent = `
    /* Topbar */
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
      font-size: 13px;
      font-weight: 500;
      padding: 6px 12px;
      cursor: pointer;
      outline: none;
    }
    .year-select:focus {
      outline: 2px solid var(--neu-accent);
    }

    /* Nav Pills */
    .nav-pills-wrap {
      padding: 0 20px 16px;
    }
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

    /* Layout */
    .dash-content {
      padding: 0 16px 32px;
    }
    .dash-section {
      margin-bottom: 16px;
    }
    .bottom-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }
    @media (min-width: 640px) {
      .dash-content { padding: 0 24px 32px; }
      .bottom-grid { grid-template-columns: repeat(2, 1fr); }
    }

    /* Feedback */
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

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

injectDashboardCSS()
mountDashboard()
