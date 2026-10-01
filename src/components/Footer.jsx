import React, { useState } from 'react';
import { 
  Mail, 
  ArrowRight, 
  ShieldCheck,
  Sparkles,
  Heart,
  Circle
} from 'lucide-react';
import LegalModal from './LegalModal';

export default function Footer({ darkMode = false, setPlatform, setActiveView }) {
  const [legalModal, setLegalModal] = useState({ isOpen: false, tab: 'privacy' });

  const handleMarketplaceClick = (platformId) => {
    if (setActiveView) setActiveView('studio');
    if (setPlatform) setPlatform(platformId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToolClick = (toolId) => {
    if (setActiveView) setActiveView(toolId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openLegalModal = (tab) => {
    setLegalModal({ isOpen: true, tab });
  };

  // ─── Social Media Icons Config (only Email) ───────────────
  const socials = [
    { 
      icon: Mail, 
      href: 'mailto:dhruvusadadiya321@gmail.com', 
      label: 'Email',
      hover: 'hover:bg-rose-500 hover:border-rose-500 hover:shadow-lg hover:shadow-rose-500/30'
    },
  ];

  // ─── Label Studios ────────────────────────────────────────
  const marketLinks = [
    { id: 'flipkart', label: 'Flipkart Smart Crop', color: 'group-hover:text-blue-500' },
    { id: 'meesho', label: 'Meesho Thermal Crop', color: 'group-hover:text-pink-500' },
    { id: 'amazon', label: 'Amazon Easy Ship', color: 'group-hover:text-amber-500' },
  ];

  // ─── PDF Tools ────────────────────────────────────────────
  const toolLinks = [
    { id: 'merge', label: 'Merge PDF', color: 'group-hover:text-red-500' },
    { id: 'split', label: 'Split PDF', color: 'group-hover:text-amber-500' },
    { id: 'crop', label: 'Selected Crop', color: 'group-hover:text-emerald-500' },
    { id: 'rotate', label: 'Rotate PDF', color: 'group-hover:text-blue-500' },
    { id: 'editor', label: 'PDF Editor & Sign', color: 'group-hover:text-sky-500' },
    { id: 'multi-pipeline', label: 'Multi-Tool Studio', color: 'group-hover:text-pink-500' },
  ];

  return (
    <>
      <footer className={`relative border-t overflow-hidden transition-colors duration-300 ${
        darkMode 
          ? 'bg-[#060a14] border-white/[0.06] text-slate-400' 
          : 'bg-slate-50 border-slate-200/80 text-slate-600'
      }`}>
        
        {/* Top gradient accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent"></div>

        {/* Ambient background glows */}
        <div className={`footer-ambient absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none ${
          darkMode ? 'bg-indigo-500/[0.08]' : 'bg-indigo-400/[0.08]'
        }`}></div>
        <div className={`footer-ambient absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none ${
          darkMode ? 'bg-purple-500/[0.06]' : 'bg-purple-400/[0.06]'
        }`} style={{ animationDelay: '3s' }}></div>

        <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-8">
          
          {/* ═══════════════ MAIN 4-COLUMN GRID ═══════════════ */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12">
            
            {/* ─── COLUMN 1: BRAND & CONTACT (4 cols wide) ─── */}
            <div className="lg:col-span-4 flex flex-col gap-5 fade-in-up">
              
              {/* Logo & Brand */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className={`absolute inset-0 rounded-xl blur-lg opacity-40 ${
                    darkMode ? 'bg-indigo-500/30' : 'bg-indigo-400/20'
                  }`}></div>
                  <img 
                    src="/logo.png" 
                    alt="MyPDFClub Logo" 
                    className="relative h-9 w-auto object-contain" 
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-base font-black tracking-tight logo-shimmer ${
                    darkMode ? 'logo-shimmer-dark' : 'logo-shimmer-light'
                  }`}>
                    MyPDFClub
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                    darkMode 
                      ? 'bg-blue-500/10 text-blue-300 border-blue-500/25' 
                      : 'bg-blue-50 text-blue-600 border-blue-200/70'
                  }`}>
                    v2.0
                  </span>
                </div>
              </div>

              {/* Intro */}
              <p className={`text-[12.5px] leading-relaxed max-w-md ${
                darkMode ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Smart e-commerce label cropper &amp; PDF suite. 100% client-side processing — your files never leave your browser.
              </p>

              {/* Trust Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-md border flex items-center gap-1 ${
                  darkMode 
                    ? 'bg-emerald-500/[0.08] text-emerald-400 border-emerald-500/20' 
                    : 'bg-emerald-50 text-emerald-600 border-emerald-200/60'
                }`}>
                  <ShieldCheck size={10} />
                  Zero Storage
                </span>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-md border flex items-center gap-1 ${
                  darkMode 
                    ? 'bg-indigo-500/[0.08] text-indigo-400 border-indigo-500/20' 
                    : 'bg-indigo-50 text-indigo-600 border-indigo-200/60'
                }`}>
                  <Sparkles size={10} />
                  100% Free
                </span>
              </div>

              {/* Contact (only Mail icon) */}
              <div className="flex items-center gap-2.5 pt-1">
                {socials.map((s, idx) => {
                  const Icon = s.icon;
                  return (
                    <a
                      key={idx}
                      href={s.href}
                      aria-label={s.label}
                      className={`social-icon p-2.5 rounded-xl border ${
                        darkMode 
                          ? 'bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-white' 
                          : 'bg-white border-slate-200 text-slate-500 hover:text-white'
                      } ${s.hover}`}
                    >
                      <Icon size={15} />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* ─── COLUMN 2: LABEL STUDIOS (2 cols wide) ─── */}
            <div className="lg:col-span-2 flex flex-col gap-4 fade-in-up" style={{ animationDelay: '80ms' }}>
              <h4 className={`text-[10px] font-black uppercase tracking-[0.12em] ${
                darkMode ? 'text-slate-200' : 'text-slate-900'
              }`}>
                Label Studios
              </h4>
              <ul className="flex flex-col gap-3">
                {marketLinks.map((link) => (
                  <li key={link.id}>
                    <button 
                      onClick={() => handleMarketplaceClick(link.id)} 
                      className={`footer-link group flex items-center gap-1.5 text-[12px] font-medium transition-colors duration-200 ${
                        darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                      } ${link.color}`}
                    >
                      <ArrowRight 
                        size={12} 
                        className="footer-link-arrow opacity-0 -translate-x-1 shrink-0" 
                      />
                      <span className="group-hover:translate-x-0.5">
                        {link.label}
                      </span>
                    </button>
                  </li>
                ))}
                <li className="pt-1">
                  <span className={`flex items-center gap-1.5 text-[11px] font-medium ${
                    darkMode ? 'text-slate-600' : 'text-slate-400'
                  }`}>
                    <Circle size={5} className="fill-current" />
                    Glowroad, Snapdeal (Soon)
                  </span>
                </li>
              </ul>
            </div>

            {/* ─── COLUMN 3: PDF TOOLS (3 cols wide) ─── */}
            <div className="lg:col-span-3 flex flex-col gap-4 fade-in-up" style={{ animationDelay: '160ms' }}>
              <h4 className={`text-[10px] font-black uppercase tracking-[0.12em] ${
                darkMode ? 'text-slate-200' : 'text-slate-900'
              }`}>
                Free PDF Tools
              </h4>
              <ul className="flex flex-col gap-3">
                {toolLinks.map((link) => (
                  <li key={link.id}>
                    <button 
                      onClick={() => handleToolClick(link.id)} 
                      className={`footer-link group flex items-center gap-1.5 text-[12px] font-medium transition-colors duration-200 ${
                        darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                      } ${link.color}`}
                    >
                      <ArrowRight 
                        size={12} 
                        className="footer-link-arrow opacity-0 -translate-x-1 shrink-0" 
                      />
                      <span className="group-hover:translate-x-0.5">
                        {link.label}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* ─── COLUMN 4: LEGAL & SUPPORT (3 cols wide) ─── */}
            <div className="lg:col-span-3 flex flex-col gap-4 fade-in-up" style={{ animationDelay: '240ms' }}>
              <h4 className={`text-[10px] font-black uppercase tracking-[0.12em] ${
                darkMode ? 'text-slate-200' : 'text-slate-900'
              }`}>
                Security &amp; Legal
              </h4>
              <ul className="flex flex-col gap-3">
                <li>
                  <button 
                    onClick={() => openLegalModal('privacy')} 
                    className={`footer-link group flex items-center gap-1.5 text-[12px] font-medium transition-colors duration-200 ${
                      darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    } group-hover:text-indigo-500`}
                  >
                    <ArrowRight 
                      size={12} 
                      className="footer-link-arrow opacity-0 -translate-x-1 shrink-0" 
                    />
                    <span className="group-hover:translate-x-0.5">
                      Privacy Policy
                    </span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => openLegalModal('terms')} 
                    className={`footer-link group flex items-center gap-1.5 text-[12px] font-medium transition-colors duration-200 ${
                      darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    } group-hover:text-indigo-500`}
                  >
                    <ArrowRight 
                      size={12} 
                      className="footer-link-arrow opacity-0 -translate-x-1 shrink-0" 
                    />
                    <span className="group-hover:translate-x-0.5">
                      Terms &amp; Conditions
                    </span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => openLegalModal('contact')} 
                    className={`footer-link group flex items-center gap-1.5 text-[12px] font-medium transition-colors duration-200 ${
                      darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    } group-hover:text-indigo-500`}
                  >
                    <ArrowRight 
                      size={12} 
                      className="footer-link-arrow opacity-0 -translate-x-1 shrink-0" 
                    />
                    <span className="group-hover:translate-x-0.5">
                      Contact Support
                    </span>
                  </button>
                </li>
              </ul>

              {/* System Status Pill */}
              <div className="pt-2">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                  darkMode 
                    ? 'bg-emerald-500/[0.06] border-emerald-500/20' 
                    : 'bg-emerald-50 border-emerald-200/60'
                }`}>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 status-dot"></span>
                  </span>
                  <span className={`text-[10px] font-bold tracking-wide ${
                    darkMode ? 'text-emerald-400' : 'text-emerald-600'
                  }`}>
                    All Systems Operational
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════ BOTTOM BAR ═══════════════ */}
          <div className={`pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${
            darkMode ? 'border-white/[0.06]' : 'border-slate-200/80'
          }`}>
            
            {/* Left: Copyright */}
            <p className={`text-[11px] font-medium ${
              darkMode ? 'text-slate-500' : 'text-slate-500'
            }`}>
              © 2026 <span className={`font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>MyPDFClub</span>. All rights reserved.
            </p>

            {/* Right: Made in India + Status */}
            <div className="flex items-center gap-4">
              <p className={`text-[11px] font-medium flex items-center gap-1.5 ${
                darkMode ? 'text-slate-500' : 'text-slate-500'
              }`}>
                Made with 
                <Heart 
                  size={11} 
                  className="text-rose-500 fill-rose-500 heart-beat" 
                /> 
                in India
              </p>
              
              <div className={`w-px h-3 ${
                darkMode ? 'bg-white/[0.08]' : 'bg-slate-300'
              }`}></div>
              
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span className={`text-[11px] font-semibold ${
                  darkMode ? 'text-emerald-400' : 'text-emerald-600'
                }`}>
                  Operational
                </span>
              </div>
            </div>
          </div>

        </div>
      </footer>

      {/* Legal Modal */}
      <LegalModal 
        isOpen={legalModal.isOpen} 
        onClose={() => setLegalModal({ ...legalModal, isOpen: false })} 
        initialTab={legalModal.tab}
        darkMode={darkMode}
      />
    </>
  );
}