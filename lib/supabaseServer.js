import { createServerClient as createSSRServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

function buildCookieHandler() {
  const cookieStore = cookies();
  return {
    get(name) {
      return cookieStore.get(name)?.value;
    },
    set(name, value, options) {
      try { cookieStore.set({ name, value, ...options }); } catch {}
    },
    remove(name, options) {
      try { cookieStore.set({ name, value: '', ...options }); } catch {}
    },
  };
}

export function createServerClient() {
  return createSSRServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: buildCookieHandler() }
  );
}

export function createRouteClient() {
  return createSSRServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: buildCookieHandler() }
  );
}

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
