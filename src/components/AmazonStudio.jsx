import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, FileText, Download, CheckCircle2, Scissors, Layers, Sparkles, 
  RefreshCw, AlertCircle, Printer, SlidersHorizontal, ArrowUpDown, Info, Tag, 
  ClipboardList, FileSpreadsheet, Files, ChevronDown 
} from 'lucide-react';
import { 
  renderAmazonPreview, processAmazonLabels, mergeMultiplePdfs, 
  generatePickListPDF, exportManifestToCSV 
} from '../utils/amazonProcessor';

export default function AmazonStudio({ darkMode }) {
  const [files, setFiles] = useState([]);
  const [inputBytes, setInputBytes] = useState(null);
  const [outputBytes, setOutputBytes] = useState(null);
  const [manifestData, setManifestData] = useState([]);
  const [status, setStatus] = useState('Upload your Amazon shipping label PDF to begin.');
  const [statusType, setStatusType] = useState('info');
  const [processing, setProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  
  // Amazon Specific Settings
  const [amazonInvoiceMode, setAmazonInvoiceMode] = useState('remove');
  const [amazonSkuMode, setAmazonSkuMode] = useState('id_only');
  const [sortBySku, setSortBySku] = useState(false);
  const [autoDownload, setAutoDownload] = useState(true);
  const [darkenThermal, setDarkenThermal] = useState(false);
  const [brandingText, setBrandingText] = useState('');

  // UI-only states
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showOutputOptions, setShowOutputOptions] = useState(false);

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
  }, [inputBytes, processing, amazonInvoiceMode, amazonSkuMode, sortBySku, brandingText, autoDownload, darkenThermal]);

  useEffect(() => {
    if (inputBytes && canvasRef.current) {
      renderAmazonPreview(inputBytes, canvasRef.current, { darkenThermal }).catch(() => {});
    }
  }, [inputBytes, darkenThermal]);

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
          await renderAmazonPreview(finalBytes, canvasRef.current, { darkenThermal });
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
      const { pdfResultBytes, manifestData: mData } = await processAmazonLabels(
        inputBytes, 
        (current, total) => setProgressText(`Processing label ${current} of ${total}...`),
        { amazonInvoiceMode, amazonSkuMode, sortBySku, brandingText, darkenThermal }
      );

      setOutputBytes(pdfResultBytes);
      setManifestData(mData || []);
      setStatus('Batch completed successfully.');
      setStatusType('ok');

      if (autoDownload) {
        downloadBlob(pdfResultBytes, 'amazon-cropped-batch.pdf');
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
    ? 'bg-slate-900 border-slate-800' 
    : 'bg-white border-slate-200/80';
  
  const cardHeader = 'text-sm font-semibold tracking-tight';

  const mutedText = darkMode ? 'text-slate-400' : 'text-slate-500';

  const sectionLabel = `text-[10px] font-semibold uppercase tracking-[0.08em] ${mutedText}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

      {/* ═══════════════════ LEFT COLUMN: UPLOAD ═══════════════════ */}
      <div className={`lg:col-span-4 flex flex-col gap-4 border rounded-2xl p-5 shadow-sm ${card}`}>
        
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
              onMouseEnter={() => setHoveredTip('Toggle output actions: Download, Print, Pick-List, and Manifest CSV.')}
              className={`text-[11px] font-medium flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                showOutputOptions 
                  ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400' 
                  : `${mutedText} hover:text-indigo-600 dark:hover:text-indigo-400`
              }`}
            >
              {showOutputOptions ? 'Less' : 'More'}
              <ChevronDown size={12} className={`transition-transform duration-200 ${showOutputOptions ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>

        {/* Drop zone */}
        <label className={`group border border-dashed rounded-xl p-7 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 ${
          darkMode 
            ? 'border-slate-700 hover:border-indigo-500/60 bg-slate-950/30 hover:bg-indigo-500/[0.03]' 
            : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/40'
        }`}>
          <input ref={fileInputRef} type="file" accept="application/pdf" multiple className="hidden" onChange={handleFileChange} />
          <div className={`p-3 rounded-xl transition-all duration-200 ${
            darkMode 
              ? 'bg-slate-800 group-hover:bg-indigo-500/10 text-slate-400 group-hover:text-indigo-400' 
              : 'bg-white shadow-sm group-hover:bg-indigo-50 text-slate-400 group-hover:text-indigo-500'
          }`}>
            <Upload size={20} strokeWidth={2} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">Choose Label PDF</p>
            <p className={`text-[11px] mt-0.5 ${mutedText}`}>or drag &amp; drop here</p>
          </div>
        </label>

        {/* File badge */}
        {files.length > 0 && (
          <div className={`px-3 py-2.5 rounded-xl border flex items-center justify-between ${darkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200/80'}`}>
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-emerald-500/10">
                <Files size={12} className="text-emerald-500" strokeWidth={2.5} />
              </div>
              <span className="text-xs font-medium">{files.length} document{files.length > 1 ? 's' : ''} loaded</span>
            </div>
            <button 
              onClick={clearAll} 
              className="text-[11px] font-medium text-rose-500 hover:text-rose-600 transition"
            >
              Clear
            </button>
          </div>
        )}

        {/* Status */}
        <div className={`px-3 py-2.5 rounded-xl border flex items-center gap-2.5 text-xs font-medium transition-all ${
          statusType === 'ok' 
            ? 'bg-emerald-50 border-emerald-200/70 text-emerald-700 dark:bg-emerald-500/[0.06] dark:border-emerald-500/20 dark:text-emerald-400' 
            : statusType === 'warn' 
            ? 'bg-amber-50 border-amber-200/70 text-amber-700 dark:bg-amber-500/[0.06] dark:border-amber-500/20 dark:text-amber-400' 
            : darkMode 
            ? 'bg-slate-800/40 border-slate-800 text-slate-300' 
            : 'bg-slate-50 border-slate-200/80 text-slate-600'
        }`}>
          {statusType === 'ok' ? (
            <CheckCircle2 size={14} className="shrink-0" strokeWidth={2.5} />
          ) : statusType === 'warn' ? (
            <AlertCircle size={14} className="shrink-0" strokeWidth={2.5} />
          ) : (
            <Sparkles size={14} className="shrink-0" strokeWidth={2.5} />
          )}
          <span className="leading-snug">{processing ? progressText : status}</span>
        </div>

        {/* Primary action */}
        <button 
          disabled={!inputBytes || processing} 
          onClick={handleCrop} 
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${
            !inputBytes || processing 
              ? darkMode
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md active:scale-[0.99]'
          }`}
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

        {/* Output actions — behind More toggle */}
        {outputBytes && showOutputOptions && (
          <div className={`flex flex-col gap-2 pt-4 border-t ${darkMode ? 'border-slate-800' : 'border-slate-200/80'}`}>
            <div className="flex gap-2">
              <button 
                onClick={() => downloadBlob(outputBytes, `amazon-cropped-batch.pdf`)} 
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-semibold text-xs transition-all duration-200 ${
                  darkMode 
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-100' 
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                <Download size={14} strokeWidth={2.5} />
                <span>Download</span>
              </button>
              <button 
                onClick={handlePrint} 
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-semibold text-xs transition-all duration-200 ${
                  darkMode 
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700' 
                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                }`}
              >
                <Printer size={14} strokeWidth={2.5} />
                <span>Print</span>
              </button>
            </div>

            {manifestData.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => generatePickListPDF(manifestData, 'amazon').then(b => downloadBlob(b, 'amazon-picklist.pdf'))} 
                  className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl font-semibold text-[11px] transition-all duration-200 ${
                    darkMode 
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700' 
                      : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                  }`}
                >
                  <ClipboardList size={12} strokeWidth={2.5} />
                  <span>Pick-List</span>
                </button>
                <button 
                  onClick={() => exportManifestToCSV(manifestData, 'amazon')} 
                  className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl font-semibold text-[11px] transition-all duration-200 ${
                    darkMode 
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700' 
                      : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                  }`}
                >
                  <FileSpreadsheet size={12} strokeWidth={2.5} />
                  <span>Manifest</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════ CENTER COLUMN: PREVIEW ═══════════════════ */}
      <div className={`lg:col-span-5 flex flex-col gap-4 border rounded-2xl p-5 shadow-sm min-h-[500px] ${card}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
              <Layers size={14} className="text-indigo-500" strokeWidth={2.5} />
            </div>
            <h2 className={cardHeader}>Live Preview</h2>
          </div>
          {inputBytes && (
            <span className={`text-[10px] font-medium px-2 py-1 rounded-md ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
              Page 1
            </span>
          )}
        </div>

        <div className={`flex-1 rounded-xl flex items-center justify-center p-6 overflow-hidden ${
          darkMode 
            ? 'bg-slate-950/50 border border-slate-800/80' 
            : 'bg-slate-50/70 border border-slate-200/80'
        }`}>
          <canvas 
            ref={canvasRef} 
            className={`max-w-full max-h-[420px] object-contain rounded-lg transition-all duration-300 ${
              files.length > 0 
                ? 'opacity-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)]' 
                : 'opacity-0 pointer-events-none'
            }`} 
          />
          {files.length === 0 && (
            <div className="flex flex-col items-center gap-3 text-center">
              <div className={`p-4 rounded-2xl ${darkMode ? 'bg-slate-900' : 'bg-white shadow-sm'}`}>
                <Layers size={28} className={mutedText} strokeWidth={1.5} />
              </div>
              <p className={`text-xs font-medium ${mutedText}`}>No document uploaded yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════ RIGHT COLUMN: SETTINGS ═══════════════════ */}
      <div className={`lg:col-span-3 flex flex-col gap-4 border rounded-2xl p-5 shadow-sm ${card}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
              <SlidersHorizontal size={14} className="text-indigo-500" strokeWidth={2.5} />
            </div>
            <h2 className={cardHeader}>Settings</h2>
          </div>
          <button
            type="button"
            onClick={() => setShowMoreOptions(!showMoreOptions)}
            onMouseEnter={() => setHoveredTip('Show advanced options: SKU Style, Darken Barcode, and Custom Branding.')}
            className={`text-[11px] font-medium flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
              showMoreOptions 
                ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400' 
                : `${mutedText} hover:text-indigo-600 dark:hover:text-indigo-400`
            }`}
          >
            {showMoreOptions ? 'Less' : 'More'}
            <ChevronDown size={12} className={`transition-transform duration-200 ${showMoreOptions ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Normal options */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className={sectionLabel}>Invoice Handling</span>
            <div className="grid grid-cols-2 gap-2">
              <button 
                type="button" 
                onMouseEnter={() => setHoveredTip('Remove Invoice: Strips out the customer invoice page.')} 
                onClick={() => setAmazonInvoiceMode('remove')} 
                className={`px-3 py-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all duration-200 ${
                  amazonInvoiceMode === 'remove' 
                    ? darkMode
                      ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400'
                      : 'border-indigo-500 bg-indigo-50 text-indigo-600'
                    : darkMode 
                      ? 'border-slate-800 text-slate-300 hover:border-slate-700' 
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <span>Remove</span>
              </button>
              <button 
                type="button" 
                onMouseEnter={() => setHoveredTip('Keep Invoice: Preserves the customer invoice behind each label.')} 
                onClick={() => setAmazonInvoiceMode('keep')} 
                className={`px-3 py-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all duration-200 ${
                  amazonInvoiceMode === 'keep' 
                    ? darkMode
                      ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400'
                      : 'border-indigo-500 bg-indigo-50 text-indigo-600'
                    : darkMode 
                      ? 'border-slate-800 text-slate-300 hover:border-slate-700' 
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <span>Keep</span>
              </button>
            </div>
          </div>

          <button 
            type="button" 
            onMouseEnter={() => setHoveredTip('Automatically download the cropped PDF when processing finishes.')} 
            onClick={() => setAutoDownload(!autoDownload)} 
            className={`px-3 py-2.5 rounded-xl border text-xs font-medium flex items-center justify-between transition-all duration-200 ${
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
              <Download size={13} strokeWidth={2.5} />
              <span>Auto Download</span>
            </span>
            {autoDownload && <CheckCircle2 size={13} strokeWidth={2.5} />}
          </button>
        </div>

        {/* Advanced options */}
        {showMoreOptions && (
          <div className={`flex flex-col gap-3 pt-4 border-t ${darkMode ? 'border-slate-800' : 'border-slate-200/80'}`}>
            <span className={sectionLabel}>Advanced</span>

            <div className="flex flex-col gap-2">
              <span className={sectionLabel}>SKU Header Style</span>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  type="button" 
                  onMouseEnter={() => setHoveredTip('Print only the SKU ID code on the label header.')} 
                  onClick={() => setAmazonSkuMode('id_only')} 
                  className={`px-2.5 py-2 rounded-lg border text-[11px] font-medium transition-all duration-200 ${
                    amazonSkuMode === 'id_only' 
                      ? darkMode
                        ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400'
                        : 'border-indigo-500 bg-indigo-50 text-indigo-600'
                      : darkMode 
                        ? 'border-slate-800 text-slate-300 hover:border-slate-700' 
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  SKU ID Only
                </button>
                <button 
                  type="button" 
                  onMouseEnter={() => setHoveredTip('Print SKU ID along with product description.')} 
                  onClick={() => setAmazonSkuMode('with_desc')} 
                  className={`px-2.5 py-2 rounded-lg border text-[11px] font-medium transition-all duration-200 ${
                    amazonSkuMode === 'with_desc' 
                      ? darkMode
                        ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400'
                        : 'border-indigo-500 bg-indigo-50 text-indigo-600'
                      : darkMode 
                        ? 'border-slate-800 text-slate-300 hover:border-slate-700' 
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  With Description
                </button>
              </div>
            </div>

            <button 
              type="button" 
              onMouseEnter={() => setHoveredTip('Group same SKU orders together for faster picking.')} 
              onClick={() => setSortBySku(!sortBySku)} 
              className={`px-3 py-2.5 rounded-xl border text-xs font-medium flex items-center justify-between transition-all duration-200 ${
                sortBySku 
                  ? darkMode
                    ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400'
                    : 'border-indigo-500 bg-indigo-50 text-indigo-600'
                  : darkMode 
                    ? 'border-slate-800 text-slate-300 hover:border-slate-700' 
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <ArrowUpDown size={13} strokeWidth={2.5} />
                <span>SKU-Wise Sorting</span>
              </span>
              {sortBySku && <CheckCircle2 size={13} strokeWidth={2.5} />}
            </button>

            <button 
              type="button" 
              onMouseEnter={() => setHoveredTip('Increase barcode contrast for thermal printers.')} 
              onClick={() => setDarkenThermal(!darkenThermal)} 
              className={`px-3 py-2.5 rounded-xl border text-xs font-medium flex items-center justify-between transition-all duration-200 ${
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
                <Printer size={13} strokeWidth={2.5} />
                <span>Darken Barcode</span>
              </span>
              {darkenThermal && <CheckCircle2 size={13} strokeWidth={2.5} />}
            </button>

            <div 
              className="flex flex-col gap-2" 
              onMouseEnter={() => setHoveredTip('Add custom text at the bottom of each label.')}
            >
              <span className={sectionLabel}>Custom Branding</span>
              <input 
                id="custom-brand-amazon"
                type="text" 
                value={brandingText} 
                onChange={(e) => setBrandingText(e.target.value)} 
                placeholder="Thank you for your order!" 
                className={`w-full px-3 py-2.5 text-xs rounded-xl border outline-none transition-all duration-200 ${
                  darkMode 
                    ? 'bg-slate-950/50 border-slate-800 focus:border-indigo-500/60 text-slate-200 placeholder:text-slate-600' 
                    : 'bg-slate-50/50 border-slate-200 focus:border-indigo-400 focus:bg-white text-slate-800 placeholder:text-slate-400'
                }`} 
              />
            </div>
          </div>
        )}

        {/* Feature guide */}
        <div className={`mt-auto px-3 py-3 rounded-xl border ${darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50/70 border-slate-200/80'}`}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Info size={11} className="text-indigo-500" strokeWidth={2.5} />
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-indigo-500">Guide</span>
          </div>
          <p className={`text-[11px] leading-relaxed ${mutedText}`}>{hoveredTip}</p>
        </div>
      </div>
    </div>
  );
}