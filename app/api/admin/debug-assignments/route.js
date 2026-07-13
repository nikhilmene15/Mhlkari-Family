import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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
