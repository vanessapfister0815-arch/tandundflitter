// pages/accounting.js — Buchhaltung / Jahresübersicht

import { sbRpc } from '../core/supabase.js'
import { fmt, currentYear } from '../core/helpers.js'
import { loaderHtml, errorState, emptyState } from '../components/shared.js'

export default async function PageAccounting(root) {
  root.innerHTML = `
    <div class="page-inner">
      <div class="page-title-row">
        <h2 class="page-title">Buchhaltung</h2>
      </div>
      <div id="accounting-wrap">${loaderHtml()}</div>
    </div>
  `

  try {
    const rows = await sbRpc('get_yearly_history')
    renderHistory(root, rows ?? [])
  } catch (err) {
    root.querySelector('#accounting-wrap').innerHTML = errorState(err.message)
  }
}

function renderHistory(root, rows) {
  const wrap = root.querySelector('#accounting-wrap')

  if (!rows.length) {
    wrap.innerHTML = emptyState('Keine Daten vorhanden')
    return
  }

  wrap.innerHTML = `
    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Jahr</th>
            <th>Umsatz</th>
            <th>Mein Anteil</th>
            <th>Anzahl Verkäufe</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              <td>${r.year}</td>
              <td>${fmt(r.total_revenue ?? r.calculation_basis)}</td>
              <td>${fmt(r.total_operator ?? r.operator_fee)}</td>
              <td>${r.sale_count ?? '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `
}
