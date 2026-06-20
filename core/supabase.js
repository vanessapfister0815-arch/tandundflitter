// core/supabase.js — Supabase-Client + Query-Helfer

import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config.js'

// Supabase-Client (SDK via CDN als UMD geladen)
export const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

/**
 * Generischer Query-Wrapper mit einheitlichem Error-Handling.
 * Wirft bei Fehler — catch im aufrufenden Code.
 */
export async function sbQuery(fn) {
  const { data, error } = await fn(sb)
  if (error) throw error
  return data
}

/**
 * RPC-Wrapper. Immer STABLE-Funktionen.
 * @param {string} name — Funktionsname
 * @param {object} params — Parameter-Objekt
 */
export async function sbRpc(name, params = {}) {
  const { data, error } = await sb.rpc(name, params)
  if (error) throw error
  return data
}
