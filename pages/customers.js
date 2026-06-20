// pages/customers.js — Kunden

import { sbQuery } from '../core/supabase.js'
import { esc, fmt } from '../core/helpers.js'
import { loaderHtml, errorState, emptyState } from '../components/shared.js'

export default async function PageCustomers(root) {
  root.innerHTML = `
    <div class="page-inner">
      <div class="page-title-row">
        <h2 class="page-title">Kunden</h2>
      </div>
      <div id="customers-table-wrap">${loaderHtml()}</div>
    </div>
  `

  try {
    const customers = await sbQuery(sb =>
      sb.from('vw_customer_balances')
        .select('*')
        .order('name', { ascending: true })
    )
    renderTable(root, customers)
  } catch (err) {
    root.querySelector('#customers-table-wrap').innerHTML = errorState(err.message)
  }
}

function renderTable(root, customers) {
  const wrap = root.querySelector('#customers-table-wrap')

  if (!customers.length) {
    wrap.innerHTML = emptyState('Keine Kunden vorhanden')
    return
  }

  wrap.innerHTML = `
    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Gesamtgutschrift</th>
            <th>Ausgezahlt gesamt</th>
            <th>Offener Saldo</th>
          </tr>
        </thead>
        <tbody>
          ${customers.map(c => `
            <tr>
              <td>${esc(c.name)}</td>
              <td>${fmt(c.total_earned)}</td>
              <td>${fmt(c.total_paid)}</td>
              <td class="${c.open_balance > 0 ? 'balance-positive' : ''}">${fmt(c.open_balance)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `
}
