import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Debug environment variables
    console.log('Environment check:', {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET',
      serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
    });

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is missing from environment variables');
      return NextResponse.json({ 
        error: 'Service role key not configured on server',
        debug: {
          urlSet: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          serviceKeySet: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          nodeEnv: process.env.NODE_ENV
        }
      }, { status: 500 });
    }

    // Create a Supabase client with service role key for server-side admin operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      console.error('Admin users API error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log('Successfully fetched users:', users?.length || 0);
    return NextResponse.json({ users });
  } catch (err) {
    console.error('Admin users API exception:', err);
    return NextResponse.json({ error: 'Failed to fetch users', details: err.message }, { status: 500 });
  }
}
