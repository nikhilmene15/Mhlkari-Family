'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import ThemeToggle from './ThemeToggle';
import { getSupabaseClient } from '@/lib/supabase';
import '@/styles/navbar.css';
import {
  BsHouseFill, BsImages, BsCake2Fill, BsStarFill,
  BsCurrencyRupee, BsBarChartFill, BsQrCode,
  BsDiagram3Fill, BsShieldFill, BsBellFill,
  BsPersonCircle, BsBoxArrowRight, BsGearFill,
  BsChevronDown
} from 'react-icons/bs';

const NAV_ITEMS = [
  { label: 'Home', href: '/', icon: <BsHouseFill /> },
  {
    label: 'Gallery',
    icon: <BsImages />,
    children: [
      { label: 'Gallery', href: '/gallery', icon: <BsImages /> },
      { label: 'Albums', href: '/albums', icon: <BsImages /> },
    ],
  },
  {
    label: 'Events',
    icon: <BsCake2Fill />,
    children: [
      { label: 'Birthdays', href: '/birthdays', icon: <BsCake2Fill /> },
      { label: 'Festivals', href: '/festivals', icon: <BsStarFill /> },
    ],
  },
  {
    label: 'Finance',
    icon: <BsCurrencyRupee />,
    children: [
      { label: 'Expenses', href: '/expenses', icon: <BsCurrencyRupee /> },
      { label: 'Payments', href: '/payments', icon: <BsQrCode /> },
      { label: 'PRT Meetings', href: '/prt-meetings', icon: <BsBarChartFill /> },
    ],
  },
  {
    label: 'Connect',
    icon: <BsBarChartFill />,
    children: [
      { label: 'Polls', href: '/polls', icon: <BsBarChartFill /> },
      { label: 'Family Tree', href: '/family-tree', icon: <BsDiagram3Fill /> },
    ],
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = getSupabaseClient();
  
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const userMenuRef = useRef(null);
  const dropdownRefs = useRef({});

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) fetchProfile(user.id);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else { setProfile(null); setIsAdmin(false); }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, avatar_url, role')
      .eq('id', userId)
      .single();
    if (data) {
      setProfile(data);
      setIsAdmin(data.role === 'admin');
    }
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      
      // Handle dropdown click outside
      const clickedDropdown = Object.keys(dropdownRefs.current).find(key => 
        dropdownRefs.current[key]?.contains(e.target)
      );
      
      if (!clickedDropdown) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function handleSignOut() {
    // Check if in demo mode
    const demoMode = localStorage.getItem('demo-mode');
    if (demoMode === 'true') {
      localStorage.removeItem('demo-mode');
      localStorage.removeItem('demo-user');
      document.cookie = 'demo-mode=; path=/; max-age=0';
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
      router.push('/login');
      setUserMenuOpen(false);
      return;
    }

    await supabase.auth.signOut();
    router.push('/login');
    setUserMenuOpen(false);
  }

  const getInitials = (name) =>
    name ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

  return (
    <>
      <nav className={`navbar-main${scrolled ? ' scrolled' : ''}`}>
        <div className="navbar-inner">
          {/* Logo */}
          <Link href="/" className="navbar-logo">
            <div className="logo-icon">M</div>
            <div className="logo-text">
              <span className="logo-name">Mhalkari</span>
              <span className="logo-sub">Family Portal</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <ul className="navbar-nav-links">
            {NAV_ITEMS.map((item) =>
              item.children ? (
                <li key={item.label} className="nav-item-custom" ref={el => dropdownRefs.current[item.label] = el}>
                  <button 
                    className="nav-link-custom" 
                    style={{ cursor: 'pointer', background: 'none', border: 'none', color: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', padding: '10px 16px' }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setOpenDropdown(openDropdown === item.label ? null : item.label);
                    }}
                  >
                    {item.icon} {item.label} <BsChevronDown style={{ fontSize: '0.65rem' }} />
                  </button>
                  <div className={`nav-dropdown ${openDropdown === item.label ? 'show' : ''}`}>
                    {item.children.map((child) => (
                      <Link key={child.href} href={child.href} className="dropdown-link" onClick={() => setOpenDropdown(null)}>
                        {child.icon} {child.label}
                      </Link>
                    ))}
                  </div>
                </li>
              ) : (
                <li key={item.label} className="nav-item-custom">
                  <Link
                    href={item.href}
                    className={`nav-link-custom${pathname === item.href ? ' active' : ''}`}
                  >
                    {item.icon} {item.label}
                  </Link>
                </li>
              )
            )}
            {isAdmin && (
              <li className="nav-item-custom">
                <Link
                  href="/admin"
                  className={`nav-link-custom${pathname.startsWith('/admin') ? ' active' : ''}`}
                >
                  <BsShieldFill /> Admin
                </Link>
              </li>
            )}
          </ul>

          {/* Actions */}
          <div className="navbar-actions">
            <ThemeToggle />

            {user ? (
              <>
                <button className="notif-btn" title="Notifications">
                  <BsBellFill />
                  <span className="notif-dot" />
                </button>
                <div style={{ position: 'relative' }} ref={userMenuRef}>
                  <button
                    className="user-menu-btn"
                    onClick={() => setUserMenuOpen((v) => !v)}
                  >
                    {profile?.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt="avatar"
                        width={30}
                        height={30}
                        className="avatar avatar-sm"
                      />
                    ) : (
                      <div
                        style={{
                          width: 30, height: 30, borderRadius: '50%',
                          background: 'var(--gradient-primary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.7rem', fontWeight: 800, color: 'white',
                        }}
                      >
                        {getInitials(profile?.full_name || user.email)}
                      </div>
                    )}
                    <span className="user-name-short">
                      {profile?.full_name?.split(' ')[0] || 'User'}
                    </span>
                  </button>
                  {userMenuOpen && (
                    <div className="user-dropdown">
                      <Link href="/profile" className="dropdown-link" onClick={() => setUserMenuOpen(false)}>
                        <BsPersonCircle /> Profile
                      </Link>
                      <Link href="/profile?tab=settings" className="dropdown-link" onClick={() => setUserMenuOpen(false)}>
                        <BsGearFill /> Settings
                      </Link>
                      {isAdmin && (
                        <Link href="/admin" className="dropdown-link" onClick={() => setUserMenuOpen(false)}>
                          <BsShieldFill /> Admin Panel
                        </Link>
                      )}
                      <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid var(--border)' }} />
                      <button className="dropdown-link" style={{ width: '100%', cursor: 'pointer', background: 'none', border: 'none', color: 'var(--accent-red)' }} onClick={handleSignOut}>
                        <BsBoxArrowRight /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link href="/login" className="btn-primary-custom" style={{ padding: '9px 20px', fontSize: '0.85rem' }}>
                Sign In
              </Link>
            )}

            {/* Hamburger */}
            <button
              className={`hamburger${mobileOpen ? ' open' : ''}`}
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="mobile-menu">
          {NAV_ITEMS.map((item) =>
            item.children ? (
              item.children.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  className={`mobile-nav-link${pathname === child.href ? ' active' : ''}`}
                >
                  {child.icon} {child.label}
                </Link>
              ))
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={`mobile-nav-link${pathname === item.href ? ' active' : ''}`}
              >
                {item.icon} {item.label}
              </Link>
            )
          )}
          {isAdmin && (
            <Link href="/admin" className={`mobile-nav-link${pathname.startsWith('/admin') ? ' active' : ''}`}>
              <BsShieldFill /> Admin Panel
            </Link>
          )}
          <div style={{ marginTop: 'auto', paddingTop: 24, display: 'flex', gap: 12 }}>
            {user ? (
              <button
                className="btn-danger"
                style={{ flex: 1 }}
                onClick={handleSignOut}
              >
                <BsBoxArrowRight /> Sign Out
              </button>
            ) : (
              <Link href="/login" className="btn-primary-custom" style={{ flex: 1, justifyContent: 'center' }}>
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
