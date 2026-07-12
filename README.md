# 🏠 Mhalkari Family Portal

A modern, full-featured private family website built with **Next.js 14**, **Supabase**, and **Bootstrap 5**.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📸 Photo Gallery | Upload, browse & manage family photos with albums |
| 🎂 Birthday Reminders | Track birthdays + auto WhatsApp wishes |
| 🎊 Festival Countdown | Live timers for festivals & custom events |
| 💰 Expense Tracker | Log, split & visualise family expenses |
| 📊 Polls & Voting | Create polls and vote as a family |
| 💳 QR Payments | UPI QR codes for collections & contributions |
| 🌳 Family Tree | Interactive multi-generation family tree |
| 🛡️ Admin Panel | Manage members, moderate content, send notifications |

---

## 🛠 Tech Stack

| Part | Technology |
|------|-----------|
| Frontend | Next.js 14 (App Router) |
| Styling | Bootstrap 5 + Custom CSS Variables |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Notifications | WhatsApp Business Cloud API |
| Hosting | Vercel |
| Charts | Chart.js + react-chartjs-2 |

---

## 🚀 Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.local.example .env.local
```
Fill in your values:
- `NEXT_PUBLIC_SUPABASE_URL` — from Supabase project settings
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Supabase project settings
- `SUPABASE_SERVICE_ROLE_KEY` — from Supabase project settings (secret)
- `WHATSAPP_ACCESS_TOKEN` — WhatsApp Business Cloud API token
- `WHATSAPP_PHONE_NUMBER_ID` — from Meta Developer Console
- `CRON_SECRET` — any random string (for /api/reminders cron protection)

### 3. Set up Supabase database
1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase/schema.sql`
3. Go to **Storage** and create a bucket named `family-media` (set to **public**)

### 4. Run development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

---

## 🗂 Project Structure

```
mhalkari_family/
├── app/                    # Next.js App Router pages & API routes
│   ├── page.js             # Home page
│   ├── layout.js           # Root layout
│   ├── login/              # Auth page
│   ├── gallery/            # Photo gallery
│   ├── birthdays/          # Birthday tracker
│   ├── festivals/          # Festival countdown
│   ├── expenses/           # Expense tracker
│   ├── polls/              # Polls & voting
│   ├── payments/           # QR payments
│   ├── family-tree/        # Family tree
│   ├── admin/              # Admin panel
│   └── api/                # API routes
├── components/
│   ├── layout/             # Navbar, Footer, ThemeToggle
│   ├── ui/                 # Shared UI: StatsCard, PageHeader, etc.
│   ├── gallery/            # PhotoModal
│   ├── birthdays/          # BirthdayCard
│   ├── festivals/          # CountdownTimer
│   ├── expenses/           # ExpenseChart
│   ├── polls/              # PollCard
│   └── family-tree/        # FamilyTreeView
├── context/
│   └── ThemeContext.js     # Dark/light mode context
├── lib/
│   ├── supabase.js         # Client-side Supabase
│   ├── supabaseServer.js   # Server-side Supabase
│   └── whatsapp.js         # WhatsApp API helpers
├── styles/                 # Per-feature CSS files
│   ├── globals.css         # CSS variables, base styles
│   ├── navbar.css
│   ├── home.css
│   ├── gallery.css
│   ├── birthdays.css
│   ├── festivals.css
│   ├── expenses.css
│   ├── polls.css
│   ├── payments.css
│   ├── family-tree.css
│   ├── admin.css
│   └── auth.css
├── supabase/
│   └── schema.sql          # Full DB schema + RLS policies
├── middleware.js            # Auth route protection
├── next.config.js
└── .env.local.example
```

---

## 🌙 Dark / Light Mode
- Defaults to **dark mode**
- Toggle via the sun/moon button in the navbar
- Preference saved to `localStorage`
- Theme applied via `data-theme` attribute on `<html>`

---

## 🔔 Birthday & Festival Reminders (Cron)
Set up a daily cron job to call:
```
GET /api/reminders?secret=YOUR_CRON_SECRET
```
With **Vercel Cron**, add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/reminders?secret=YOUR_CRON_SECRET",
      "schedule": "0 8 * * *"
    }
  ]
}
```

---

## 👑 First Admin Setup
After signing up, manually set `role = 'admin'` for your account in the Supabase dashboard:
```sql
UPDATE profiles SET role = 'admin' WHERE id = 'your-user-uuid';
```

---

## 📦 Deployment
```bash
# Deploy to Vercel
npx vercel
```
Make sure to add all environment variables in the Vercel project settings.

---

## 📱 WhatsApp Business API
1. Create an app at [Meta Developer Console](https://developers.facebook.com)
2. Add WhatsApp product
3. Get your `Phone Number ID` and `Access Token`
4. Add phone numbers in `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` in `.env.local`

---

*Built with ❤️ for the Mhalkari family*
