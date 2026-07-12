import { NextResponse } from 'next/server';
import { createRouteClient, createAdminClient } from '@/lib/supabaseServer';
import { sendTextMessage } from '@/lib/whatsapp';

export async function POST(request) {
  const supabase = createRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Check admin role
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { title, message, type = 'broadcast' } = await request.json();
  if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 });

  const adminClient = createAdminClient();

  // Fetch all profiles with phone numbers
  const { data: members } = await adminClient
    .from('profiles')
    .select('id, phone');

  // Insert notification records for all members
  const notifRecords = (members || []).map((m) => ({
    user_id: m.id,
    title,
    message,
    type,
    read: false,
  }));

  if (notifRecords.length > 0) {
    await adminClient.from('notifications').insert(notifRecords);
  }

  // Send WhatsApp messages if configured
  let whatsappSent = 0;
  if (process.env.WHATSAPP_ACCESS_TOKEN) {
    for (const m of members || []) {
      if (m.phone) {
        try {
          await sendTextMessage(m.phone, `*${title}*\n\n${message}\n\n— Mhalkari Family Portal`);
          whatsappSent++;
        } catch {}
      }
    }
  }

  return NextResponse.json({
    success: true,
    notified: notifRecords.length,
    whatsapp_sent: whatsappSent,
  });
}

export async function GET() {
  const supabase = createRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
