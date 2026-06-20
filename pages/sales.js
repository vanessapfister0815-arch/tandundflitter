// pages/sales.js — Verkäufe

import { sbQuery } from '../core/supabase.js'
import { esc, fmt, fmtDate, SALE_STATUS_LABELS, PAYOUT_STATUS_LABELS } from '../core/helpers.js'
import { loaderHtml, errorState, emptyState, badge } from '../components/shared.js'

export default async function PageSales(root) {
  root.innerHTML = `
    <div class="page-inner">
      <div class="page-title-row">
        <h2 class="page-title">Verkäufe</h2>
      </div>
      <div class="toolbar">
        <input class="input search-input" id="sales-search" type="search" placeholder="Suchen…" />
        <select class="input" id="sales-filter-status">
          <option value="">Alle Status</option>
          <option value="pending">Ausstehend</option>
          <option value="successful">Erfolgreich</option>
          <option value="returned">Retour</option>
          <option value="disputed">Strittig</option>
        </select>
      </div>
      <div id="sales-table-wrap">${loaderHtml()}</div>
    </div>
  `

  let sales = []

  try {
    sales = await sbQuery(sb =>
      sb.from('vw_sales_detail')
        .select('*')
        .order('sale_date', { ascending: false })
    )
    renderTable(root, sales)
  } catch (err) {
    root.querySelector('#sales-table-wrap').innerHTML = errorState(err.message)
    return
  }

  function applyFilters() {
    const q      = root.querySelector('#sales-search').value.toLowerCase()
    const status = root.querySelector('#sales-filter-status').value

    const filtered = sales.filter(s => {
      const matchText = !q ||
        (s.article_description_override ?? s.article_description ?? '').toLowerCase().includes(q) ||
        (s.platform ?? '').toLowerCase().includes(q)
      const matchStatus = !status || s.status === status
      return matchText && matchStatus
    })

    renderTable(root, filtered)
  }

  root.querySelector('#sales-search').addEventListener('input', applyFilters)
  root.querySelector('#sales-filter-status').addEventListener('change', applyFilters)
}

function renderTable(root, sales) {
  const wrap = root.querySelector('#sales-table-wrap')

  if (!sales.length) {
    wrap.innerHTML = emptyState('Keine Verkäufe gefunden')
    return
  }

  wrap.innerHTML = `
    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Verkaufsdatum</th>
            <th>Artikel</th>
            <th>Plattform</th>
            <th>Verkaufspreis</th>
            <th>Umsatz</th>
            <th>Mein Anteil</th>
            <th>Status</th>
            <th>Auszahlungsstatus</th>
          </tr>
        </thead>
        <tbody>
          ${sales.map(s => `
            <tr>
              <td>${fmtDate(s.sale_date)}</td>
              <td>${esc(s.article_description_override ?? s.article_description ?? '—')}</td>
              <td>${esc(s.platform)}</td>
              <td>${fmt(s.sale_price)}</td>
              <td>${fmt(s.calculation_basis)}</td>
              <td>${fmt(s.operator_fee)}</td>
              <td>${badge(SALE_STATUS_LABELS[s.status] ?? s.status)}</td>
              <td>${badge(PAYOUT_STATUS_LABELS[s.payout_status] ?? s.payout_status)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `
}
