import React from 'react';
import { 
  Mail, 
  ChevronRight, 
  ExternalLink, 
  ShieldCheck 
} from 'lucide-react';

export default function Footer({ darkMode, setPlatform }) {
  const handleMarketplaceClick = (platformId) => {
    setPlatform(platformId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="about" className={`border-t pt-14 pb-8 px-6 text-xs transition-colors ${
      darkMode ? 'bg-[#070b12] border-slate-800/90 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
    }`}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800/60">
        
        {/* Column 1: Contact Us */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Contact Us</h4>
          <p className="text-xs leading-relaxed">
            Have suggestions or feedback? Excited about new marketplace features? We’d love to hear from you!
          </p>
          <div className="flex items-center gap-2 pt-1 text-slate-300">
            <Mail size={14} className="text-blue-400 shrink-0" />
            <a href="mailto:dhruvusadadiya321@gmail.com" className="hover:text-blue-400 transition truncate">
              dhruvusadadiya321@gmail.com
            </a>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Surat, Gujarat, India</p>
        </div>

        {/* Column 2: Company & Legal */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Company &amp; Legal</h4>
          <ul className="flex flex-col gap-2">
            <li>
              <a href="#about" className="hover:text-blue-400 transition flex items-center gap-1.5">
                <ChevronRight size={12} /> About Tool
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-blue-400 transition flex items-center gap-1.5">
                <ChevronRight size={12} /> Privacy Policy
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-blue-400 transition flex items-center gap-1.5">
                <ChevronRight size={12} /> Terms &amp; Conditions
              </a>
            </li>
            <li>
              <a href="#features" className="hover:text-blue-400 transition flex items-center gap-1.5">
                <ChevronRight size={12} /> Feature Roadmap
              </a>
            </li>
          </ul>
        </div>

        {/* Column 3: Supported Marketplaces */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Supported Marketplaces</h4>
          <ul className="flex flex-col gap-2">
            <li>
              <button 
                onClick={() => handleMarketplaceClick('amazon')} 
                className="hover:text-amber-400 transition flex items-center gap-1.5 text-left"
              >
                <ChevronRight size={12} /> Amazon Easy Ship (2-Page)
              </button>
            </li>
            <li>
              <button 
                onClick={() => handleMarketplaceClick('flipkart')} 
                className="hover:text-blue-400 transition flex items-center gap-1.5 text-left"
              >
                <ChevronRight size={12} /> Flipkart Smart Crop
              </button>
            </li>
            <li>
              <button 
                onClick={() => handleMarketplaceClick('meesho')} 
                className="hover:text-pink-400 transition flex items-center gap-1.5 text-left"
              >
                <ChevronRight size={12} /> Meesho Thermal Crop
              </button>
            </li>
            <li className="text-slate-500 flex items-center gap-1.5">
              <ChevronRight size={12} /> Glowroad &amp; Snapdeal (Coming Soon)
            </li>
          </ul>
        </div>

        {/* Column 4: Brand & Ecosystem */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">LabelSnap Ecosystem</h4>
          <p className="text-xs leading-relaxed">
            Built for high-volume e-commerce sellers, dispatch hubs, and 3PL fulfillment centers.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noreferrer" 
              className="p-2 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white transition"
              title="GitHub"
            >
              <ExternalLink size={14} />
            </a>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">
              System Status: Operational
            </span>
          </div>
        </div>

      </div>

      {/* Bottom Copyright Strip */}
      <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
        <p>© 2026 LabelSnap Pro. All Rights Reserved.</p>
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Encrypted in-browser execution. Zero external data storage.</span>
        </div>
      </div>
    </footer>
  );
}