'use client';

import Link from 'next/link';
import '@/styles/home.css';
import {
  BsImages, BsCake2Fill, BsStarFill, BsCurrencyRupee,
  BsBarChartFill, BsQrCode, BsDiagram3Fill, BsShieldFill,
  BsArrowRight, BsPeopleFill, BsCalendarHeartFill,
  BsHouseFill, BsWhatsapp
} from 'react-icons/bs';
import CardSlider from '@/components/CardSlider';

const FEATURES = [
  {
    icon: <BsImages />,
    title: 'Photo Gallery',
    desc: 'Beautiful photos shared by family members. Upload and cherish memories together.',
    href: '/gallery',
    gradient: 'var(--gradient-primary)',
    badge: 'cyan',
  },
  {
    icon: <BsCake2Fill />,
    title: 'Birthday Reminders',
    desc: 'Never miss a family birthday. Get timely reminders and celebrate together.',
    href: '/birthdays',
    gradient: 'var(--gradient-pink)',
    badge: 'pink',
  },
  {
    icon: <BsStarFill />,
    title: 'Festival Tracker',
    desc: 'Track Diwali, Holi, Christmas and more. Plan celebrations as a family.',
    href: '/festivals',
    gradient: 'var(--gradient-primary)',
    badge: 'purple',
  },
  {
    icon: <BsCurrencyRupee />,
    title: 'Expense Tracker',
    desc: 'Split bills and track family expenses. Transparent and fair for everyone.',
    href: '/expenses',
    gradient: 'var(--gradient-amber)',
    badge: 'amber',
  },
  {
    icon: <BsBarChartFill />,
    title: 'Family Polls',
    desc: 'Vote on decisions together. From dinner plans to vacation destinations.',
    href: '/polls',
    gradient: 'var(--gradient-green)',
    badge: 'green',
  },
  {
    icon: <BsQrCode />,
    title: 'Quick Payments',
    desc: 'UPI and QR code payments between family members. Simple and secure.',
    href: '/payments',
    gradient: 'var(--gradient-primary)',
    badge: 'purple',
  },
  {
    icon: <BsDiagram3Fill />,
    title: 'Family Tree',
    desc: 'Explore your lineage and connect with relatives across generations.',
    href: '/family-tree',
    gradient: 'var(--gradient-primary)',
    badge: 'purple',
  },
];

// Data for slider - will be populated with translations in component
const SLIDER_FEATURES = [
  { icon: <BsImages />, title: 'Photo Gallery', desc: 'Beautiful photos shared by family members. Upload and cherish memories together.', href: '/gallery', gradient: 'var(--gradient-primary)' },
  { icon: <BsCake2Fill />, title: 'Birthday Reminders', desc: 'Never miss a family birthday. Get timely reminders and celebrate together.', href: '/birthdays', gradient: 'var(--gradient-pink)' },
  { icon: <BsStarFill />, title: 'Festival Tracker', desc: 'Track Diwali, Holi, Christmas and more. Plan celebrations as a family.', href: '/festivals', gradient: 'var(--gradient-primary)' },
  { icon: <BsCurrencyRupee />, title: 'Expense Tracker', desc: 'Split bills and track family expenses. Transparent and fair for everyone.', href: '/expenses', gradient: 'var(--gradient-amber)' },
  { icon: <BsBarChartFill />, title: 'Family Polls', desc: 'Vote on decisions together. From dinner plans to vacation destinations.', href: '/polls', gradient: 'var(--gradient-green)' },
  { icon: <BsQrCode />, title: 'Quick Payments', desc: 'UPI and QR code payments between family members. Simple and secure.', href: '/payments', gradient: 'var(--gradient-primary)' },
  { icon: <BsDiagram3Fill />, title: 'Family Tree', desc: 'Explore your lineage and connect with relatives across generations.', href: '/family-tree', gradient: 'var(--gradient-primary)' },
];

const HERO_CARDS = [
  {
    icon: <BsCake2Fill />,
    iconBg: 'var(--gradient-pink)',
    title: 'Upcoming Birthday',
    value: '3 days',
    sub: 'Ramesh Uncle turns 60',
  },
  {
    icon: <BsStarFill />,
    iconBg: 'var(--gradient-primary)',
    title: 'Next Festival',
    value: 'Diwali',
    sub: 'Countdown started',
  },
  {
    icon: <BsPeopleFill />,
    iconBg: 'var(--gradient-green)',
    title: 'Family Members',
    value: '24',
    sub: 'Active this month',
  },
];

