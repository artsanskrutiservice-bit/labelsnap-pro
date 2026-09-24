import React from 'react';
import { 
  Infinity as InfinityIcon, 
  Zap, 
  Lock, 
  Download, 
  Users, 
  Wrench 
} from 'lucide-react';

export default function FeaturesSection({ darkMode }) {
  const features = [
    {
      icon: <InfinityIcon size={28} />,
      title: 'Unlimited',
      desc: 'Crop multiple pages of shipping label PDFs effortlessly without limits. Enjoy seamless batch processing anytime.',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20'
    },
    {
      icon: <Zap size={28} />,
      title: 'Fast',
      desc: 'Harness high-speed client rendering that significantly reduces time. Fast and precise label customization.',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20'
    },
    {
      icon: <Lock size={28} />,
      title: 'Security',
      desc: 'All processing happens locally in your browser sandbox. Your customer details and invoices are never sent to external servers.',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20'
    },
    {
      icon: <Download size={28} />,
      title: 'Download',
      desc: 'Crop multiple pages of shipping labels simultaneously. Seamlessly crop, split, and save high-resolution PDFs.',
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20'
    },
    {
      icon: <Users size={28} />,
      title: 'User Friendly',
      desc: 'Simple and intuitive workflow for all sellers. No complex setup or technical steps required to process orders.',
      color: 'text-pink-400',
      bg: 'bg-pink-500/10',
      border: 'border-pink-500/20'
    },
    {
      icon: <Wrench size={28} />,
      title: 'Powerful Tool',
      desc: 'Direct browser execution on any device. Packed with SKU extraction, thermal darkening, and pick-list manifest tools.',
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20'
    }
  ];

  return (
    <section id="features" className={`py-16 px-6 border-t transition-colors ${
      darkMode ? 'bg-[#0a0e17] border-slate-800/80' : 'bg-slate-100/70 border-slate-200'
    }`}>
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        
        {/* Section Heading */}
        <div className="text-center max-w-2xl mb-12">
          <h2 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">Capabilities</h2>
          <h3 className="text-2xl sm:text-3xl font-black tracking-tight">FEATURES</h3>
          <p className={`text-xs mt-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Streamline your order dispatch workflow with browser-native high-performance label cropping tools.
          </p>
        </div>

        {/* 6 Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {features.map((item, index) => (
            <div 
              key={index}
              className={`p-6 rounded-2xl border flex flex-col items-center text-center gap-3 transition-all duration-200 hover:-translate-y-1 ${
                darkMode ? 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className={`p-3.5 rounded-2xl ${item.bg} ${item.color} border ${item.border}`}>
                {item.icon}
              </div>
              <h4 className="text-base font-bold tracking-tight">{item.title}</h4>
              <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}