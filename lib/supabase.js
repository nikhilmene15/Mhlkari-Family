import { createBrowserClient } from '@supabase/ssr';

let clientInstance = null;
let adminClientInstance = null;

export function getSupabaseClient() {
  if (!clientInstance) {
    clientInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }
  return clientInstance;
}

export function getSupabaseAdminClient() {
  if (!adminClientInstance) {
    console.log('Creating admin client with:', {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
    });
    
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set in environment variables');
    }
    
    adminClientInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return adminClientInstance;
}
