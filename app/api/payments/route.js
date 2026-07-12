import { NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabaseServer';

export async function GET() {
  const supabase = createRouteClient();
  const { data, error } = await supabase
    .from('payments')
    .select('*, creator:created_by(full_name)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request) {
  const supabase = createRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const qrData = `upi://pay?pa=${body.upi_id}&am=${body.amount}&tn=${encodeURIComponent(body.title)}`;

  const { data, error } = await supabase
    .from('payments')
    .insert({
      ...body,
      qr_data: qrData,
      status: 'pending',
      paid_by: [],
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
