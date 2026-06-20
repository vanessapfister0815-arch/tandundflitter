// pages/payouts.js — Auszahlungen

import { sbQuery } from '../core/supabase.js'
import { fmt, fmtDate, PAYOUTS_STATUS_LABELS } from '../core/helpers.js'
import { loaderHtml, errorState, emptyState, badge } from '../components/shared.js'

export default async function PagePayouts(root) {
  root.innerHTML = `
    <div class="page-inner">
      <div class="page-title-row">
        <h2 class="page-title">Auszahlungen</h2>
      </div>
      <div id="payouts-table-wrap">${loaderHtml()}</div>
    </div>
  `

  let payouts = []

  try {
    payouts = await sbQuery(sb =>
      sb.from('payouts')
        .select('*, customers(name)')
        .order('payout_date', { ascending: false })
    )
    renderTable(root, payouts)
  } catch (err) {
    root.querySelector('#payouts-table-wrap').innerHTML = errorState(err.message)
  }
}

function renderTable(root, payouts) {
  const wrap = root.querySelector('#payouts-table-wrap')

  if (!payouts.length) {
    wrap.innerHTML = emptyState('Keine Auszahlungen vorhanden')
    return
  }

  wrap.innerHTML = `
    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Auszahlungsdatum</th>
            <th>Kunde</th>
            <th>Auszahlungsbetrag</th>
            <th>Tatsächliche Auszahlung</th>
            <th>Bonus</th>
            <th>Zahlungsweg</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${payouts.map(p => `
            <tr>
              <td>${fmtDate(p.payout_date)}</td>
              <td>${p.customers?.name ?? '—'}</td>
              <td>${fmt(p.payout_amount)}</td>
              <td>${fmt(p.final_payout_amount)}</td>
              <td>${p.bonus ? fmt(p.bonus) : '—'}</td>
              <td>${p.payment_method ?? '—'}</td>
              <td>${badge(PAYOUTS_STATUS_LABELS[p.status] ?? p.status)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `
}
