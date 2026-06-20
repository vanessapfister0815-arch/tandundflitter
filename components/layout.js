// components/layout.js — App-Shell: Nav + Page-Container

import { signOut } from '../core/auth.js'
import PageDashboard from '../pages/dashboard.js'
import PageInventory from '../pages/inventory.js'
import PageSales from '../pages/sales.js'
import PagePayouts from '../pages/payouts.js'
import PageCustomers from '../pages/customers.js'
import PageAccounting from '../pages/accounting.js'

const PAGES = [
  { id: 'dashboard',  label: 'Dashboard',  Page: PageDashboard },
  { id: 'inventory',  label: 'Inventar',   Page: PageInventory },
  { id: 'sales',      label: 'Verkäufe',   Page: PageSales },
  { id: 'payouts',    label: 'Auszahlung', Page: PagePayouts },
  { id: 'customers',  label: 'Kunden',     Page: PageCustomers },
  { id: 'accounting', label: 'Buchhaltung',Page: PageAccounting },
]

let currentPage = 'dashboard'

export function renderLayout(root) {
  root.innerHTML = `
    <div class="app-shell">
      <header class="app-header">
        <span class="brand">Tand & Flitter</span>
        <nav class="nav-pills" id="main-nav" role="navigation" aria-label="Hauptnavigation">
          ${PAGES.map(p => `
            <button
              class="nav-pill${p.id === currentPage ? ' active' : ''}"
              data-page="${p.id}"
              aria-current="${p.id === currentPage ? 'page' : 'false'}"
            >${p.label}</button>
          `).join('')}
        </nav>
        <button class="btn-logout" id="btn-logout" aria-label="Abmelden">↩</button>
      </header>
      <main class="page-content" id="page-content"></main>
    </div>
  `

  document.getElementById('main-nav').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-page]')
    if (!btn) return
    navigateTo(btn.dataset.page)
  })

  document.getElementById('btn-logout').addEventListener('click', async () => {
    await signOut()
  })

  mountPage(currentPage)
}

function navigateTo(pageId) {
  currentPage = pageId

  document.querySelectorAll('.nav-pill').forEach(btn => {
    const active = btn.dataset.page === pageId
    btn.classList.toggle('active', active)
    btn.setAttribute('aria-current', active ? 'page' : 'false')
  })

  mountPage(pageId)
}

function mountPage(pageId) {
  const content = document.getElementById('page-content')
  if (!content) return

  content.innerHTML = ''
  const entry = PAGES.find(p => p.id === pageId)
  if (entry) entry.Page(content)
}
