import { NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabaseServer';

export async function POST(request, { params }) {
  const supabase = createRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { option_index } = await request.json();

  // Check poll exists and is active
  const { data: poll } = await supabase
    .from('polls')
    .select('is_active, expires_at, options')
    .eq('id', params.id)
    .single();

  if (!poll) return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
  if (!poll.is_active) return NextResponse.json({ error: 'Poll is closed' }, { status: 400 });
  if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Poll has expired' }, { status: 400 });
  }
  if (option_index < 0 || option_index >= poll.options.length) {
    return NextResponse.json({ error: 'Invalid option' }, { status: 400 });
  }

  // Check already voted
  const { data: existing } = await supabase
    .from('poll_votes')
    .select('id')
    .eq('poll_id', params.id)
    .eq('user_id', user.id)
    .single();

  if (existing) return NextResponse.json({ error: 'Already voted' }, { status: 409 });

  const { data, error } = await supabase
    .from('poll_votes')
    .insert({ poll_id: params.id, user_id: user.id, option_index })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
