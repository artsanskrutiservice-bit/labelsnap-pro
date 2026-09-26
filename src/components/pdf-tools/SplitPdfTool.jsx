import React, { useState } from 'react';
import ToolHeroUploader from './ToolHeroUploader';
import { splitPdfByRange, splitAllPagesIndividually } from '../../utils/pdfToolsEngine';
import { PDFDocument } from 'pdf-lib';
import { 
  Scissors, 
  ArrowLeft, 
  Download, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  Layers 
} from 'lucide-react';

export default function SplitPdfTool({ darkMode = true, onBack }) {
  const [file, setFile] = useState(null);
  const [fileBytes, setFileBytes] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [splitMode, setSplitMode] = useState('range'); // 'range' | 'all'
  const [rangeInput, setRangeInput] = useState('1');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Handle uploaded file
  const handleFileSelected = async (files) => {
    if (!files || files.length === 0) return;
    const selected = files[0];
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const buffer = await selected.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const doc = await PDFDocument.load(bytes);
      const total = doc.getPageCount();

      setFile(selected);
      setFileBytes(bytes);
      setPageCount(total);
      setRangeInput(total > 1 ? `1-${Math.min(2, total)}` : '1');
    } catch (err) {
      setErrorMessage('Could not load PDF. Please ensure the file is valid and not password protected.');
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

  const handleSplitAction = async () => {
    if (!fileBytes) return;
    setIsProcessing(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (splitMode === 'range') {
        const resultBytes = await splitPdfByRange(fileBytes, rangeInput);
        downloadBlob(resultBytes, `split-${file.name}`);
        setSuccessMessage(`Pages (${rangeInput}) extracted successfully!`);
      } else {
        const individualPages = await splitAllPagesIndividually(fileBytes);
        individualPages.forEach((item) => {
          downloadBlob(item.bytes, `page-${item.pageNumber}-${file.name}`);
        });
        setSuccessMessage(`All ${individualPages.length} pages split into separate PDF files!`);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error occurred while splitting PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl border transition ${
            darkMode
              ? 'border-slate-800 text-slate-300 hover:bg-slate-800'
              : 'border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <ArrowLeft size={14} />
          <span>Back to Studio</span>
        </button>

        {file && (
          <button
            onClick={() => { setFile(null); setFileBytes(null); }}
            className="text-xs font-semibold text-rose-400 hover:underline"
          >
            Change File
          </button>
        )}
      </div>

      {/* Screen 1: Uploader */}
      {!file ? (
        <ToolHeroUploader
          title="Split PDF file"
          subtitle="Separate one page or a whole set for easy conversion into independent PDF files."
          buttonText="Select PDF file"
          multiple={false}
          darkMode={darkMode}
          onFilesSelected={handleFileSelected}
        />
      ) : (
        /* Screen 2: Split Controls */
        <div className={`p-6 rounded-3xl border shadow-xl flex flex-col gap-6 ${
          darkMode ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/60">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20">
                <Scissors size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold">{file.name}</h2>
                <p className="text-xs text-slate-400">Total {pageCount} Page(s) • {(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            </div>
          </div>

          {/* Split Mode Chooser */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSplitMode('range')}
              className={`p-4 rounded-2xl border text-left flex flex-col gap-1 transition ${
                splitMode === 'range'
                  ? 'border-red-500 bg-red-500/10 text-red-400'
                  : darkMode ? 'border-slate-800 hover:border-slate-700' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-sm">
                <span className="flex items-center gap-2">
                  <FileText size={16} /> Split by Custom Range
                </span>
                {splitMode === 'range' && <CheckCircle2 size={16} />}
              </div>
              <p className="text-xs text-slate-400 mt-1">Extract specific page sets (e.g. 1-3, 5, 8-10).</p>
            </button>

            <button
              type="button"
              onClick={() => setSplitMode('all')}
              className={`p-4 rounded-2xl border text-left flex flex-col gap-1 transition ${
                splitMode === 'all'
                  ? 'border-red-500 bg-red-500/10 text-red-400'
                  : darkMode ? 'border-slate-800 hover:border-slate-700' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-sm">
                <span className="flex items-center gap-2">
                  <Layers size={16} /> Extract Every Page
                </span>
                {splitMode === 'all' && <CheckCircle2 size={16} />}
              </div>
              <p className="text-xs text-slate-400 mt-1">Turns every page into a standalone single-page PDF.</p>
            </button>
          </div>

          {/* Range Input Field */}
          {splitMode === 'range' && (
            <div className={`p-4 rounded-2xl border flex flex-col gap-2 ${
              darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <label className="text-xs font-bold text-slate-300">
                Enter Page Ranges (Max: {pageCount})
              </label>
              <input
                type="text"
                value={rangeInput}
                onChange={(e) => setRangeInput(e.target.value)}
                placeholder="Example: 1-2, 4"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition ${
                  darkMode ? 'bg-slate-900 border-slate-700 focus:border-red-500 text-white' : 'bg-white border-slate-300 focus:border-red-500 text-slate-900'
                }`}
              />
              <span className="text-[11px] text-slate-400">
                Tip: Use dashes for consecutive pages (1-3) and commas for individual pages (5, 7).
              </span>
            </div>
          )}

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 size={15} className="shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2 flex justify-end">
            <button
              disabled={isProcessing}
              onClick={handleSplitAction}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2.5 shadow-lg transition ${
                isProcessing
                  ? 'bg-slate-700 opacity-50 cursor-not-allowed'
                  : 'bg-[#e5322d] hover:bg-[#c92521] shadow-red-500/20 active:scale-[0.99]'
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={17} className="animate-spin" />
                  <span>Splitting PDF...</span>
                </>
              ) : (
                <>
                  <Scissors size={17} />
                  <span>Split &amp; Download</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}