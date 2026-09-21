import React, { useState, useRef, useEffect } from 'react';
import { useAuthPresence } from './utils/useAuthPresence';
import AdminPanel from './components/AdminPanel';
import { 
  Upload, 
  FileText, 
  Download, 
  CheckCircle2, 
  LogOut, 
  LogIn, 
  Scissors, 
  Layers,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { renderPreviewCanvas, processLabels } from './utils/pdfProcessor';

export default function App() {
  const [platform, setPlatform] = useState('flipkart');
  const [file, setFile] = useState(null);
  const [inputBytes, setInputBytes] = useState(null);
  const [outputBytes, setOutputBytes] = useState(null);
  const [status, setStatus] = useState('Platform select karo ane tamari PDF upload karo.');
  const [statusType, setStatusType] = useState('info'); // info | ok | warn
  const [processing, setProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const canvasRef = useRef(null);

  // Firebase Auth, Admin Status & Live Presence Hook
  const { 
    currentUser, 
    isPro, 
    isAdmin, 
    activeUsersCount, 
    loginWithGoogle, 
    logout 
  } = useAuthPresence();

  // Platform details & Light Brand Colors
  const platforms = [
    { 
      id: 'flipkart', 
      name: 'Flipkart', 
      desc: '1 Label / A4 Page (Centered with 0.5mm margin)',
      activeBg: 'bg-blue-600',
      tagText: 'text-blue-700'
    },
    { 
      id: 'meesho', 
      name: 'Meesho', 
      desc: 'Exact cropped label + 2mm thermal bottom margin',
      activeBg: 'bg-pink-600',
      tagText: 'text-pink-700'
    },
    { 
      id: 'amazon', 
      name: 'Amazon', 
      desc: 'Smart 2-Page pairing (SKU ID & QTY auto-printed on label)',
      activeBg: 'bg-amber-600',
      tagText: 'text-amber-800'
    },
  ];

  const activePlatform = platforms.find((p) => p.id === platform);

  useEffect(() => {
    if (inputBytes && canvasRef.current) {
      renderPreviewCanvas(inputBytes, platform, canvasRef.current).catch(() => {});
    }
  }, [platform]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    setFile(selected);
    setOutputBytes(null);
    setStatus('PDF file read thai rahi che...');
    setStatusType('info');

    const reader = new FileReader();
    reader.onload = async () => {
      const bytes = new Uint8Array(reader.result);
      setInputBytes(bytes);
      setStatus('Live preview render thai rahyo che...');
      try {
        if (canvasRef.current) {
          await renderPreviewCanvas(bytes, platform, canvasRef.current);
        }
        setStatus('PDF ready che. Have "Crop Labels" par click karo.', 'ok');
        setStatusType('ok');
      } catch (err) {
        setStatus('Preview load na thayu, pan tame direct crop kari shako cho.');
        setStatusType('warn');
      }
    };
    reader.readAsArrayBuffer(selected);
  };

  const handleCrop = async () => {
    if (!inputBytes) return;
    setProcessing(true);
    setProgressText('Processing start thai rahyu che...');
    setStatusType('info');
    try {
      const result = await processLabels(inputBytes, platform, (current, total) => {
        setProgressText(`Processing ${current} of ${total} orders...`);
      });
      setOutputBytes(result);
      setStatus('Crop complete! Download button par click kari ne file save karo.', 'ok');
      setStatusType('ok');
    } catch (err) {
      setStatus(`Error: ${err.message}`);
      setStatusType('warn');
    } finally {
      setProcessing(false);
      setProgressText('');
    }
  };

  const handleDownload = () => {
    if (!outputBytes) return;
    const blob = new Blob([outputBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${platform}-cropped-labels.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-800 font-sans">
      
      {/* 1. Header (Clean White + Firebase Auth) */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${activePlatform.activeBg} text-white shadow-md transition-colors duration-300`}>
              <Scissors size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-slate-900">LabelSnap Pro</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  DESKTOP
                </span>
              </div>
              <p className="text-xs text-slate-500">Fast E-commerce Shipping Label Cropper</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3 bg-slate-100 border border-slate-200 pl-3 pr-2 py-1.5 rounded-xl">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-800 truncate max-w-[140px]">
                    {currentUser.displayName || currentUser.email}
                  </span>
                  <span className={`text-[10px] font-bold ${isPro ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {isAdmin ? 'ADMIN (PRO)' : isPro ? 'PRO (Unlimited)' : 'FREE TIER'}
                  </span>
                </div>
                <button 
                  onClick={logout}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-rose-600 transition"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button 
                onClick={loginWithGoogle}
                className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2 rounded-xl border border-slate-300 hover:border-slate-400 transition shadow-sm"
              >
                <LogIn size={15} className="text-indigo-600" />
                Sign in with Google
              </button>
            )}
          </div>

        </div>
      </header>

      {/* 2. Main Workspace */}
      <main className="max-w-6xl w-full mx-auto p-6 flex-1 flex flex-col gap-5">
        
        {/* Animated Platform Tabs */}
        <div className="bg-slate-200/70 p-1.5 rounded-2xl flex items-center relative shadow-inner">
          {platforms.map((p) => {
            const isActive = platform === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setPlatform(p.id)}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 relative z-10 flex items-center justify-center gap-2 ${
                  isActive 
                    ? 'text-white' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p.name}
              </button>
            );
          })}

          <div 
            className={`absolute top-1.5 bottom-1.5 rounded-xl ${activePlatform.activeBg} transition-all duration-300 ease-out shadow-sm`}
            style={{
              width: `calc(100% / 3 - 4px)`,
              left: platform === 'flipkart' ? '4px' : platform === 'meesho' ? 'calc(100% / 3)' : 'calc((100% / 3) * 2 - 4px)'
            }}
          />
        </div>

        {/* Platform Info Line */}
        <div className="flex items-center justify-between px-4 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-amber-500" />
            <span><b className="text-slate-800">{activePlatform.name}:</b> {activePlatform.desc}</span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">100% Local Processing</span>
        </div>

        {/* Workspace Panels */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Left Panel: Upload & Actions */}
          <div className="md:col-span-6 flex flex-col gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div>
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FileText size={16} className="text-indigo-600" />
                Upload PDF File
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Tamara {activePlatform.name} na labels ahiya upload karo</p>
            </div>

            <label className="border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition duration-200">
              <input type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
              
              <div className="p-3 bg-white text-slate-600 border border-slate-200 rounded-xl shadow-sm">
                <Upload size={24} />
              </div>

              <div className="text-center mt-1">
                <p className="text-sm font-semibold text-slate-700">
                  PDF select karva click karo
                </p>
                <p className="text-xs text-slate-400 mt-0.5">athva ahiya drag & drop karo</p>
              </div>
            </label>

            {file && (
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5 truncate">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                  <div className="truncate">
                    <p className="text-xs font-semibold text-slate-800 truncate">{file.name}</p>
                    <p className="text-[11px] text-slate-500">{(file.size / 1024).toFixed(1)} KB • PDF Document</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setFile(null); setInputBytes(null); setOutputBytes(null); }}
                  className="text-xs text-rose-500 hover:text-rose-700 font-semibold ml-2"
                >
                  Remove
                </button>
              </div>
            )}

            {/* Status Indicator */}
            <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${
              statusType === 'ok' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                : statusType === 'warn'
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              {statusType === 'ok' ? (
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              ) : statusType === 'warn' ? (
                <AlertCircle size={16} className="text-amber-600 shrink-0" />
              ) : (
                <Sparkles size={16} className="text-slate-500 shrink-0" />
              )}
              <span>{processing ? progressText : status}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                disabled={!inputBytes || processing}
                onClick={handleCrop}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm text-white shadow-sm transition ${
                  !inputBytes || processing
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
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
                    <span>Crop Labels</span>
                  </>
                )}
              </button>

              <button
                disabled={!outputBytes}
                onClick={handleDownload}
                className={`flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold text-sm transition ${
                  outputBytes
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                    : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Download size={16} />
                <span>Download</span>
              </button>
            </div>

          </div>

          {/* Right Panel: Live Preview Canvas */}
          <div className="md:col-span-6 flex flex-col gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-h-[440px]">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Layers size={16} className="text-indigo-600" />
                Live Cropped Preview
              </h2>

              {inputBytes && (
                <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                  Page 1 Live View
                </span>
              )}
            </div>

            <div className="flex-1 bg-slate-50 rounded-xl border border-slate-200 border-dashed flex items-center justify-center p-4 relative overflow-hidden">
              <canvas 
                ref={canvasRef} 
                className={`max-w-full max-h-[420px] object-contain shadow-sm border border-slate-200 rounded bg-white transition-opacity ${
                  file ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`} 
              />
              
              {!file && (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <Layers size={32} className="stroke-[1.5]" />
                  <p className="text-xs font-medium">PDF upload karso etle ahiya preview dekhase</p>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* 3. Admin Control Center (Only visible to Admin) */}
        {isAdmin && <AdminPanel activeCount={activeUsersCount} />}

      </main>

      {/* 4. Footer */}
      <footer className="border-t border-slate-200 bg-white py-3.5 px-6 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={15} className="text-emerald-600" />
            <span>Safe &amp; Secure (Tamaro data server par upload nathi thato)</span>
          </div>
          
          {!isPro && (
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline">Ad Space (Thermal Paper Roll)</span>
              <span className="text-amber-600 font-semibold">Free Plan</span>
            </div>
          )}
        </div>
      </footer>

    </div>
  );
}