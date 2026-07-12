import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Create a Supabase client with service role key for server-side admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    console.log('Debug: Checking all expense assignments...');
    
    // Get all expense assignments
    const { data: assignments, error } = await supabaseAdmin
      .from('expense_assignments')
      .select(`
        *,
        user:auth.users(id, email, user_metadata)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Debug assignments error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log('Debug: Found assignments:', assignments?.length || 0);
    
    // Get all users for comparison
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    console.log('Debug: Total users in system:', users?.users?.length || 0);
    
    return NextResponse.json({ 
      assignments: assignments || [],
      totalUsers: users?.users?.length || 0,
      debugInfo: {
        hasAssignments: (assignments?.length || 0) > 0,
        sampleAssignment: assignments?.[0],
        sampleUsers: users?.users?.slice(0, 3)
      }
    });
  } catch (err) {
    console.error('Debug assignments exception:', err);
    return NextResponse.json({ error: 'Failed to debug assignments' }, { status: 500 });
  }
}
