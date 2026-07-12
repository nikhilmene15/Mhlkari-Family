import { NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabaseServer';

export async function DELETE(request, { params }) {
  const supabase = createRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: expense } = await supabase.from('expenses').select('paid_by').eq('id', params.id).single();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

  if (expense?.paid_by !== user.id && profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error } = await supabase.from('expenses').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