export default function HomePage() {

  return (
    <>
      {/* ===== HERO ===== */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-grid" />
          <div className="hero-blob hero-blob-1" />
          <div className="hero-blob hero-blob-2" />
          <div className="hero-blob hero-blob-3" />
        </div>
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-7">
              <div className="hero-content">
                <div className="hero-badge">
                  <span className="hero-badge-dot" />
                  Welcome to our family
                </div>
                <h1 className="hero-title">
                  The Complete <span className="hero-family-name">Mhalkari Family</span>
                </h1>
                <p className="hero-subtitle">
                  Connect, celebrate, and cherish every moment together.
                </p>
                <div className="hero-actions">
                  <Link href="/gallery" className="btn-primary-custom">
                  Explore <BsArrowRight />
                  </Link>
                  <Link href="/family-tree" className="btn-secondary-custom">
                  <BsDiagram3Fill /> Family Tree
                  </Link>
                </div>
                <div className="hero-stats">
                  {[
                    { num: '24+', label: 'Members' },
                    { num: '500+', label: 'Photos' },
                    { num: '12+', label: 'Years' },
                    { num: '∞', label: 'Memories' },
                  ].map((stat) => (
                    <div key={stat.label} className="hero-stat">
                      <span className="hero-stat-num gradient-text">{stat.num}</span>
                      <span className="hero-stat-label">{stat.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="col-lg-5 d-none d-lg-flex justify-content-center">
              <div className="hero-card-stack">
                {HERO_CARDS.map((card, i) => (
                  <div key={i} className="hero-card-item">
                    <div className="hero-card-icon" style={{ background: card.iconBg }}>
                      <div style={{ color: 'white' }}>{card.icon}</div>
                    </div>
                    <div className="hero-card-title">{card.title}</div>
                    <div className="hero-card-value gradient-text">{card.value}</div>
                    <div className="hero-card-sub">{card.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES SLIDER ===== */}
      <section className="features-section">
        <div className="container">
          <div className="row ">
            <div className="col-lg-8 text-center mx-auto">
              <div className="section-label">Everything in one place</div>
              <h2 className="section-title">
                Built for the <span className="gradient-text">whole family</span>
              </h2>
              <p className="section-desc" style={{ margin: '0 auto 40px' }}>
                Eight powerful features — beautifully designed, mobile-friendly and
                backed by real-time data so everyone stays in the loop.
              </p>
            </div>
          </div>
          <CardSlider items={SLIDER_FEATURES} />
        </div>
      </section>

      {/* ===== QUICK STATS STRIP ===== */}
      <section className='testimonial-section'>
        <div className="container">
          <div className="row g-4 text-center">
            {[
              { icon: <BsPeopleFill />, value: '24', label: 'Members', color: 'var(--accent-purple)' },
              { icon: <BsImages />, value: '500+', label: 'Photos', color: 'var(--accent-cyan)' },
              { icon: <BsCake2Fill />, value: '8', label: 'Birthdays this year', color: 'var(--accent-pink)' },
              { icon: <BsCalendarHeartFill />, value: '6', label: 'Festivals tracked', color: 'var(--accent-amber)' },
              { icon: <BsWhatsapp />, value: '100+', label: 'Notifications sent', color: 'var(--accent-green)' },
            ].map((s) => (
              <div key={s.label} className="col">
                <div className="testimonial-stat-item">
                  <div className="stat-icon" style={{ color: s.color }}>{s.icon}</div>
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="cta-section">
        <div className="cta-bg" />
        <div className="container position-relative">
          <div className="badge-custom badge-purple mb-4" style={{ margin: '0 auto 20px', display: 'inline-flex' }}>
            Get Started
          </div>
          <h2 className="cta-title">
            Join the <span className="gradient-text">Mhalkari</span> portal today
          </h2>
          <p className="cta-sub">
            Request access from the family admin and start connecting with your loved ones.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login" className="btn-primary-custom">
              Sign In <BsArrowRight />
            </Link>
            <Link href="/gallery" className="btn-secondary-custom">
              Browse Gallery
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
