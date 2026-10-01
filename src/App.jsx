import React, { useState, useEffect } from 'react';
import { useAuthPresence } from './utils/useAuthPresence';

// Layout Components
import AdminPanel from './components/AdminPanel';
import Header from './components/Header';
import FeaturesSection from './components/FeaturesSection';
import Footer from './components/Footer';

// PDF Tools Components
import MergePdfTool from './components/pdf-tools/MergePdfTool';
import SplitPdfTool from './components/pdf-tools/SplitPdfTool';
import CustomCropTool from './components/pdf-tools/CustomCropTool';
import RotatePdfTool from './components/pdf-tools/RotatePdfTool';
import RemovePagesTool from './components/pdf-tools/RemovePagesTool';
import PageNumberTool from './components/pdf-tools/PageNumberTool';
import MultiPipelineTool from './components/pdf-tools/MultiPipelineTool';
import PdfEditorStudio from './components/pdf-tools/editor/PdfEditorStudio';
import ImageToPdfTool from './components/pdf-tools/ImageToPdfTool';
import PdfToImageTool from './components/pdf-tools/PdfToImageTool';

// Marketplace Studios
import FlipkartStudio from './components/FlipkartStudio';
import MeeshoStudio from './components/MeeshoStudio';
import AmazonStudio from './components/AmazonStudio';

import { Sparkles, Zap, Shield } from 'lucide-react';

