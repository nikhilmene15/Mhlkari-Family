import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Create a Supabase client with service role key for server-side admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    // Return a simple response to prevent build issues
    return NextResponse.json({ 
      message: 'Debug API temporarily disabled for deployment',
      status: 'disabled'
    });
  } catch (err) {
    return NextResponse.json({ 
      error: 'Debug API disabled',
      message: 'This endpoint is temporarily disabled for deployment'
    }, { status: 503 });
  }
}
