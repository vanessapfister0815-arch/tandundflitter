// pages/inventory.js — Inventar

import { sbQuery } from '../core/supabase.js'
import { esc, fmtDate, ARTICLE_STATUS_LABELS } from '../core/helpers.js'
import { loaderHtml, errorState, emptyState, badge } from '../components/shared.js'

export default async function PageInventory(root) {
  root.innerHTML = `
    <div class="page-inner">
      <div class="page-title-row">
        <h2 class="page-title">Inventar</h2>
      </div>
      <div class="toolbar">
        <input class="input search-input" id="inv-search" type="search" placeholder="Suchen…" />
      </div>
      <div id="inv-table-wrap">${loaderHtml()}</div>
    </div>
  `

  let articles = []

  try {
    articles = await sbQuery(sb =>
      sb.from('vw_articles_detail')
        .select('*')
        .order('purchase_date', { ascending: false })
    )
    renderTable(root, articles)
  } catch (err) {
    root.querySelector('#inv-table-wrap').innerHTML = errorState(err.message)
    return
  }

  root.querySelector('#inv-search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase()
    const filtered = articles.filter(a =>
      (a.description ?? '').toLowerCase().includes(q) ||
      (a.inventory_number ?? '').toLowerCase().includes(q)
    )
    renderTable(root, filtered)
  })
}

function renderTable(root, articles) {
  const wrap = root.querySelector('#inv-table-wrap')

  if (!articles.length) {
    wrap.innerHTML = emptyState('Keine Artikel gefunden')
    return
  }

  wrap.innerHTML = `
    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Inventarnummer</th>
            <th>Beschreibung</th>
            <th>Aufnahmedatum</th>
            <th>Listenpreis</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${articles.map(a => `
            <tr>
              <td>${esc(a.inventory_number)}</td>
              <td>${esc(a.description)}</td>
              <td>${fmtDate(a.purchase_date)}</td>
              <td>${a.list_price != null ? a.list_price.toFixed(2) + ' €' : '—'}</td>
              <td>${badge(ARTICLE_STATUS_LABELS[a.status] ?? a.status)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `
}
