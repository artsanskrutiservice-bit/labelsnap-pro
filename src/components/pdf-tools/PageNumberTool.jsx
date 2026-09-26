import React, { useState } from 'react';
import ToolHeroUploader from './ToolHeroUploader';
import { addPageNumbers } from '../../utils/pdfToolsEngine';
import { PDFDocument } from 'pdf-lib';
import { 
  Hash, 
  ArrowLeft, 
  Download, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Type 
} from 'lucide-react';

export default function PageNumberTool({ darkMode = true, onBack }) {
  const [file, setFile] = useState(null);
  const [fileBytes, setFileBytes] = useState(null);
  const [pageCount, setPageCount] = useState(0);

  // Settings State
  const [position, setPosition] = useState('bottom-center'); // 'bottom-left' | 'bottom-center' | 'bottom-right'
  const [startFrom, setStartFrom] = useState(1);
  const [fontSize, setFontSize] = useState(10);

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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
    } catch (err) {
      setErrorMessage('Could not load PDF file. Please ensure it is not corrupt or password-protected.');
    }
  };

  const handleApplyNumbers = async () => {
    if (!fileBytes) return;
    setIsProcessing(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const numberedBytes = await addPageNumbers(fileBytes, {
        position,
        fontSize: Number(fontSize) || 10,
        startFrom: Number(startFrom) || 1,
      });

      const blob = new Blob([numberedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `numbered-${file.name}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);

      setSuccessMessage(`Page numbers added successfully to all ${pageCount} pages!`);
    } catch (err) {
      setErrorMessage('Failed to add page numbers.');
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

      {!file ? (
        <ToolHeroUploader
          title="Page Numbers in PDF"
          subtitle="Add page numbers into PDF documents easily with precise positioning and formatting."
          buttonText="Select PDF file"
          multiple={false}
          darkMode={darkMode}
          onFilesSelected={handleFileSelected}
        />
      ) : (
        <div className={`p-6 rounded-3xl border shadow-xl flex flex-col gap-6 ${
          darkMode ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          {/* File Overview Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/60">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20">
                <Hash size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold">{file.name}</h2>
                <p className="text-xs text-slate-400">
                  Total {pageCount} Page(s) • {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Visual Page Preview Indicator */}
            <div className="md:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl border border-dashed border-slate-700/80 bg-slate-950/40 min-h-[260px]">
              <div className="relative w-40 h-52 bg-white rounded-lg shadow-lg border border-slate-300 flex flex-col justify-between p-3">
                <div className="space-y-1.5 opacity-30">
                  <div className="h-2 w-3/4 bg-slate-400 rounded"></div>
                  <div className="h-1.5 w-full bg-slate-300 rounded"></div>
                  <div className="h-1.5 w-5/6 bg-slate-300 rounded"></div>
                  <div className="h-1.5 w-2/3 bg-slate-300 rounded"></div>
                </div>

                {/* Live Preview Location Indicator */}
                <div className={`w-full flex text-[10px] font-bold text-red-600 ${
                  position === 'bottom-left' ? 'justify-start' : position === 'bottom-right' ? 'justify-end' : 'justify-center'
                }`}>
                  <span className="bg-red-50 border border-red-200 px-1.5 py-0.5 rounded shadow-sm">
                    Page {startFrom} of {pageCount}
                  </span>
                </div>
              </div>
              <span className="text-[11px] text-slate-400 mt-3 font-medium">Position Preview</span>
            </div>

            {/* Config Controls */}
            <div className="md:col-span-7 flex flex-col gap-5">
              {/* Position Chooser */}
              <div>
                <label className="text-xs font-bold text-slate-300 mb-2 block">
                  Select Page Number Position
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPosition('bottom-left')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition ${
                      position === 'bottom-left'
                        ? 'border-red-500 bg-red-500/10 text-red-400'
                        : darkMode ? 'border-slate-800 hover:border-slate-700' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <AlignLeft size={16} />
                    <span>Bottom Left</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPosition('bottom-center')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition ${
                      position === 'bottom-center'
                        ? 'border-red-500 bg-red-500/10 text-red-400'
                        : darkMode ? 'border-slate-800 hover:border-slate-700' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <AlignCenter size={16} />
                    <span>Center</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPosition('bottom-right')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition ${
                      position === 'bottom-right'
                        ? 'border-red-500 bg-red-500/10 text-red-400'
                        : darkMode ? 'border-slate-800 hover:border-slate-700' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <AlignRight size={16} />
                    <span>Bottom Right</span>
                  </button>
                </div>
              </div>

              {/* Number Config Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    First Page Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={startFrom}
                    onChange={(e) => setStartFrom(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className={`w-full px-3 py-1.5 rounded-lg border text-sm font-semibold outline-none ${
                      darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    Font Size (pt)
                  </label>
                  <select
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className={`w-full px-3 py-1.5 rounded-lg border text-sm font-semibold outline-none ${
                      darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value={8}>Small (8pt)</option>
                    <option value={10}>Standard (10pt)</option>
                    <option value={12}>Medium (12pt)</option>
                    <option value={14}>Large (14pt)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle size={15} /> <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 size={15} /> <span>{successMessage}</span>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Format: <b>Page X of {pageCount}</b>
            </span>

            <button
              disabled={isProcessing}
              onClick={handleApplyNumbers}
              className={`px-8 py-3.5 rounded-2xl font-black text-sm text-white flex items-center gap-2 shadow-lg transition ${
                isProcessing
                  ? 'bg-slate-700 opacity-50 cursor-not-allowed'
                  : 'bg-[#e5322d] hover:bg-[#c92521] shadow-red-500/20 active:scale-[0.99]'
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={17} className="animate-spin" />
                  <span>Processing Pages...</span>
                </>
              ) : (
                <>
                  <Download size={17} />
                  <span>Add Numbers &amp; Download</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}