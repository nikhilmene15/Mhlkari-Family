import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseServer';
import { sendBirthdayReminder, sendFestivalReminder } from '@/lib/whatsapp';
import { differenceInDays, parseISO, setYear, isSameDay } from 'date-fns';

// This route should be called by a cron job (e.g., Vercel Cron) daily
// GET /api/reminders?secret=YOUR_CRON_SECRET

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  let birthdaySent = 0, festivalSent = 0;

  // Birthday reminders
  const { data: members } = await supabase
    .from('family_members')
    .select('name, birth_date, phone')
    .not('birth_date', 'is', null)
    .not('phone', 'is', null);

  const { data: profilesWithPhone } = await supabase
    .from('profiles')
    .select('phone')
    .not('phone', 'is', null);

  const allPhones = (profilesWithPhone || []).map((p) => p.phone);

  for (const m of members || []) {
    const today = new Date();
    const bd = parseISO(m.birth_date);
    const thisYearBd = setYear(bd, today.getFullYear());

    if (isSameDay(thisYearBd, today)) {
      for (const phone of allPhones) {
        try {
          await sendBirthdayReminder(phone, m.name);
          birthdaySent++;
        } catch {}
      }
    }
  }

  // Festival reminders (3 days before)
  const { data: festivals } = await supabase
    .from('festivals')
    .select('name, date');

  for (const f of festivals || []) {
    const daysLeft = differenceInDays(parseISO(f.date), new Date());
    if (daysLeft === 3 || daysLeft === 1) {
      for (const phone of allPhones) {
        try {
          await sendFestivalReminder(phone, f.name, daysLeft);
          festivalSent++;
        } catch {}
      }
    }
  }

  return NextResponse.json({
    success: true,
    birthday_reminders: birthdaySent,
    festival_reminders: festivalSent,
  });
}
