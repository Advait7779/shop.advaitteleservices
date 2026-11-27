import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';
import { companyName } from '../../utils/branding';
import StorefrontViews from './StorefrontViews';

const Footer = () => {
  return (
    <footer className="bg-[#293d54] text-white border-t border-brand-900">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="" className="w-11 h-11 shrink-0 rounded-lg bg-white p-0.5 object-contain shadow" />
              <span className="text-lg font-bold tracking-tight text-white sm:text-xl">{companyName}</span>
            </div>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-brand-700/60 pb-2">Quick Links</h4>
            <ul className="space-y-2 text-xs">
              {[
                { to: '/', label: 'Home' },
                { to: '/about', label: 'About Us' },
                { to: '/shop', label: 'Shop GPS Trackers' },
                { to: '/cart', label: 'My Cart' },
                { to: '/account', label: 'My Account' },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-brand-300 hover:text-white transition-colors duration-200 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-600"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4 space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-brand-700/60 pb-2">Head Office</h4>
            <div className="space-y-3 text-xs text-brand-200">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
                <span>Office No.522, 5th Floor, Amanora Chambers, Amanora Town Centre East Block, Pune 411028.</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-brand-500 shrink-0" />
                <a href="tel:08282982829" className="hover:text-white transition-colors duration-200 font-medium">082829 82829</a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-brand-500 shrink-0" />
                <a href="mailto:sales@advaitteleservices.com" className="hover:text-white transition-colors duration-200">sales@advaitteleservices.com</a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-brand-400 sm:flex-row">
          <p className="text-center sm:text-left">© {new Date().getFullYear()} {companyName} All rights reserved.</p>
          <StorefrontViews />
          <div className="flex items-center gap-4 text-[11px]">
            <span>Secured by Razorpay</span>
            <span>•</span>
            <Link to="/admin/login" className="hover:text-brand-300 transition-colors">Admin Portal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
