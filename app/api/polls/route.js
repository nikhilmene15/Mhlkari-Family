import { NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabaseServer';
import { sendPollNotification } from '@/lib/whatsapp';

export async function GET() {
  const supabase = createRouteClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: polls, error } = await supabase
    .from('polls')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const enriched = await Promise.all((polls || []).map(async (poll) => {
    const { data: votes } = await supabase
      .from('poll_votes')
      .select('option_index, user_id')
      .eq('poll_id', poll.id);

    const vote_counts = poll.options.map((_, i) =>
      (votes || []).filter((v) => v.option_index === i).length
    );
    const user_vote = user
      ? (votes || []).find((v) => v.user_id === user.id)?.option_index ?? null
      : null;

    return { ...poll, vote_counts, user_vote };
  }));

  return NextResponse.json(enriched);
}

export async function POST(request) {
  const supabase = createRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { data, error } = await supabase
    .from('polls')
    .insert({ ...body, created_by: user.id, is_active: true })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Notify via WhatsApp if env vars set
  if (process.env.WHATSAPP_ACCESS_TOKEN) {
    const { data: members } = await supabase.from('profiles').select('phone').not('phone', 'is', null);
    for (const m of members || []) {
      if (m.phone) {
        sendPollNotification(m.phone, body.question).catch(() => {});
      }
    }
  }

  return NextResponse.json(data, { status: 201 });
}
