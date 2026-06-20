// pages/login.js — Login-Seite

import { signIn } from '../core/auth.js'

export default function PageLogin(root) {
  root.innerHTML = `
    <div class="login-wrap">
      <div class="login-card">
        <h1 class="brand login-brand">Tand & Flitter</h1>
        <div class="login-form">
          <div class="field-group">
            <label class="field-label" for="email">E-Mail</label>
            <input
              class="input"
              type="email"
              id="email"
              autocomplete="email"
              placeholder="mail@beispiel.de"
            />
          </div>
          <div class="field-group">
            <label class="field-label" for="password">Passwort</label>
            <input
              class="input"
              type="password"
              id="password"
              autocomplete="current-password"
              placeholder="••••••••"
            />
          </div>
          <div id="login-error" class="login-error" hidden></div>
          <button class="btn-primary" id="btn-login">Anmelden</button>
        </div>
      </div>
    </div>
  `

  const emailEl    = root.querySelector('#email')
  const passwordEl = root.querySelector('#password')
  const errorEl    = root.querySelector('#login-error')
  const btnLogin   = root.querySelector('#btn-login')

  async function handleLogin() {
    errorEl.hidden = true
    btnLogin.disabled = true
    btnLogin.textContent = '…'

    try {
      await signIn(emailEl.value.trim(), passwordEl.value)
    } catch (err) {
      errorEl.textContent = err.message ?? 'Anmeldung fehlgeschlagen'
      errorEl.hidden = false
    } finally {
      btnLogin.disabled = false
      btnLogin.textContent = 'Anmelden'
    }
  }

  btnLogin.addEventListener('click', handleLogin)

  passwordEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin()
  })
}
