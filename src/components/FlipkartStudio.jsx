import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, FileText, Download, CheckCircle2, Scissors, Layers, Sparkles, 
  RefreshCw, AlertCircle, Printer, SlidersHorizontal, Tag, FileCheck,
  ClipboardList, FileSpreadsheet, Files, Info, ChevronDown, Zap
} from 'lucide-react';
import { 
  renderFlipkartPreview, processFlipkartLabels, mergeMultiplePdfs, 
  generatePickListPDF, exportManifestToCSV 
} from '../utils/flipkartProcessor';

export default function FlipkartStudio({ darkMode }) {
  const [files, setFiles] = useState([]);
  const [inputBytes, setInputBytes] = useState(null);
  const [outputBytes, setOutputBytes] = useState(null);
  const [manifestData, setManifestData] = useState([]);
  const [status, setStatus] = useState('Upload your Flipkart shipping label PDF to begin.');
  const [statusType, setStatusType] = useState('info');
  const [processing, setProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  
  // Flipkart Specific Settings
  const [processingMode, setProcessingMode] = useState('label_only');
  const [autoDownload, setAutoDownload] = useState(true);
  const [darkenThermal, setDarkenThermal] = useState(false);
  const [brandingText, setBrandingText] = useState('');

  // UI-only states
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [showOutputOptions, setShowOutputOptions] = useState(false);
  const [canvasJustRendered, setCanvasJustRendered] = useState(false);

  const [hoveredTip, setHoveredTip] = useState('Hover over any setting to see what it does.');
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        fileInputRef.current?.click();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (inputBytes && !processing) handleCrop();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputBytes, processing, processingMode, brandingText, autoDownload, darkenThermal]);

  useEffect(() => {
    if (inputBytes && canvasRef.current) {
      renderFlipkartPreview(inputBytes, canvasRef.current, { darkenThermal, processingMode })
        .then(() => {
          setCanvasJustRendered(true);
          setTimeout(() => setCanvasJustRendered(false), 1300);
        })
        .catch(() => {});
    }
  }, [inputBytes, darkenThermal, processingMode]);

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    setFiles(selectedFiles);
    setOutputBytes(null);
    setManifestData([]);
    setShowOutputOptions(false);
    setStatus('Reading and loading PDF files...');
    setStatusType('info');

    try {
      const arrayBuffers = await Promise.all(
        selectedFiles.map((file) => file.arrayBuffer().then((buf) => new Uint8Array(buf)))
      );

      let finalBytes = arrayBuffers.length > 1 
        ? await mergeMultiplePdfs(arrayBuffers) 
        : arrayBuffers[0];

      setInputBytes(finalBytes);
      setStatus(`${selectedFiles.length} file(s) ready to process.`);
      setStatusType('ok');

      if (canvasRef.current) {
        try {
          await renderFlipkartPreview(finalBytes, canvasRef.current, { darkenThermal, processingMode });
        } catch (previewErr) {
          console.warn('Preview render failed:', previewErr);
        }
      }
    } catch (err) {
      setStatus('File could not be read. Please try a different PDF.');
      setStatusType('warn');
      setFiles([]);
      setInputBytes(null);
    }
  };

  const clearAll = () => {
    setFiles([]);
    setInputBytes(null);
    setOutputBytes(null);
    setManifestData([]);
    setShowOutputOptions(false);
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
    setProgressText('Processing your batch...');
    setStatusType('info');

    try {
      const { pdfResultBytes, manifestData: mData } = await processFlipkartLabels(
        inputBytes, 
        (current, total) => setProgressText(`Processing label ${current} of ${total}...`),
        { processingMode, brandingText, darkenThermal }
      );

      setOutputBytes(pdfResultBytes);
      setManifestData(mData || []);
      setStatus('Batch completed successfully.');
      setStatusType('ok');

      if (autoDownload) {
        downloadBlob(pdfResultBytes, 'flipkart-cropped-batch.pdf');
      }
    } catch (err) {
      setStatus(`Error: ${err.message}`);
      setStatusType('warn');
    } finally {
      setProcessing(false);
      setProgressText('');
    }
  };

  // ─── Theme tokens ────────────────────────────────────────────
  const card = darkMode 
    ? 'bg-slate-900 border-slate-800/80' 
    : 'bg-white border-slate-200/80';
  
  const cardHeader = 'text-sm font-semibold tracking-tight';
  const mutedText = darkMode ? 'text-slate-400' : 'text-slate-500';
  const sectionLabel = `text-[10px] font-semibold uppercase tracking-[0.08em] ${mutedText}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

      {/* ═══════════════════════════════════════════════════════════
          LEFT COLUMN — CONTROL PANEL (5 cols)
          ═══════════════════════════════════════════════════════════ */}
      <div className="lg:col-span-5 flex flex-col gap-3">

        {/* ─── AD SPOT 1 (empty box) ─── */}
        <div className={`h-14 rounded-xl border border-dashed ${darkMode ? 'border-slate-800 bg-slate-950/20' : 'border-slate-200 bg-slate-50/30'}`}></div>

        {/* ─── UPLOAD CARD ─── */}
        <div className={`${card} card-hover flex flex-col gap-3 border rounded-2xl p-4 shadow-sm`}>
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
                <Upload size={14} className="text-indigo-500" strokeWidth={2.5} />
              </div>
              <h2 className={cardHeader}>Upload Labels</h2>
            </div>
            
            {outputBytes && (
              <button
                type="button"
                onClick={() => setShowOutputOptions(!showOutputOptions)}
                onMouseEnter={() => setHoveredTip('Toggle output actions.')}
                className={`text-[11px] font-medium flex items-center gap-1 px-2 py-0.5 rounded-lg transition ${
                  showOutputOptions 
                    ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400' 
                    : `${mutedText} hover:text-indigo-600 dark:hover:text-indigo-400`
                }`}
              >
                {showOutputOptions ? 'Less' : 'More'}
                <ChevronDown size={11} className={`transition-transform duration-200 ${showOutputOptions ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>

          {/* ─── Compact Drop Zone ─── */}
          <label className={`group border border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-300 ${
            darkMode 
              ? 'border-slate-700 hover:border-indigo-500/60 bg-slate-950/30 hover:bg-indigo-500/[0.03]' 
              : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/40'
          }`}>
            <input ref={fileInputRef} type="file" accept="application/pdf" multiple className="hidden" onChange={handleFileChange} />
            <div className={`p-2 rounded-lg transition-all duration-300 ${
              darkMode 
                ? 'bg-slate-800 group-hover:bg-indigo-500/10 text-slate-400 group-hover:text-indigo-400 group-hover:scale-110 group-hover:-rotate-6' 
                : 'bg-white shadow-sm group-hover:bg-indigo-50 text-slate-400 group-hover:text-indigo-500 group-hover:scale-110 group-hover:-rotate-6'
            }`}>
              <Upload size={16} strokeWidth={2} />
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold">Choose Label PDF</p>
              <p className={`text-[10px] mt-0.5 ${mutedText}`}>or drag &amp; drop</p>
            </div>
          </label>

          {/* ─── File Badge ─── */}
          {files.length > 0 && (
            <div className={`px-3 py-2 rounded-lg border flex items-center justify-between option-stagger ${
              darkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200/80'
            }`}>
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-emerald-500/10">
                  <Files size={11} className="text-emerald-500" strokeWidth={2.5} />
                </div>
                <span className="text-[11px] font-medium">
                  {files.length} file{files.length > 1 ? 's' : ''} loaded
                </span>
              </div>
              <button 
                onClick={clearAll} 
                className="text-[10px] font-medium text-rose-500 hover:text-rose-600 transition hover:scale-105"
              >
                Clear
              </button>
            </div>
          )}

          {/* ─── Status ─── */}
          <div className={`px-3 py-2 rounded-lg border flex items-center gap-2 text-[11px] font-medium transition-all duration-300 ${
            statusType === 'ok' 
              ? 'bg-emerald-50 border-emerald-200/70 text-emerald-700 dark:bg-emerald-500/[0.06] dark:border-emerald-500/20 dark:text-emerald-400' 
              : statusType === 'warn' 
              ? 'bg-amber-50 border-amber-200/70 text-amber-700 dark:bg-amber-500/[0.06] dark:border-amber-500/20 dark:text-amber-400' 
              : darkMode 
              ? 'bg-slate-800/40 border-slate-800 text-slate-300' 
              : 'bg-slate-50 border-slate-200/80 text-slate-600'
          }`}>
            {statusType === 'ok' ? (
              <CheckCircle2 size={12} className="shrink-0" strokeWidth={2.5} />
            ) : statusType === 'warn' ? (
              <AlertCircle size={12} className="shrink-0" strokeWidth={2.5} />
            ) : (
              <Sparkles size={12} className="shrink-0" strokeWidth={2.5} />
            )}
            <span className="leading-snug truncate">{processing ? progressText : status}</span>
          </div>
        </div>

        {/* ─── SETTINGS CARD ─── */}
        <div className={`${card} flex flex-col gap-3 border rounded-2xl p-4 shadow-sm`}>
          
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
              <SlidersHorizontal size={14} className="text-indigo-500" strokeWidth={2.5} />
            </div>
            <h2 className={cardHeader}>Settings</h2>
          </div>

          {/* Primary Options */}
          <div className="flex flex-col gap-3">
            
            {/* Processing Mode */}
            <div className="flex flex-col gap-1.5">
              <span className={sectionLabel}>Processing Mode</span>
              <div className="grid grid-cols-1 gap-2">
                <button 
                  type="button" 
                  onMouseEnter={() => setHoveredTip('Label Only: Crops strictly the shipping label box.')} 
                  onClick={() => setProcessingMode('label_only')} 
                  className={`px-3 py-2 rounded-lg border text-[11px] font-medium flex items-center justify-center gap-2 transition-all duration-200 btn-lift ${
                    processingMode === 'label_only' 
                      ? darkMode
                        ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400'
                        : 'border-indigo-500 bg-indigo-50 text-indigo-600'
                      : darkMode 
                        ? 'border-slate-800 text-slate-300 hover:border-slate-700' 
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <Scissors size={12} strokeWidth={2.5} />
                  <span>Label Only</span>
                </button>
              </div>
            </div>

            {/* Auto Download */}
            <button 
              type="button" 
              onMouseEnter={() => setHoveredTip('Auto download when processing finishes.')} 
              onClick={() => setAutoDownload(!autoDownload)} 
              className={`px-3 py-2 rounded-lg border text-[11px] font-medium flex items-center justify-between transition-all duration-200 btn-lift ${
                autoDownload 
                  ? darkMode
                    ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400'
                    : 'border-indigo-500 bg-indigo-50 text-indigo-600'
                  : darkMode 
                    ? 'border-slate-800 text-slate-300 hover:border-slate-700' 
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <Download size={12} strokeWidth={2.5} />
                <span>Auto Download</span>
              </span>
              {autoDownload && <CheckCircle2 size={12} strokeWidth={2.5} className="toggle-slide-in" />}
            </button>
          </div>

          {/* ─── Advanced Accordion ─── */}
          <button
            type="button"
            onClick={() => setAdvancedOpen(!advancedOpen)}
            onMouseEnter={() => setHoveredTip('Show advanced options.')}
            className={`px-3 py-2 rounded-lg border text-[11px] font-bold flex items-center justify-between transition-all duration-300 ${
              advancedOpen 
                ? darkMode
                  ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400'
                  : 'border-indigo-500 bg-indigo-50 text-indigo-600'
                : darkMode
                  ? 'border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <Zap size={12} strokeWidth={2.5} className={advancedOpen ? 'text-indigo-500' : ''} />
              <span>Advanced Options</span>
            </span>
            <ChevronDown 
              size={12} 
              className={`transition-transform duration-300 ${advancedOpen ? 'rotate-180' : 'rotate-0'}`} 
            />
          </button>

          {/* ─── Advanced Content ─── */}
          <div className={`accordion-content ${advancedOpen ? 'open' : ''}`}>
            <div>
              <div className={`flex flex-col gap-2.5 pt-2 ${advancedOpen ? 'border-t' : ''} ${darkMode ? 'border-slate-800' : 'border-slate-200/80'}`}>
                
                {/* Single Page Mode */}
                <button 
                  type="button" 
                  onMouseEnter={() => setHoveredTip('Single Page Mode: Keeps label and invoice intact together.')} 
                  onClick={() => setProcessingMode(processingMode === 'single_page' ? 'label_only' : 'single_page')} 
                  className={`px-3 py-2 rounded-lg border text-[11px] font-medium flex items-center justify-between transition-all duration-200 ${
                    processingMode === 'single_page' 
                      ? darkMode
                        ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400'
                        : 'border-indigo-500 bg-indigo-50 text-indigo-600'
                      : darkMode 
                        ? 'border-slate-800 text-slate-300 hover:border-slate-700' 
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <FileCheck size={12} strokeWidth={2.5} />
                    <span>Single Page Mode</span>
                  </span>
                  {processingMode === 'single_page' && <CheckCircle2 size={12} strokeWidth={2.5} />}
                </button>

                {/* Darken Barcode */}
                <button 
                  type="button" 
                  onMouseEnter={() => setHoveredTip('Increase barcode contrast for thermal printers.')} 
                  onClick={() => setDarkenThermal(!darkenThermal)} 
                  className={`px-3 py-2 rounded-lg border text-[11px] font-medium flex items-center justify-between transition-all duration-200 ${
                    darkenThermal 
                      ? darkMode
                        ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400'
                        : 'border-indigo-500 bg-indigo-50 text-indigo-600'
                      : darkMode 
                        ? 'border-slate-800 text-slate-300 hover:border-slate-700' 
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Printer size={12} strokeWidth={2.5} />
                    <span>Darken Barcode</span>
                  </span>
                  {darkenThermal && <CheckCircle2 size={12} strokeWidth={2.5} />}
                </button>

                {/* Custom Branding */}
                <div className="flex flex-col gap-1.5">
                  <span className={sectionLabel}>Custom Branding</span>
                  <input 
                    id="custom-brand"
                    type="text" 
                    value={brandingText} 
                    onChange={(e) => setBrandingText(e.target.value)} 
                    placeholder="Thank you for your order!" 
                    className={`w-full px-3 py-2 text-[11px] rounded-lg border outline-none transition-all duration-200 ${
                      darkMode 
                        ? 'bg-slate-950/50 border-slate-800 focus:border-indigo-500/60 text-slate-200 placeholder:text-slate-600' 
                        : 'bg-slate-50/50 border-slate-200 focus:border-indigo-400 focus:bg-white text-slate-800 placeholder:text-slate-400'
                    }`} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ─── MAIN PROCESS BUTTON ─── */}
          <button 
            disabled={!inputBytes || processing} 
            onClick={handleCrop} 
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300 relative overflow-hidden ${
              !inputBytes || processing 
                ? darkMode
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 btn-shimmer'
            }`}
            style={!inputBytes || processing ? {} : {
              backgroundImage: 'linear-gradient(90deg, #4f46e5, #6366f1, #8b5cf6, #6366f1, #4f46e5)'
            }}
          >
            {processing ? (
              <>
                <RefreshCw size={15} className="animate-spin" strokeWidth={2.5} />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Scissors size={15} strokeWidth={2.5} />
                <span>Process &amp; Crop</span>
              </>
            )}
          </button>

          {/* ─── Output Actions ─── */}
          {outputBytes && showOutputOptions && (
            <div className={`flex flex-col gap-2 pt-3 border-t option-stagger ${darkMode ? 'border-slate-800' : 'border-slate-200/80'}`}>
              <div className="flex gap-2">
                <button 
                  onClick={() => downloadBlob(outputBytes, `flipkart-cropped-batch.pdf`)} 
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-semibold text-[11px] transition-all duration-200 btn-lift bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20"
                >
                  <Download size={12} strokeWidth={2.5} />
                  <span>Download</span>
                </button>
                <button 
                  onClick={handlePrint} 
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-semibold text-[11px] transition-all duration-200 btn-lift ${
                    darkMode 
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700' 
                      : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                  }`}
                >
                  <Printer size={12} strokeWidth={2.5} />
                  <span>Print</span>
                </button>
              </div>

              {manifestData.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => generatePickListPDF(manifestData, 'flipkart').then(b => downloadBlob(b, 'flipkart-picklist.pdf'))} 
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-semibold text-[10px] transition-all duration-200 btn-lift ${
                      darkMode 
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700' 
                        : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <ClipboardList size={11} strokeWidth={2.5} />
                    <span>Pick-List</span>
                  </button>
                  <button 
                    onClick={() => exportManifestToCSV(manifestData, 'flipkart')} 
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-semibold text-[10px] transition-all duration-200 btn-lift ${
                      darkMode 
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700' 
                        : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <FileSpreadsheet size={11} strokeWidth={2.5} />
                    <span>Manifest</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── Feature Guide (Compact) ─── */}
        <div className={`${card} px-3 py-2.5 rounded-xl border shadow-sm`}>
          <div className="flex items-start gap-2">
            <Info size={11} className="text-indigo-500 shrink-0 mt-0.5" strokeWidth={2.5} />
            <p className={`text-[10px] leading-relaxed ${mutedText}`}>{hoveredTip}</p>
          </div>
        </div>

        {/* ─── AD SPOT (Left bottom - empty) ─── */}
        <div className={`h-20 rounded-xl border border-dashed ${darkMode ? 'border-slate-800 bg-slate-950/20' : 'border-slate-200 bg-slate-50/30'}`}></div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          RIGHT COLUMN — STICKY PREVIEW (7 cols)
          ═══════════════════════════════════════════════════════════ */}
      <div className="lg:col-span-7 flex flex-col gap-3 lg:sticky lg:top-24 preview-fade">
        
        {/* ─── AD SPOT (Right top - empty) ─── */}
        <div className={`h-14 rounded-xl border border-dashed ${darkMode ? 'border-slate-800 bg-slate-950/20' : 'border-slate-200 bg-slate-50/30'}`}></div>

        {/* ─── PREVIEW CARD ─── */}
        <div className={`${card} flex flex-col gap-3 border rounded-2xl p-4 shadow-sm`}>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
                <Layers size={14} className="text-indigo-500" strokeWidth={2.5} />
              </div>
              <h2 className={cardHeader}>Live Preview</h2>
            </div>
            {inputBytes && (
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                Page 1
              </span>
            )}
          </div>

          {/* Preview Area */}
          <div className={`rounded-xl flex items-center justify-center p-4 overflow-hidden ${
            darkMode 
              ? 'bg-slate-950/50 border border-slate-800/80' 
              : 'bg-slate-50/70 border border-slate-200/80'
          }`} style={{ minHeight: '420px' }}>
            <canvas 
              ref={canvasRef} 
              className={`max-w-full max-h-[480px] object-contain rounded-lg transition-all duration-500 ${
                files.length > 0 
                  ? `opacity-100 shadow-[0_8px_28px_-8px_rgba(0,0,0,0.15)] ${canvasJustRendered ? 'canvas-glow' : ''}` 
                  : 'opacity-0 pointer-events-none'
              }`} 
            />
            {files.length === 0 && (
              <div className="flex flex-col items-center gap-2 text-center">
                <div className={`p-4 rounded-2xl subtle-float ${darkMode ? 'bg-slate-900' : 'bg-white shadow-sm'}`}>
                  <Layers size={28} className={mutedText} strokeWidth={1.5} />
                </div>
                <p className={`text-[11px] font-medium ${mutedText}`}>No document uploaded yet</p>
              </div>
            )}
          </div>
        </div>

        {/* ─── AD SPOT (Below preview - empty) ─── */}
        <div className={`h-16 rounded-xl border border-dashed ${darkMode ? 'border-slate-800 bg-slate-950/20' : 'border-slate-200 bg-slate-50/30'}`}></div>
      </div>

    </div>
  );
}