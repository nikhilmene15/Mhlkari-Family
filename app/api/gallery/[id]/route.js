import { NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabaseServer';

export async function DELETE(request, { params }) {
  const supabase = createRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: photo } = await supabase.from('photos').select('uploaded_by').eq('id', params.id).single();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

  if (photo?.uploaded_by !== user.id && profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error } = await supabase.from('photos').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
