import React, { useState, useRef, useEffect } from 'react';
import { useAuthPresence } from './utils/useAuthPresence';
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

import { 
  Upload, 
  FileText, 
  Download, 
  CheckCircle2, 
  Scissors, 
  Layers, 
  Sparkles, 
  RefreshCw, 
  AlertCircle,
  Printer,
  SlidersHorizontal,
  ArrowUpDown,
  Info,
  Tag,
  ClipboardList,
  FileSpreadsheet,
  Files,
  FileCheck
} from 'lucide-react';

import { 
  renderPreviewCanvas, 
  processLabels, 
  mergeMultiplePdfs, 
  generatePickListPDF,
  exportManifestToCSV 
} from './utils/pdfProcessor';

export default function App() {
  const [platform, setPlatform] = useState('flipkart');
  const [files, setFiles] = useState([]);
  const [inputBytes, setInputBytes] = useState(null);
  const [outputBytes, setOutputBytes] = useState(null);
  const [manifestData, setManifestData] = useState([]);
  const [status, setStatus] = useState('Select your marketplace and upload your shipping label PDF.');
  const [statusType, setStatusType] = useState('info');
  const [processing, setProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  
  // Custom Controls & Print Settings
  const [processingMode, setProcessingMode] = useState('label_only');
  const [amazonInvoiceMode, setAmazonInvoiceMode] = useState('remove');
  const [amazonSkuMode, setAmazonSkuMode] = useState('id_only');
  const [printStyleCode, setPrintStyleCode] = useState(false);
  const [sortBySku, setSortBySku] = useState(false);
  const [autoDownload, setAutoDownload] = useState(true);
  const [darkenThermal, setDarkenThermal] = useState(false);
  const [brandingText, setBrandingText] = useState('');

  // 1. By Default Light/White Theme
  const [darkMode, setDarkMode] = useState(false);

  // Route Definitions (SEO URL Routing)
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

  // 2. Active Screen View Router initialized from URL
  const [activeView, setActiveView] = useState(() => {
    const path = window.location.pathname;
    return pathToView[path] || 'studio';
  });

  // Sync State with Browser URL and Update Title dynamically
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

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      setActiveView(pathToView[path] || 'studio');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Admin View Toggle (Controlled via Header)
  const [showAdminView, setShowAdminView] = useState(false);

  const [hoveredTip, setHoveredTip] = useState(
    'Hover your cursor over any setting to see how it works.'
  );

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auth, Presence & Live Visitor Stats
  const { 
    currentUser, 
    isPro, 
    isAdmin, 
    activeUsersCount,
    guestCount,
    registeredOnlineCount, 
    loginWithGoogle, 
    logout 
  } = useAuthPresence();

  const platforms = [
    { 
      id: 'flipkart', 
      name: 'Flipkart', 
      desc: 'Precision Thermal 4x6 / Single Page crop',
      activeBg: 'bg-blue-600',
    },
    { 
      id: 'meesho', 
      name: 'Meesho', 
      desc: 'Crop with 2mm margin + SKU & Size injection',
      activeBg: 'bg-pink-600',
    },
    { 
      id: 'amazon', 
      name: 'Amazon', 
      desc: 'Dynamic 2-page invoice pairing & SKU extraction',
      activeBg: 'bg-amber-600',
    },
  ];

  const activePlatform = platforms.find((p) => p.id === platform);

  // Keyboard Shortcuts: Ctrl+U (Upload) & Ctrl+Enter (Crop)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        fileInputRef.current?.click();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (inputBytes && !processing && activeView === 'studio' && !showAdminView) {
          handleCrop();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputBytes, processing, processingMode, amazonInvoiceMode, amazonSkuMode, printStyleCode, sortBySku, brandingText, autoDownload, darkenThermal, activeView, showAdminView]);

  // Live Canvas Preview Reload
  useEffect(() => {
    if (inputBytes && canvasRef.current && activeView === 'studio') {
      renderPreviewCanvas(inputBytes, platform, canvasRef.current, { darkenThermal }).catch(() => {});
    }
  }, [platform, darkenThermal, activeView]);

  // GA4 Page View Tracking
  useEffect(() => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_title: activeView,
        page_location: window.location.href,
        page_path: '/' + activeView
      });
    }
  }, [activeView]);

  // Multi-PDF File Upload Handler
  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    setFiles(selectedFiles);
    setOutputBytes(null);
    setManifestData([]);
    setStatus('Reading and loading PDF files...');
    setStatusType('info');

    try {
      const arrayBuffers = await Promise.all(
        selectedFiles.map((file) => file.arrayBuffer().then((buf) => new Uint8Array(buf)))
      );

      let finalBytes;
      if (arrayBuffers.length > 1) {
        setStatus(`Merging ${arrayBuffers.length} PDF files...`);
        finalBytes = await mergeMultiplePdfs(arrayBuffers);
      } else {
        finalBytes = arrayBuffers[0];
      }

      setInputBytes(finalBytes);
      setStatus('Rendering live preview...');

      if (canvasRef.current) {
        await renderPreviewCanvas(finalBytes, platform, canvasRef.current, { darkenThermal });
      }
      setStatus(`${selectedFiles.length} file(s) ready. Click "Process & Crop".`);
      setStatusType('ok');
    } catch (err) {
      setStatus('Preview could not load, but direct label processing will work.');
      setStatusType('warn');
    }
  };

  const downloadBlob = (bytes, filename) => {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const handlePrint = () => {
    if (!outputBytes) return;
    const blob = new Blob([outputBytes], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(blob);

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = blobUrl;
    document.body.appendChild(iframe);

    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }, 100);
    };
  };

  const handleCrop = async () => {
    if (!inputBytes) return;
    setProcessing(true);
    setProgressText('Processing your order batch...');
    setStatusType('info');

    try {
      const { pdfResultBytes, manifestData: mData } = await processLabels(
        inputBytes, 
        platform, 
        (current, total) => {
          setProgressText(`Processing label ${current} of ${total}...`);
        },
        { 
          processingMode, 
          amazonInvoiceMode, 
          amazonSkuMode, 
          printStyleCode, 
          sortBySku, 
          brandingText, 
          darkenThermal 
        }
      );

      setOutputBytes(pdfResultBytes);
      setManifestData(mData || []);
      setStatus('Batch completed successfully!');
      setStatusType('ok');

      if (autoDownload) {
        downloadBlob(pdfResultBytes, `${platform}-cropped-batch.pdf`);
      }
    } catch (err) {
      setStatus(`Error: ${err.message}`);
      setStatusType('warn');
    } finally {
      setProcessing(false);
      setProgressText('');
    }
  };

  const handleDownloadPickList = async () => {
    if (manifestData.length === 0) return;
    try {
      const pickListBytes = await generatePickListPDF(manifestData, platform);
      downloadBlob(pickListBytes, `${platform}-dispatch-picklist.pdf`);
    } catch (err) {
      alert('Failed to generate pick-list PDF.');
    }
  };

  const handleExportCSV = () => {
    if (manifestData.length === 0) return;
    exportManifestToCSV(manifestData, platform);
  };

  const returnToStudio = () => {
    setActiveView('studio');
    setShowAdminView(false);
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      darkMode ? 'bg-[#0b0f19] text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      
      {/* 1. Header with Embedded Marketplace Switcher & All PDF Tools */}
      <Header 
        platform={platform}
        setPlatform={setPlatform}
        platforms={platforms}
        activePlatform={activePlatform}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        currentUser={currentUser}
        isAdmin={isAdmin}
        isPro={isPro}
        loginWithGoogle={loginWithGoogle}
        logout={logout}
        showAdminView={showAdminView}
        setShowAdminView={setShowAdminView}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      {/* 2. Main Content Router */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-5 flex-1">
        
        {/* A. Admin View Mode */}
        {showAdminView && isAdmin ? (
          <div className="w-full flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">System Administration</h2>
              <button 
                onClick={returnToStudio}
                className="text-xs font-semibold text-blue-500 hover:underline"
              >
                ← Return to Label Studio
              </button>
            </div>
            <AdminPanel 
              activeCount={activeUsersCount} 
              guestCount={guestCount}
              registeredOnlineCount={registeredOnlineCount}
            />
          </div>
        ) : activeView === 'merge' ? (
          /* B. Merge PDF Tool */
          <MergePdfTool darkMode={darkMode} onBack={returnToStudio} />
        ) : activeView === 'split' ? (
          /* C. Split PDF Tool */
          <SplitPdfTool darkMode={darkMode} onBack={returnToStudio} />
        ) : activeView === 'crop' ? (
          /* D. Custom / Selected Crop Tool */
          <CustomCropTool darkMode={darkMode} onBack={returnToStudio} />
        ) : activeView === 'rotate' ? (
          /* E. Rotate PDF Tool */
          <RotatePdfTool darkMode={darkMode} onBack={returnToStudio} />
        ) : activeView === 'remove' ? (
          /* F. Remove Pages Tool */
          <RemovePagesTool darkMode={darkMode} onBack={returnToStudio} />
        ) : activeView === 'page-number' ? (
          /* G. Page Number Tool */
          <PageNumberTool darkMode={darkMode} onBack={returnToStudio} />
        ) : activeView === 'editor' ? (
          /* H. Dedicated Visual PDF Editor */
          <PdfEditorStudio darkMode={darkMode} onBack={returnToStudio} />
        ) : activeView === 'multi-pipeline' ? (
          /* I. All-in-One Multi Pipeline Studio */
          <MultiPipelineTool darkMode={darkMode} onBack={returnToStudio} />
        ) : activeView === 'image-to-pdf' ? (
          /* J. Image to PDF Tool */
          <ImageToPdfTool darkMode={darkMode} onBack={returnToStudio} />
        ) : activeView === 'pdf-to-image' ? (
          /* K. PDF to Image Tool */
          <PdfToImageTool darkMode={darkMode} onBack={returnToStudio} />
        ) : (
          /* L. Default: Flipkart / Meesho / Amazon Label Studio */
          <>
            {/* Marketplace Information Bar */}
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

            {/* 3-Column Studio: Left (Upload) | Center (Preview) | Right (Settings) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Upload */}
              <div className={`lg:col-span-4 flex flex-col gap-4 border rounded-2xl p-5 shadow-sm ${
                darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div>
                  <h2 className="text-sm font-bold flex items-center gap-2">
                    <FileText size={16} className="text-blue-500" />
                    Upload PDF Labels (Single / Multi)
                  </h2>
                  <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Batch drop multiple marketplace files together
                  </p>
                </div>

                <label className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition duration-200 ${
                  darkMode 
                    ? 'border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/80' 
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
                }`}>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="application/pdf" 
                    multiple
                    className="hidden" 
                    onChange={handleFileChange} 
                  />
                  
                  <div className={`p-3 border rounded-xl shadow-sm ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600'
                  }`}>
                    <Upload size={22} />
                  </div>

                  <div className="text-center mt-1">
                    <p className="text-sm font-semibold">Choose Label PDF(s)</p>
                    <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>or drag &amp; drop here</p>
                  </div>
                </label>

                {files.length > 0 && (
                  <div className={`p-3 rounded-xl border flex flex-col gap-2 ${
                    darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold flex items-center gap-1.5 text-emerald-500">
                        <Files size={14} />
                        {files.length} Document(s) Loaded
                      </span>
                      <button 
                        onClick={() => { setFiles([]); setInputBytes(null); setOutputBytes(null); setManifestData([]); }}
                        className="text-rose-500 hover:text-rose-600 font-semibold"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="max-h-24 overflow-y-auto flex flex-col gap-1 pr-1">
                      {files.map((f, idx) => (
                        <div key={idx} className="text-[11px] truncate flex items-center justify-between text-slate-400">
                          <span className="truncate">{idx + 1}. {f.name}</span>
                          <span>{(f.size / 1024).toFixed(0)} KB</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${
                  statusType === 'ok' 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                    : statusType === 'warn'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                    : darkMode 
                    ? 'bg-slate-800/60 border-slate-700 text-slate-300' 
                    : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}>
                  {statusType === 'ok' ? (
                    <CheckCircle2 size={16} className="shrink-0" />
                  ) : statusType === 'warn' ? (
                    <AlertCircle size={16} className="shrink-0" />
                  ) : (
                    <Sparkles size={16} className="shrink-0" />
                  )}
                  <span>{processing ? progressText : status}</span>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <button
                    disabled={!inputBytes || processing}
                    onClick={handleCrop}
                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm text-white shadow-md transition ${
                      !inputBytes || processing
                        ? 'bg-slate-700 cursor-not-allowed opacity-50'
                        : `${activePlatform.activeBg} hover:opacity-90 active:scale-[0.99]`
                    }`}
                  >
                    {processing ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Scissors size={16} />
                        <span>Process &amp; Crop (Ctrl+Enter)</span>
                      </>
                    )}
                  </button>

                  <div className="flex gap-2">
                    <button
                      disabled={!outputBytes}
                      onClick={() => outputBytes && downloadBlob(outputBytes, `${platform}-cropped-batch.pdf`)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs transition ${
                        outputBytes
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                          : darkMode ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <Download size={15} />
                      <span>Download Cropped PDF</span>
                    </button>

                    <button
                      disabled={!outputBytes}
                      onClick={handlePrint}
                      className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs transition ${
                        outputBytes
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
                          : darkMode ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                      title="Direct Thermal 1-Click Print"
                    >
                      <Printer size={15} />
                      <span>Print Label</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      disabled={manifestData.length === 0}
                      onClick={handleDownloadPickList}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl font-bold text-[11px] transition ${
                        manifestData.length > 0
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                          : darkMode ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                      title="Generate Pick-List Summary PDF"
                    >
                      <ClipboardList size={13} />
                      <span>Pick-List PDF</span>
                    </button>

                    <button
                      disabled={manifestData.length === 0}
                      onClick={handleExportCSV}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl font-bold text-[11px] transition ${
                        manifestData.length > 0
                          ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm'
                          : darkMode ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                      title="Export Dispatch Manifest as CSV"
                    >
                      <FileSpreadsheet size={13} />
                      <span>Manifest CSV</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Center Column: Live Preview Canvas */}
              <div className={`lg:col-span-5 flex flex-col gap-4 border rounded-2xl p-5 shadow-sm min-h-[460px] ${
                darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold flex items-center gap-2">
                    <Layers size={16} className="text-blue-500" />
                    Live Cropped Preview
                  </h2>

                  {inputBytes && (
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-lg border ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'
                    }`}>
                      Page 1 Live View
                    </span>
                  )}
                </div>

                <div className={`flex-1 rounded-xl border border-dashed flex items-center justify-center p-4 relative overflow-hidden ${
                  darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <canvas 
                    ref={canvasRef} 
                    className={`max-w-full max-h-[400px] object-contain shadow-sm border rounded bg-white transition-opacity ${
                      files.length > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`} 
                  />
                  
                  {files.length === 0 && (
                    <div className="flex flex-col items-center gap-2 text-slate-400 text-center">
                      <Layers size={36} className="stroke-[1.5]" />
                      <p className="text-xs font-medium">Upload shipping labels to inspect real-time preview</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Settings Panel */}
              <div className={`lg:col-span-3 flex flex-col gap-4 border rounded-2xl p-5 shadow-sm ${
                darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center gap-2 text-xs font-bold tracking-wide">
                  <SlidersHorizontal size={16} className="text-blue-500" />
                  <span>Smart Rules &amp; Print Modes</span>
                </div>

                <div className="flex flex-col gap-3">
                  
                  {platform !== 'amazon' && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Processing Mode</span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onMouseEnter={() => setHoveredTip('Label Only: Crops strictly the shipping label box with zero invoice clutter. Optimal for standard 4x6 thermal rolls.')}
                          onClick={() => setProcessingMode('label_only')}
                          className={`p-2 rounded-xl border text-center text-xs font-semibold flex flex-col items-center gap-1 transition ${
                            processingMode === 'label_only'
                              ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                              : darkMode ? 'border-slate-800 hover:border-slate-700' : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <Scissors size={14} />
                          <span>Label Only</span>
                        </button>

                        <button
                          type="button"
                          onMouseEnter={() => setHoveredTip('Single Page Mode: Keeps shipping label and tax invoice intact together to prevent marketplace penalties.')}
                          onClick={() => setProcessingMode('single_page')}
                          className={`p-2 rounded-xl border text-center text-xs font-semibold flex flex-col items-center gap-1 transition ${
                            processingMode === 'single_page'
                              ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                              : darkMode ? 'border-slate-800 hover:border-slate-700' : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <FileCheck size={14} />
                          <span>Single Page</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {platform === 'amazon' && (
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Invoice Handling</span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onMouseEnter={() => setHoveredTip('Remove Invoice: Strips out Page 2 (Customer Invoice) automatically and yields only the cropped label.')}
                            onClick={() => setAmazonInvoiceMode('remove')}
                            className={`p-2 rounded-xl border text-center text-xs font-semibold transition ${
                              amazonInvoiceMode === 'remove'
                                ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                                : darkMode ? 'border-slate-800 hover:border-slate-700' : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            Remove Invoice
                          </button>

                          <button
                            type="button"
                            onMouseEnter={() => setHoveredTip('Keep Invoice: Preserves the customer invoice page right behind each cropped shipping label for dispatch.')}
                            onClick={() => setAmazonInvoiceMode('keep')}
                            className={`p-2 rounded-xl border text-center text-xs font-semibold transition ${
                              amazonInvoiceMode === 'keep'
                                ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                                : darkMode ? 'border-slate-800 hover:border-slate-700' : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            Keep Invoice
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">SKU Header Style</span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onMouseEnter={() => setHoveredTip('Print SKU ID Only: Prints concise item identification code on the label header.')}
                            onClick={() => setAmazonSkuMode('id_only')}
                            className={`p-1.5 rounded-lg border text-center text-[11px] font-semibold transition ${
                              amazonSkuMode === 'id_only'
                                ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                                : darkMode ? 'border-slate-800' : 'border-slate-200'
                            }`}
                          >
                            SKU ID Only
                          </button>

                          <button
                            type="button"
                            onMouseEnter={() => setHoveredTip('Print SKU with Description: Includes product name along with the SKU ID on the label.')}
                            onClick={() => setAmazonSkuMode('with_desc')}
                            className={`p-1.5 rounded-lg border text-center text-[11px] font-semibold transition ${
                              amazonSkuMode === 'with_desc'
                                ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                                : darkMode ? 'border-slate-800' : 'border-slate-200'
                            }`}
                          >
                            With Description
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {platform === 'meesho' && (
                    <button
                      type="button"
                      onMouseEnter={() => setHoveredTip('Print Style Code & Size: Extracts product style code and garment size (S, M, L, XL) and imprints it clearly on the footer.')}
                      onClick={() => setPrintStyleCode(!printStyleCode)}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition text-xs font-semibold ${
                        printStyleCode
                          ? 'border-pink-500 bg-pink-500/10 text-pink-500'
                          : darkMode ? 'border-slate-800 hover:border-slate-700' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Tag size={15} />
                        Print Style Code &amp; Size
                      </span>
                      {printStyleCode && <CheckCircle2 size={14} />}
                    </button>
                  )}

                  {platform === 'amazon' && (
                    <button
                      type="button"
                      onMouseEnter={() => setHoveredTip('SKU Auto-Sort: Groups same SKU products sequentially to accelerate picking and packing in your warehouse.')}
                      onClick={() => setSortBySku(!sortBySku)}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition text-xs font-semibold ${
                        sortBySku
                          ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                          : darkMode ? 'border-slate-800 hover:border-slate-700' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <ArrowUpDown size={15} />
                        SKU-Wise Order Sorting
                      </span>
                      {sortBySku && <CheckCircle2 size={14} />}
                    </button>
                  )}

                  <button
                    type="button"
                    onMouseEnter={() => setHoveredTip('Darken Thermal Barcodes: Applies a contrast enhancement pass to ensure instant handheld scanner detection on thermal papers.')}
                    onClick={() => setDarkenThermal(!darkenThermal)}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition text-xs font-semibold ${
                      darkenThermal
                        ? 'border-purple-500 bg-purple-500/10 text-purple-500'
                        : darkMode ? 'border-slate-800 hover:border-slate-700' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Printer size={15} />
                      Darken Thermal Barcode
                    </span>
                    {darkenThermal && <CheckCircle2 size={14} />}
                  </button>

                  <button
                    type="button"
                    onMouseEnter={() => setHoveredTip('Auto Download: Triggers instant browser download of the cropped PDF as soon as processing completes.')}
                    onClick={() => setAutoDownload(!autoDownload)}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition text-xs font-semibold ${
                      autoDownload
                        ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                        : darkMode ? 'border-slate-800 hover:border-slate-700' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Download size={15} />
                      Auto Download on Finish
                    </span>
                    {autoDownload && <CheckCircle2 size={14} />}
                  </button>

                </div>

                <div 
                  className="flex flex-col gap-1.5 pt-2 border-t border-slate-200 dark:border-slate-800/40"
                  onMouseEnter={() => setHoveredTip('Custom Label Footer: Custom store name or unboxing notice printed at the bottom margin of each cropped label.')}
                >
                  <label className="text-[11px] font-bold flex items-center gap-1">
                    <Tag size={12} className="text-blue-500" />
                    <span>Custom Label Footer / Branding</span>
                  </label>
                  <input 
                    type="text" 
                    value={brandingText}
                    onChange={(e) => setBrandingText(e.target.value)}
                    placeholder="Ex. Thank you for your order!"
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none transition ${
                      darkMode 
                        ? 'bg-slate-950 border-slate-800 focus:border-blue-500 text-slate-200' 
                        : 'bg-slate-50 border-slate-200 focus:border-blue-500 text-slate-800'
                    }`}
                  />
                </div>

                <div className={`mt-auto p-3 rounded-xl border flex flex-col gap-1 text-[11px] leading-relaxed transition-all ${
                  darkMode ? 'bg-slate-950/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}>
                  <div className="flex items-center gap-1.5 font-bold text-blue-500">
                    <Info size={13} />
                    <span>Feature Guide</span>
                  </div>
                  <p>{hoveredTip}</p>
                </div>

              </div>

            </div>
          </>
        )}

      </main>

      {/* 3. Features Showcase Section */}
      <FeaturesSection darkMode={darkMode} />

      {/* 4. Complete Footer */}
      {/* Passed setActiveView so footer legal links can reset the view properly */}
      <Footer 
        darkMode={darkMode} 
        setPlatform={setPlatform} 
        setActiveView={setActiveView} 
      />

    </div>
  );
}