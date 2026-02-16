"use client";

import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');

        .footer-brand {
          font-family: 'Outfit', sans-serif;
          font-weight: 800;
          letter-spacing: -0.025em;
        }

        .footer-accent {
          background: linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .footer-link {
          transition: all 0.3s ease;
        }

        .footer-link:hover {
          color: #0EA5E9;
          transform: translateX(2px);
        }

        .footer-divider {
          background: linear-gradient(90deg, transparent, rgba(0,0,0,0.05), transparent);
        }
      `}</style>

      {/* DESKTOP FOOTER */}
      <footer className="hidden md:block bg-gradient-to-b from-white via-gray-50 to-white border-t border-gray-200/40 backdrop-blur-md">
        <div className="px-8 py-16">
          {/* Main Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
            {/* Brand Column */}
            <div className="col-span-1">
              <div className="flex flex-col gap-3 mb-6">
                <div className="footer-brand text-2xl leading-none">
                  <span className="text-black">legit.</span>
                  <span className="footer-accent">discount</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  AI-verified deals and community-validated savings. Real discounts, no dead codes.
                </p>
              </div>
            </div>

            {/* Deals Column */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Deals</h3>
              <ul className="space-y-3">
                <li><Link href="/" className="text-sm text-gray-600 footer-link hover:text-blue-600">Daily Hits</Link></li>
                <li><Link href="/" className="text-sm text-gray-600 footer-link hover:text-blue-600">Trending Now</Link></li>
                <li><Link href="/" className="text-sm text-gray-600 footer-link hover:text-blue-600">Best Sellers</Link></li>
                <li><Link href="/" className="text-sm text-gray-600 footer-link hover:text-blue-600">Expiring Soon</Link></li>
              </ul>
            </div>

            {/* Categories Column */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Categories</h3>
              <ul className="space-y-3">
                <li><Link href="/" className="text-sm text-gray-600 footer-link hover:text-blue-600">Fashion</Link></li>
                <li><Link href="/" className="text-sm text-gray-600 footer-link hover:text-blue-600">Electronics</Link></li>
                <li><Link href="/" className="text-sm text-gray-600 footer-link hover:text-blue-600">Home & Garden</Link></li>
                <li><Link href="/" className="text-sm text-gray-600 footer-link hover:text-blue-600">Beauty & Health</Link></li>
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Company</h3>
              <ul className="space-y-3">
                <li><Link href="/" className="text-sm text-gray-600 footer-link hover:text-blue-600">About</Link></li>
                <li><Link href="/" className="text-sm text-gray-600 footer-link hover:text-blue-600">Submit Deal</Link></li>
                <li><Link href="/" className="text-sm text-gray-600 footer-link hover:text-blue-600">Blog</Link></li>
                <li><Link href="/" className="text-sm text-gray-600 footer-link hover:text-blue-600">Contact</Link></li>
              </ul>
            </div>

            {/* Legal Column */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Legal</h3>
              <ul className="space-y-3">
                <li><Link href="/privacy" className="text-sm text-gray-600 footer-link hover:text-blue-600">Privacy</Link></li>
                <li><Link href="/terms" className="text-sm text-gray-600 footer-link hover:text-blue-600">Terms</Link></li>
                <li><Link href="/" className="text-sm text-gray-600 footer-link hover:text-blue-600">Cookies</Link></li>
                <li><Link href="/" className="text-sm text-gray-600 footer-link hover:text-blue-600">Disclaimer</Link></li>
              </ul>
            </div>
          </div>

          {/* Footer Divider */}
          <div className="footer-divider h-px my-8"></div>

          {/* Bottom Section */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              <p>&copy; {currentYear} Legit.Discount. All rights reserved. | Made with <span className="text-blue-500">✓</span></p>
            </div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-blue-600 transition-colors">Status</a>
              <a href="#" className="hover:text-blue-600 transition-colors">API</a>
              <a href="#" className="hover:text-blue-600 transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>

      {/* MOBILE FOOTER */}
      <footer className="md:hidden bg-gradient-to-b from-white via-gray-50 to-white border-t border-gray-200/40">
        <div className="px-4 py-6">
          {/* Brand */}
          <div className="mb-6">
            <div className="footer-brand text-xl leading-none mb-3">
              <span className="text-black">legit.</span>
              <span className="footer-accent">discount</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              AI-verified deals and community-validated savings.
            </p>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-bold text-gray-900 mb-3 text-xs uppercase tracking-wider">Browse</h3>
              <ul className="space-y-2">
                <li><Link href="/" className="text-xs text-gray-600 footer-link">Daily Hits</Link></li>
                <li><Link href="/" className="text-xs text-gray-600 footer-link">Trending</Link></li>
                <li><Link href="/" className="text-xs text-gray-600 footer-link">Categories</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-3 text-xs uppercase tracking-wider">Company</h3>
              <ul className="space-y-2">
                <li><Link href="/" className="text-xs text-gray-600 footer-link">About</Link></li>
                <li><Link href="/privacy" className="text-xs text-gray-600 footer-link">Privacy</Link></li>
                <li><Link href="/terms" className="text-xs text-gray-600 footer-link">Terms</Link></li>
              </ul>
            </div>
          </div>

          {/* Footer Divider */}
          <div className="footer-divider h-px my-6"></div>

          {/* Bottom */}
          <div className="text-center text-xs text-gray-600">
            <p>&copy; {currentYear} Legit.Discount | Made with <span className="text-blue-500">✓</span></p>
          </div>
        </div>
      </footer>
    </>
  );
}