export default function App() {
  const [platform, setPlatform] = useState('flipkart');
  const [darkMode, setDarkMode] = useState(false);
  const [showAdminView, setShowAdminView] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // SEO URL Routing
  const viewToPath = {
    studio: '/',
    merge: '/merge-pdf',
    split: '/split-pdf',
    crop: '/crop-pdf',
    rotate: '/rotate-pdf',
    remove: '/remove-pages',
    'page-number': '/page-number',
    editor: '/pdf-editor',
    'multi-pipeline': '/multi-pipeline',
    'image-to-pdf': '/image-to-pdf',
    'pdf-to-image': '/pdf-to-image',
    admin: '/admin'
  };

  const pathToView = Object.fromEntries(Object.entries(viewToPath).map(([v, p]) => [p, v]));

  const [activeView, setActiveView] = useState(() => {
    const path = window.location.pathname;
    return pathToView[path] || 'studio';
  });

  // ─── Page title + URL sync ────────────────────────────────
  useEffect(() => {
    const titles = {
      studio: "Marketplace Label Cropper - MyPDFClub",
      merge: "Merge PDF Files Online Free - MyPDFClub",
      split: "Split PDF Pages Online - MyPDFClub",
      crop: "Custom & Visual PDF Cropper - MyPDFClub",
      rotate: "Rotate PDF Pages - MyPDFClub",
      remove: "Remove PDF Pages - MyPDFClub",
      'page-number': "Add Page Numbers to PDF - MyPDFClub",
      editor: "Interactive PDF Editor & Signature - MyPDFClub",
      'multi-pipeline': "All-in-One PDF Multi Studio - MyPDFClub",
      'image-to-pdf': "Convert Image to PDF - MyPDFClub",
      'pdf-to-image': "Extract PDF to Image - MyPDFClub",
      admin: "System Administration - MyPDFClub"
    };

    document.title = titles[activeView] || "MyPDFClub - Free Online PDF Tools & Shipping Label Cropper";
    const targetPath = viewToPath[activeView] || '/';
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  }, [activeView]);

  // ─── Browser back/forward ─────────────────────────────────
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      setActiveView(pathToView[path] || 'studio');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // ─── GA4 tracking ─────────────────────────────────────────
  useEffect(() => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_title: activeView,
        page_location: window.location.href,
        page_path: '/' + activeView
      });
    }
  }, [activeView]);

  // ─── Scroll progress bar ──────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
      setScrollProgress(scrolled);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { 
    currentUser, isPro, isAdmin, activeUsersCount, guestCount,
    registeredOnlineCount, loginWithGoogle, logout 
  } = useAuthPresence();

  const platforms = [
    { id: 'flipkart', name: 'Flipkart', desc: 'Precision Thermal 4x6 / Single Page crop', activeBg: 'bg-blue-600' },
    { id: 'meesho', name: 'Meesho', desc: 'Crop with 2mm margin + SKU & Size injection', activeBg: 'bg-pink-600' },
    { id: 'amazon', name: 'Amazon', desc: 'Dynamic 2-page invoice pairing & SKU extraction', activeBg: 'bg-amber-600' },
  ];

  const activePlatform = platforms.find((p) => p.id === platform);
  const returnToStudio = () => { setActiveView('studio'); setShowAdminView(false); };

  // ─── Ad Spot Component ────────────────────────────────────
  const AdSpot = ({ height = 'h-20', className = '' }) => (
    <div 
      className={`ad-box ${height} w-full ${className} ${
        darkMode ? 'border-slate-800 bg-slate-950/20' : 'border-slate-200 bg-slate-50/40'
      }`}
      data-ad-slot="adsense"
    >
      {/* AdSense code paste here */}
    </div>
  );

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 relative overflow-x-hidden ${
      darkMode ? 'bg-[#0b0f19] text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>

      {/* ═══════════ SCROLL PROGRESS BAR ═══════════ */}
      <div 
        className="progress-bar-top" 
        style={{ width: `${scrollProgress}%` }}
      />

      {/* ═══════════ AMBIENT BACKGROUND GLOWS ═══════════ */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className={`ambient-glow-1 absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-[120px] ${
          darkMode ? 'bg-indigo-600/[0.08]' : 'bg-indigo-400/[0.10]'
        }`}></div>
        <div className={`ambient-glow-2 absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full blur-[140px] ${
          darkMode ? 'bg-purple-600/[0.06]' : 'bg-purple-400/[0.08]'
        }`}></div>
        <div className={`ambient-glow-1 absolute bottom-0 left-1/3 w-[450px] h-[450px] rounded-full blur-[130px] ${
          darkMode ? 'bg-pink-600/[0.05]' : 'bg-pink-400/[0.06]'
        }`} style={{ animationDelay: '6s' }}></div>
      </div>

      {/* ═══════════ HEADER ═══════════ */}
      <div className="relative z-30">
        <Header 
          platform={platform} setPlatform={setPlatform} platforms={platforms}
          activePlatform={activePlatform} darkMode={darkMode} setDarkMode={setDarkMode}
          currentUser={currentUser} isAdmin={isAdmin} isPro={isPro}
          loginWithGoogle={loginWithGoogle} logout={logout}
          showAdminView={showAdminView} setShowAdminView={setShowAdminView}
          activeView={activeView} setActiveView={setActiveView}
        />
      </div>

      {/* ═══════════ MAIN CONTENT ═══════════ */}
      <main className="relative z-10 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-4 flex-1">

        {/* ─── AD SPOT 1: Top Leaderboard (above content) ─── */}
        {!showAdminView && activeView === 'studio' && (
          <AdSpot height="h-16" className="main-fade-in" />
        )}

        {showAdminView && isAdmin ? (
          <div className="w-full flex flex-col gap-4 admin-slide-in">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">System Administration</h2>
              <button 
                onClick={returnToStudio} 
                className="text-xs font-semibold text-blue-500 hover:text-blue-600 hover:underline transition flex items-center gap-1"
              >
                ← Return to Label Studio
              </button>
            </div>
            <AdminPanel activeCount={activeUsersCount} guestCount={guestCount} registeredOnlineCount={registeredOnlineCount} />
          </div>
        ) : activeView === 'merge' ? (
          <div className="studio-switch"><MergePdfTool darkMode={darkMode} onBack={returnToStudio} /></div>
        ) : activeView === 'split' ? (
          <div className="studio-switch"><SplitPdfTool darkMode={darkMode} onBack={returnToStudio} /></div>
        ) : activeView === 'crop' ? (
          <div className="studio-switch"><CustomCropTool darkMode={darkMode} onBack={returnToStudio} /></div>
        ) : activeView === 'rotate' ? (
          <div className="studio-switch"><RotatePdfTool darkMode={darkMode} onBack={returnToStudio} /></div>
        ) : activeView === 'remove' ? (
          <div className="studio-switch"><RemovePagesTool darkMode={darkMode} onBack={returnToStudio} /></div>
        ) : activeView === 'page-number' ? (
          <div className="studio-switch"><PageNumberTool darkMode={darkMode} onBack={returnToStudio} /></div>
        ) : activeView === 'editor' ? (
          <div className="studio-switch"><PdfEditorStudio darkMode={darkMode} onBack={returnToStudio} /></div>
        ) : activeView === 'multi-pipeline' ? (
          <div className="studio-switch"><MultiPipelineTool darkMode={darkMode} onBack={returnToStudio} /></div>
        ) : activeView === 'image-to-pdf' ? (
          <div className="studio-switch"><ImageToPdfTool darkMode={darkMode} onBack={returnToStudio} /></div>
        ) : activeView === 'pdf-to-image' ? (
          <div className="studio-switch"><PdfToImageTool darkMode={darkMode} onBack={returnToStudio} /></div>
        ) : (
          /* ─── DEFAULT: Label Studio ─── */
          <>
            {/* ─── Premium Info Bar ─── */}
            <div className={`relative flex items-center justify-between px-4 py-3 rounded-2xl border text-xs shadow-sm overflow-hidden info-bar-glow main-fade-in ${
              darkMode 
                ? 'bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-slate-900/80 border-slate-800 text-slate-300' 
                : 'bg-gradient-to-r from-white via-indigo-50/30 to-white border-slate-200 text-slate-600'
            }`}>
              {/* Animated shine sweep */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent -translate-x-full animate-[shimmerSlide_3s_ease-in-out_infinite] pointer-events-none"></div>
              
              <div className="flex items-center gap-2 relative">
                <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
                  <Sparkles size={13} className="text-amber-500 sparkle-rotate" strokeWidth={2.5} />
                </div>
                <span>
                  <b className={darkMode ? 'text-white' : 'text-slate-800'}>{activePlatform.name}:</b>{' '}
                  <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>{activePlatform.desc}</span>
                </span>
              </div>

              <div className="hidden sm:flex items-center gap-4 relative">
                <span className={`text-[11px] flex items-center gap-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  <kbd className={`px-1.5 py-0.5 rounded border text-[10px] font-mono ${
                    darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'
                  }`}>Ctrl+U</kbd>
                  Upload
                </span>
                <span className={`text-[11px] flex items-center gap-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  <kbd className={`px-1.5 py-0.5 rounded border text-[10px] font-mono ${
                    darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'
                  }`}>Ctrl+Enter</kbd>
                  Crop
                </span>
                <span className={`text-[11px] font-semibold flex items-center gap-1.5 ${
                  darkMode ? 'text-emerald-400' : 'text-emerald-600'
                }`}>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  100% Client-Side
                </span>
              </div>
            </div>

            {/* ─── Studio Component (switch based on platform) ─── */}
            <div className="studio-switch" key={platform}>
              {platform === 'flipkart' && <FlipkartStudio darkMode={darkMode} />}
              {platform === 'meesho' && <MeeshoStudio darkMode={darkMode} />}
              {platform === 'amazon' && <AmazonStudio darkMode={darkMode} />}
            </div>
          </>
        )}

      </main>

      {/* ═══════════ FEATURES SECTION ═══════════ */}
      <div className="relative z-10">
        <FeaturesSection darkMode={darkMode} />
      </div>

      {/* ═══════════ FOOTER ═══════════ */}
      <div className="relative z-10">
        <Footer darkMode={darkMode} setPlatform={setPlatform} setActiveView={setActiveView} />
      </div>

    </div>
  );
}