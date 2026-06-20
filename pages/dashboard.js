// pages/dashboard.js — Dashboard mit KPI-Übersicht

import { sbRpc } from '../core/supabase.js'
import { fmt, currentYear } from '../core/helpers.js'
import { kpiCard, loaderHtml, errorState } from '../components/shared.js'

export default async function PageDashboard(root) {
  root.innerHTML = `
    <div class="page-inner">
      <div class="page-title-row">
        <h2 class="page-title">Dashboard</h2>
        <span class="page-year" id="dash-year">${currentYear()}</span>
      </div>
      <section id="dash-sales-kpis" class="kpi-grid">${loaderHtml()}</section>
      <section id="dash-payout-kpis" class="kpi-grid" style="margin-top:16px">${loaderHtml()}</section>
      <section id="dash-inventory-kpis" class="kpi-grid" style="margin-top:16px">${loaderHtml()}</section>
    </div>
  `

  const year = currentYear()

  try {
    const [salesStats, payoutStats, inventoryStats] = await Promise.all([
      sbRpc('get_sales_stats', { p_year: year }),
      sbRpc('get_payout_stats', { p_year: year }),
      sbRpc('get_inventory_stats'),
    ])

    const s = Array.isArray(salesStats) ? salesStats[0] : salesStats
    const p = Array.isArray(payoutStats) ? payoutStats[0] : payoutStats
    const i = Array.isArray(inventoryStats) ? inventoryStats[0] : inventoryStats

    root.querySelector('#dash-sales-kpis').innerHTML = `
      ${kpiCard('Umsatz Jahr',        fmt(s?.ytd_revenue))}
      ${kpiCard('Mein Anteil Jahr',   fmt(s?.ytd_operator))}
      ${kpiCard('Daily Average',      fmt(s?.daily_average))}
      ${kpiCard('Gesamtumsatz',       fmt(s?.alltime_revenue))}
    `

    root.querySelector('#dash-payout-kpis').innerHTML = `
      ${kpiCard('Realisiert Jahr',     fmt(p?.realized_year_a))}
      ${kpiCard('Auszahlbar Jahr',     fmt(p?.payable_year))}
      ${kpiCard('Offene Auszahlungen', fmt(p?.open_payouts))}
    `

    root.querySelector('#dash-inventory-kpis').innerHTML = `
      ${kpiCard('Aktive Artikel', i?.active_count ?? '—')}
      ${kpiCard('Inventarwert',   fmt(i?.active_value))}
    `
  } catch (err) {
    const msg = errorState(`Fehler: ${err.message}`)
    root.querySelector('#dash-sales-kpis').innerHTML    = msg
    root.querySelector('#dash-payout-kpis').innerHTML   = ''
    root.querySelector('#dash-inventory-kpis').innerHTML = ''
  }
}
