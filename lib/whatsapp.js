const WA_BASE = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

async function postMessage(payload) {
  const res = await fetch(WA_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ messaging_product: 'whatsapp', ...payload }),
  });
  return res.json();
}

export async function sendTextMessage(to, message) {
  return postMessage({ to, type: 'text', text: { body: message } });
}

export async function sendBirthdayReminder(phone, birthdayPerson) {
  const msg =
    `🎂 *Birthday Reminder!*\n\nToday is *${birthdayPerson}*'s birthday!\n` +
    `Don't forget to send your wishes 🎉\n\n— Mhalkari Family Portal`;
  return sendTextMessage(phone, msg);
}

export async function sendFestivalReminder(phone, festival, daysLeft) {
  const msg =
    `🎊 *Upcoming Festival!*\n\n*${festival}* is in *${daysLeft} day(s)*!\n` +
    `Get ready to celebrate 🙏\n\n— Mhalkari Family Portal`;
  return sendTextMessage(phone, msg);
}

export async function sendExpenseAlert(phone, title, amount, paidBy) {
  const msg =
    `💰 *New Expense Added*\n\n` +
    `*${title}* — ₹${amount}\nPaid by: ${paidBy}\n\n— Mhalkari Family Portal`;
  return sendTextMessage(phone, msg);
}

export async function sendPollNotification(phone, question) {
  const msg =
    `📊 *New Poll!*\n\n"${question}"\n\nCast your vote on the Mhalkari Family Portal!\n\n— Mhalkari Family`;
  return sendTextMessage(phone, msg);
}
