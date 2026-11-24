import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#293d54] text-white border-t border-brand-900">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Advait Teleservices" className="w-11 h-11 rounded-lg bg-white p-0.5 object-contain shadow" />
              <div>
                <span className="text-xl font-bold tracking-tight text-white">ADVAIT TELESERVICES</span>
                <p className="text-xs text-brand-400 font-semibold">Private Limited</p>
              </div>
            </div>
            <p className="text-xs text-brand-200 leading-relaxed max-w-sm">
              Advait Teleservices Private Limited delivers commercial-grade GPS telematics, AIS-140 RTO-approved tracking, and capacitive fuel sensors backed by our Amanora Chambers, Pune engineering team.
            </p>
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
                { to: '/quote', label: 'Get a Quote' },
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

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-brand-400 gap-4">
          <p>© {new Date().getFullYear()} Advait Teleservices Private Limited. All rights reserved.</p>
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
