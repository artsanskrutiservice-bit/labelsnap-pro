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

// Marketplace Studios (આપણા 3 નવા નાના અને ચોખ્ખા કમ્પોનન્ટ્સ)
import FlipkartStudio from './components/FlipkartStudio';
import MeeshoStudio from './components/MeeshoStudio';
import AmazonStudio from './components/AmazonStudio';

import { Sparkles } from 'lucide-react';

export default function App() {
  const [platform, setPlatform] = useState('flipkart');
  const [darkMode, setDarkMode] = useState(false);
  const [showAdminView, setShowAdminView] = useState(false);

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

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      setActiveView(pathToView[path] || 'studio');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_title: activeView,
        page_location: window.location.href,
        page_path: '/' + activeView
      });
    }
  }, [activeView]);

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

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      darkMode ? 'bg-[#0b0f19] text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      
      <Header 
        platform={platform} setPlatform={setPlatform} platforms={platforms}
        activePlatform={activePlatform} darkMode={darkMode} setDarkMode={setDarkMode}
        currentUser={currentUser} isAdmin={isAdmin} isPro={isPro}
        loginWithGoogle={loginWithGoogle} logout={logout}
        showAdminView={showAdminView} setShowAdminView={setShowAdminView}
        activeView={activeView} setActiveView={setActiveView}
      />

      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-5 flex-1">
        
        {showAdminView && isAdmin ? (
          <div className="w-full flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">System Administration</h2>
              <button onClick={returnToStudio} className="text-xs font-semibold text-blue-500 hover:underline">
                ← Return to Label Studio
              </button>
            </div>
            <AdminPanel activeCount={activeUsersCount} guestCount={guestCount} registeredOnlineCount={registeredOnlineCount} />
          </div>
        ) : activeView === 'merge' ? <MergePdfTool darkMode={darkMode} onBack={returnToStudio} />
          : activeView === 'split' ? <SplitPdfTool darkMode={darkMode} onBack={returnToStudio} />
          : activeView === 'crop' ? <CustomCropTool darkMode={darkMode} onBack={returnToStudio} />
          : activeView === 'rotate' ? <RotatePdfTool darkMode={darkMode} onBack={returnToStudio} />
          : activeView === 'remove' ? <RemovePagesTool darkMode={darkMode} onBack={returnToStudio} />
          : activeView === 'page-number' ? <PageNumberTool darkMode={darkMode} onBack={returnToStudio} />
          : activeView === 'editor' ? <PdfEditorStudio darkMode={darkMode} onBack={returnToStudio} />
          : activeView === 'multi-pipeline' ? <MultiPipelineTool darkMode={darkMode} onBack={returnToStudio} />
          : activeView === 'image-to-pdf' ? <ImageToPdfTool darkMode={darkMode} onBack={returnToStudio} />
          : activeView === 'pdf-to-image' ? <PdfToImageTool darkMode={darkMode} onBack={returnToStudio} />
          : (
          <>
            <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-xs shadow-sm ${
              darkMode ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-600'
            }`}>
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-amber-500" />
                <span><b className={darkMode ? 'text-white' : 'text-slate-800'}>{activePlatform.name}:</b> {activePlatform.desc}</span>
              </div>
              <div className="hidden sm:flex items-center gap-3">
                <span className="text-[11px] text-slate-400">Shortcuts: <b>Ctrl+U</b> (Upload) • <b>Ctrl+Enter</b> (Crop)</span>
                <span className="text-[11px] text-emerald-500 font-semibold">• 100% Client-Side Private</span>
              </div>
            </div>

            {/* અહી 3 અલગ-અલગ કમ્પોનન્ટ્સ લોડ થશે (જે તે પ્લેટફોર્મ મુજબ) */}
            {platform === 'flipkart' && <FlipkartStudio darkMode={darkMode} />}
            {platform === 'meesho' && <MeeshoStudio darkMode={darkMode} />}
            {platform === 'amazon' && <AmazonStudio darkMode={darkMode} />}
          </>
        )}

      </main>

      <FeaturesSection darkMode={darkMode} />
      <Footer darkMode={darkMode} setPlatform={setPlatform} setActiveView={setActiveView} />

    </div>
  );
}