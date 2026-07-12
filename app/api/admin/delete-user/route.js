import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Create a Supabase client with service role key for server-side admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Delete user's profile
    await supabaseAdmin.from('profiles').delete().eq('id', userId);
    
    // Delete user's photos
    await supabaseAdmin.from('photos').delete().eq('uploaded_by', userId);
    
    // Delete user from auth
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (error) {
      console.error('Delete user error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete user API exception:', err);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
