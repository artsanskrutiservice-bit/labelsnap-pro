import React from 'react';
import { 
  Mail, 
  ChevronRight, 
  ExternalLink, 
  ShieldCheck,
  Sparkles,
  Layers
} from 'lucide-react';

export default function Footer({ darkMode = false, setPlatform, setActiveView }) {
  const handleMarketplaceClick = (platformId) => {
    if (setActiveView) setActiveView('studio');
    if (setPlatform) setPlatform(platformId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToolClick = (toolId) => {
    if (setActiveView) setActiveView(toolId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="about" className={`border-t pt-14 pb-8 px-6 text-xs transition-colors ${
      darkMode ? 'bg-[#070b12] border-slate-800/90 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
    }`}>
      <div className={`max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-12 border-b ${
        darkMode ? 'border-slate-800/60' : 'border-slate-200'
      }`}>
        
        {/* Column 1: Brand & Contact */}
        <div className="flex flex-col gap-3 lg:col-span-2">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              LabelSnap Pro
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20">
              v2.0
            </span>
          </div>
          <p className="text-xs leading-relaxed max-w-sm">
            High-speed, 100% private client-side e-commerce shipping label cropper ane free all-in-one PDF utilities platform. Tamara files kyarey server par store thata nathi.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <Mail size={14} className="text-red-500 shrink-0" />
            <a 
              href="mailto:dhruvusadadiya321@gmail.com" 
              className={`hover:text-red-500 transition truncate ${darkMode ? 'text-slate-300' : 'text-slate-700 font-medium'}`}
            >
              dhruvusadadiya321@gmail.com
            </a>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Surat, Gujarat, India</p>
        </div>

        {/* Column 2: Free PDF Tools */}
        <div className="flex flex-col gap-3">
          <h4 className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
            Free PDF Tools
          </h4>
          <ul className="flex flex-col gap-2">
            <li>
              <button 
                onClick={() => handleToolClick('merge')} 
                className="hover:text-red-500 transition flex items-center gap-1.5 text-left"
              >
                <ChevronRight size={12} /> Merge PDF
              </button>
            </li>
            <li>
              <button 
                onClick={() => handleToolClick('split')} 
                className="hover:text-amber-500 transition flex items-center gap-1.5 text-left"
              >
                <ChevronRight size={12} /> Split PDF
              </button>
            </li>
            <li>
              <button 
                onClick={() => handleToolClick('crop')} 
                className="hover:text-emerald-500 transition flex items-center gap-1.5 text-left"
              >
                <ChevronRight size={12} /> Selected Crop
              </button>
            </li>
            <li>
              <button 
                onClick={() => handleToolClick('rotate')} 
                className="hover:text-blue-500 transition flex items-center gap-1.5 text-left"
              >
                <ChevronRight size={12} /> Rotate Pages
              </button>
            </li>
            <li>
              <button 
                onClick={() => handleToolClick('editor')} 
                className="hover:text-sky-500 transition flex items-center gap-1.5 text-left"
              >
                <ChevronRight size={12} /> PDF Editor &amp; Sign
              </button>
            </li>
            <li>
              <button 
                onClick={() => handleToolClick('multi-pipeline')} 
                className="hover:text-pink-500 transition flex items-center gap-1.5 text-left"
              >
                <ChevronRight size={12} /> Multi-Tool Studio
              </button>
            </li>
          </ul>
        </div>

        {/* Column 3: Label Crop Marketplaces */}
        <div className="flex flex-col gap-3">
          <h4 className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
            Label Studio
          </h4>
          <ul className="flex flex-col gap-2">
            <li>
              <button 
                onClick={() => handleMarketplaceClick('flipkart')} 
                className="hover:text-blue-500 transition flex items-center gap-1.5 text-left"
              >
                <ChevronRight size={12} /> Flipkart Smart Crop
              </button>
            </li>
            <li>
              <button 
                onClick={() => handleMarketplaceClick('meesho')} 
                className="hover:text-pink-500 transition flex items-center gap-1.5 text-left"
              >
                <ChevronRight size={12} /> Meesho Thermal Crop
              </button>
            </li>
            <li>
              <button 
                onClick={() => handleMarketplaceClick('amazon')} 
                className="hover:text-amber-500 transition flex items-center gap-1.5 text-left"
              >
                <ChevronRight size={12} /> Amazon Easy Ship (2-Page)
              </button>
            </li>
            <li className="text-slate-400 flex items-center gap-1.5 text-[11px] pt-1">
              <ChevronRight size={12} /> Glowroad &amp; Snapdeal (Soon)
            </li>
          </ul>
        </div>

        {/* Column 4: System & Security */}
        <div className="flex flex-col gap-3">
          <h4 className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
            Security &amp; Legal
          </h4>
          <ul className="flex flex-col gap-2">
            <li>
              <a href="#about" className="hover:text-blue-500 transition flex items-center gap-1.5">
                <ChevronRight size={12} /> About Tool
              </a>
            </li>
            <li>
              <a href="#features" className="hover:text-blue-500 transition flex items-center gap-1.5">
                <ChevronRight size={12} /> Features
              </a>
            </li>
            <li>
              <span className="text-[11px] text-emerald-500 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg inline-block w-fit mt-1">
                System: Operational
              </span>
            </li>
            <li className="pt-1 text-[11px] text-slate-400 leading-relaxed">
              100% Client-Side WebAssembly execution.
            </li>
          </ul>
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