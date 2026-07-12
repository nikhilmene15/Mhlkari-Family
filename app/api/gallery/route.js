import { NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabaseServer';

export async function GET(request) {
  const supabase = createRouteClient();
  const { searchParams } = new URL(request.url);
  const albumId = searchParams.get('album_id');

  let query = supabase
    .from('photos')
    .select('*, profiles:uploaded_by(full_name, avatar_url)')
    .order('created_at', { ascending: false });

  if (albumId) query = query.eq('album_id', albumId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request) {
  const supabase = createRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { data, error } = await supabase
    .from('photos')
    .insert({ ...body, uploaded_by: user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
