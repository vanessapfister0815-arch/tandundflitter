// core/auth.js — Session-Management

import { sb } from './supabase.js'

/**
 * Gibt die aktuelle Session zurück.
 * null = nicht eingeloggt, Objekt = eingeloggt.
 */
export async function getSession() {
  const { data } = await sb.auth.getSession()
  return data.session ?? null
}

/**
 * Registriert einen Listener für Auth-Änderungen.
 * Callback erhält die neue Session (null oder Objekt).
 */
export function onAuthChange(callback) {
  sb.auth.onAuthStateChange((_event, session) => {
    callback(session ?? null)
  })
}

/**
 * Login mit E-Mail + Passwort.
 * Wirft bei Fehler.
 */
export async function signIn(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data.session
}

/**
 * Logout.
 */
export async function signOut() {
  const { error } = await sb.auth.signOut()
  if (error) throw error
}
