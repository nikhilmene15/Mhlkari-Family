import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Create a Supabase client with service role key for server-side admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    // Get all expense assignments with user details
    const { data: assignments, error } = await supabaseAdmin
      .from('expense_assignments')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    // If we got assignments, fetch user details separately
    if (!error && assignments && assignments.length > 0) {
      const userIds = assignments.map(a => a.user_id);
      const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (!userError && users?.users) {
        console.log('Found users:', users.users.length);
        // Map user details to assignments
        assignments.forEach(assignment => {
          const user = users.users.find(u => u.id === assignment.user_id);
          assignment.user = user || null;
          console.log('Mapped assignment', assignment.user_id, 'to user:', user?.email || 'Not found');
        });
      } else {
        console.log('User fetch error:', userError);
      }
    }
    
    if (error) {
      console.error('Expense assignments API error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log('API returning assignments:', assignments?.length || 0);
    console.log('Sample assignment:', assignments?.[0]);
    
    return NextResponse.json({ assignments });
  } catch (err) {
    console.error('Expense assignments API exception:', err);
    return NextResponse.json({ error: 'Failed to fetch expense assignments' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { userId, assignedBy } = await request.json();
    
    console.log('POST request received:', { userId, assignedBy });
    
    if (!userId || !assignedBy) {
      return NextResponse.json({ error: 'User ID and assigned by are required' }, { status: 400 });
    }
    
    // Check if user is already assigned
    const { data: existing } = await supabaseAdmin
      .from('expense_assignments')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (existing) {
      console.log('User already assigned:', existing);
      return NextResponse.json({ error: 'User is already assigned to expense tracking' }, { status: 400 });
    }
    
    // Add assignment
    const { data, error } = await supabaseAdmin
      .from('expense_assignments')
      .insert({
        user_id: userId,
        assigned_by: assignedBy,
        is_active: true
      })
      .select()
      .single();
    
    if (error) {
      console.error('Add expense assignment error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log('Assignment created successfully:', data);
    return NextResponse.json({ success: true, assignment: data });
  } catch (err) {
    console.error('Add expense assignment API exception:', err);
    return NextResponse.json({ error: 'Failed to add expense assignment' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Remove assignment
    const { error } = await supabaseAdmin
      .from('expense_assignments')
      .delete()
      .eq('user_id', userId);
    
    if (error) {
      console.error('Remove expense assignment error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Remove expense assignment API exception:', err);
    return NextResponse.json({ error: 'Failed to remove expense assignment' }, { status: 500 });
  }
}
