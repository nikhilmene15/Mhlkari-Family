'use client';

import Link from 'next/link';
import '@/styles/footer.css';
import {
  BsInstagram, BsWhatsapp, BsHeart,
  BsImages, BsCake2Fill, BsStarFill,
  BsCurrencyRupee, BsBarChartFill, BsDiagram3Fill
} from 'react-icons/bs';

const FOOTER_LINKS = [
  { label: 'Gallery', href: '/gallery', icon: <BsImages /> },
  { label: 'Birthdays', href: '/birthdays', icon: <BsCake2Fill /> },
  { label: 'Festivals', href: '/festivals', icon: <BsStarFill /> },
  { label: 'Expenses', href: '/expenses', icon: <BsCurrencyRupee /> },
  { label: 'Polls', href: '/polls', icon: <BsBarChartFill /> },
  { label: 'Family Tree', href: '/family-tree', icon: <BsDiagram3Fill /> },
];

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer>
      <div className="container">
        <div className="row align-items-start g-4 mb-4">
          {/* Brand */}
          <div className="col-lg-4">
            <div className="footer-brand">
              <div className="footer-logo">M</div>
              <div>
                <div className="footer-brand-name">
                  Mhalkari
                </div>
                <div className="footer-brand-sub">
                  Family Portal
                </div>
              </div>
            </div>
            <p className="footer-description">
              Our stories, our bonds, our legacy. Connecting the Mhalkari family across distances.
            </p>
            <div className="footer-social">
              <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" className="footer-social-link">
                <BsWhatsapp />
              </a>
              <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer" className="footer-social-link instagram">
                <BsInstagram />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-lg-4 col-6">
            <p className="footer-section-title">
              Quick Links
            </p>
            <div className="footer-links">
              {FOOTER_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="footer-link"
                >
                  <span className="footer-link-icon">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="col-lg-4 col-6">
            <p className="footer-section-title">
              About
            </p>
            <div className="footer-links">
              {[
                { label: 'Privacy Policy', href: '#' },
                { label: 'Terms of Use', href: '#' },
                { label: 'Contact Admin', href: '#' },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="footer-link"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <hr />

        <div className="footer-bottom">
          <p>
            © {year} Mhalkari Family Portal. All rights reserved.
          </p>
          <p>
            Made with <BsHeart className="footer-heart" /> for the Mhalkari family
          </p>
        </div>
      </div>
    </footer>
  );
}
