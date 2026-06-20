// app.js — Auth-Gate + Router
// Drei Zustände: undefined (lädt), null (kein Login), Objekt (eingeloggt)

import { getSession, onAuthChange } from './core/auth.js'
import PageLogin from './pages/login.js'
import { renderLayout } from './components/layout.js'

const root = document.getElementById('app')

function renderLoader() {
  root.innerHTML = `
    <div class="loader-wrap">
      <div class="loader-dot"></div>
    </div>
  `
}

async function init() {
  renderLoader()

  const session = await getSession()
  handleSessionState(session)

  onAuthChange((session) => {
    handleSessionState(session)
  })
}

function handleSessionState(session) {
  if (session === undefined) {
    renderLoader()
    return
  }

  if (!session) {
    root.innerHTML = ''
    PageLogin(root)
    return
  }

  root.innerHTML = ''
  renderLayout(root)
}

init()
