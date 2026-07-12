import { NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabaseServer';
import { differenceInDays, setYear, parseISO, isSameDay } from 'date-fns';

function daysUntilBirthday(dateStr) {
  const today = new Date();
  const bd = parseISO(dateStr);
  let next = setYear(bd, today.getFullYear());
  if (next < today) next = setYear(bd, today.getFullYear() + 1);
  return isSameDay(next, today) ? 0 : differenceInDays(next, today);
}

export async function GET() {
  const supabase = createRouteClient();
  const { data, error } = await supabase
    .from('family_members')
    .select('*')
    .not('birth_date', 'is', null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const enriched = (data || [])
    .map((m) => ({ ...m, days_until: daysUntilBirthday(m.birth_date) }))
    .sort((a, b) => a.days_until - b.days_until);

  return NextResponse.json(enriched);
}

export async function POST(request) {
  const supabase = createRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { data, error } = await supabase
    .from('family_members')
    .insert(body)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
