// core/supabase.js — Supabase-Client + Query-Helfer

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config.js'

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export async function sbQuery(fn) {
  const { data, error } = await fn(sb)
  if (error) throw error
  return data
}

export async function sbRpc(name, params = {}) {
  const { data, error } = await sb.rpc(name, params)
  if (error) throw error
  return data
}
