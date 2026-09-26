import React, { useState } from 'react';
import ToolHeroUploader from './ToolHeroUploader';
import { 
  cropPdfCustom, 
  rotatePdfPages, 
  removePdfPages, 
  addPageNumbers, 
  parsePageRangeString 
} from '../../utils/pdfToolsEngine';
import { PDFDocument } from 'pdf-lib';
import { 
  Sparkles, 
  ArrowLeft, 
  Download, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Crop, 
  RotateCw, 
  Trash2, 
  Hash, 
  Check,
  Layers
} from 'lucide-react';

export default function MultiPipelineTool({ darkMode = true, onBack }) {
  const [file, setFile] = useState(null);
  const [fileBytes, setFileBytes] = useState(null);
  const [pageCount, setPageCount] = useState(0);

  // Pipeline Configuration States
  // 1. Crop
  const [cropEnabled, setCropEnabled] = useState(true);
  const [cropPreset, setCropPreset] = useState('top_half'); // 'top_half' | 'bottom_half' | 'center' | 'full'

  // 2. Rotate
  const [rotateEnabled, setRotateEnabled] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(90); // 90 | 180 | 270

  // 3. Remove Pages
  const [removeEnabled, setRemoveEnabled] = useState(false);
  const [removeInput, setRemoveInput] = useState(''); // e.g. "2, 4"

  // 4. Page Numbers
  const [numbersEnabled, setNumbersEnabled] = useState(false);
  const [numberPosition, setNumberPosition] = useState('bottom-center');

  // Status
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
      setErrorMessage('Could not load PDF. Please make sure the file is valid.');
    }
  };

  const getCropBoxFromPreset = (preset) => {
    switch (preset) {
      case 'top_half':
        return { x: 0, y: 0.5, width: 1, height: 0.5 };
      case 'bottom_half':
        return { x: 0, y: 0, width: 1, height: 0.5 };
      case 'center':
        return { x: 0.1, y: 0.2, width: 0.8, height: 0.6 };
      case 'full':
      default:
        return { x: 0, y: 0, width: 1, height: 1 };
    }
  };

  // Run all active pipeline actions in a single chained flow
  const handleExecutePipeline = async () => {
    if (!fileBytes) return;
    setIsProcessing(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      let currentBytes = fileBytes;

      // 1. Remove Pages first (so subsequent steps only process kept pages)
      if (removeEnabled && removeInput.trim()) {
        const indicesToRemove = parsePageRangeString(removeInput, pageCount);
        if (indicesToRemove.length >= pageCount) {
          throw new Error('Cannot remove all pages. At least one page must remain.');
        }
        if (indicesToRemove.length > 0) {
          currentBytes = await removePdfPages(currentBytes, indicesToRemove);
        }
      }

      // 2. Rotate Pages
      if (rotateEnabled && rotationAngle !== 0) {
        currentBytes = await rotatePdfPages(currentBytes, rotationAngle);
      }

      // 3. Custom Crop
      if (cropEnabled && cropPreset !== 'full') {
        const cropBox = getCropBoxFromPreset(cropPreset);
        currentBytes = await cropPdfCustom(currentBytes, cropBox);
      }

      // 4. Add Page Numbers
      if (numbersEnabled) {
        currentBytes = await addPageNumbers(currentBytes, {
          position: numberPosition,
          fontSize: 10,
        });
      }

      // Download final processed document
      const blob = new Blob([currentBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pipeline-${file.name}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);

      setSuccessMessage('Pipeline executed successfully! Download started.');
    } catch (err) {
      setErrorMessage(err.message || 'Error occurred while running the pipeline.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Top Navigation */}
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
          title="All-in-One Multi Studio"
          subtitle="Crop, rotate, remove redundant pages, and add page numbers in a single automated pass."
          buttonText="Select PDF for Multi-Studio"
          multiple={false}
          darkMode={darkMode}
          onFilesSelected={handleFileSelected}
        />
      ) : (
        <div className={`p-6 rounded-3xl border shadow-xl flex flex-col gap-6 ${
          darkMode ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          {/* File Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/60">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20">
                <Sparkles size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold">{file.name}</h2>
                <p className="text-xs text-slate-400">
                  Total {pageCount} Page(s) • {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Pipeline Step Toggles */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              {/* Step 1: Crop Module */}
              <div className={`p-4 rounded-2xl border transition ${
                cropEnabled 
                  ? darkMode ? 'border-red-500/40 bg-red-500/5' : 'border-red-300 bg-red-50/50'
                  : darkMode ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Crop size={16} className={cropEnabled ? 'text-red-500' : 'text-slate-500'} />
                    <span className="text-xs font-bold">1. Region Crop</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={cropEnabled}
                    onChange={(e) => setCropEnabled(e.target.checked)}
                    className="w-4 h-4 accent-red-500 cursor-pointer"
                  />
                </div>

                {cropEnabled && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {['top_half', 'bottom_half', 'center', 'full'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setCropPreset(p)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition ${
                          cropPreset === p
                            ? 'border-red-500 bg-red-500/15 text-red-400'
                            : darkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white'
                        }`}
                      >
                        {p.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Step 2: Rotate Module */}
              <div className={`p-4 rounded-2xl border transition ${
                rotateEnabled 
                  ? darkMode ? 'border-red-500/40 bg-red-500/5' : 'border-red-300 bg-red-50/50'
                  : darkMode ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <RotateCw size={16} className={rotateEnabled ? 'text-red-500' : 'text-slate-500'} />
                    <span className="text-xs font-bold">2. Rotate Pages</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={rotateEnabled}
                    onChange={(e) => setRotateEnabled(e.target.checked)}
                    className="w-4 h-4 accent-red-500 cursor-pointer"
                  />
                </div>

                {rotateEnabled && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {[
                      { label: '90° Right', val: 90 },
                      { label: '180° Flip', val: 180 },
                      { label: '90° Left', val: 270 },
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => setRotationAngle(item.val)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                          rotationAngle === item.val
                            ? 'border-red-500 bg-red-500/15 text-red-400'
                            : darkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Step 3: Remove Specific Pages */}
              <div className={`p-4 rounded-2xl border transition ${
                removeEnabled 
                  ? darkMode ? 'border-red-500/40 bg-red-500/5' : 'border-red-300 bg-red-50/50'
                  : darkMode ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Trash2 size={16} className={removeEnabled ? 'text-red-500' : 'text-slate-500'} />
                    <span className="text-xs font-bold">3. Remove Redundant Pages</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={removeEnabled}
                    onChange={(e) => setRemoveEnabled(e.target.checked)}
                    className="w-4 h-4 accent-red-500 cursor-pointer"
                  />
                </div>

                {removeEnabled && (
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="e.g. 2, 4 (Pages to delete)"
                      value={removeInput}
                      onChange={(e) => setRemoveInput(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${
                        darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300'
                      }`}
                    />
                  </div>
                )}
              </div>

              {/* Step 4: Page Numbering */}
              <div className={`p-4 rounded-2xl border transition ${
                numbersEnabled 
                  ? darkMode ? 'border-red-500/40 bg-red-500/5' : 'border-red-300 bg-red-50/50'
                  : darkMode ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Hash size={16} className={numbersEnabled ? 'text-red-500' : 'text-slate-500'} />
                    <span className="text-xs font-bold">4. Add Page Numbers</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={numbersEnabled}
                    onChange={(e) => setNumbersEnabled(e.target.checked)}
                    className="w-4 h-4 accent-red-500 cursor-pointer"
                  />
                </div>

                {numbersEnabled && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {['bottom-center', 'bottom-right'].map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setNumberPosition(pos)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition ${
                          numberPosition === pos
                            ? 'border-red-500 bg-red-500/15 text-red-400'
                            : darkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white'
                        }`}
                      >
                        {pos.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Live Pipeline Summary */}
            <div className={`lg:col-span-5 p-5 rounded-2xl border flex flex-col gap-4 ${
              darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-red-500" />
                <h3 className="text-sm font-extrabold">Active Pipeline Order</h3>
              </div>

              <div className="flex flex-col gap-2 text-xs">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/50 border border-slate-800">
                  <Check size={14} className={cropEnabled ? 'text-emerald-400' : 'text-slate-600'} />
                  <span>Crop: <b>{cropEnabled ? cropPreset.replace('_', ' ') : 'Disabled'}</b></span>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/50 border border-slate-800">
                  <Check size={14} className={rotateEnabled ? 'text-emerald-400' : 'text-slate-600'} />
                  <span>Rotate: <b>{rotateEnabled ? `${rotationAngle}°` : 'Disabled'}</b></span>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/50 border border-slate-800">
                  <Check size={14} className={removeEnabled ? 'text-emerald-400' : 'text-slate-600'} />
                  <span>Delete Pages: <b>{removeEnabled && removeInput ? removeInput : 'None'}</b></span>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/50 border border-slate-800">
                  <Check size={14} className={numbersEnabled ? 'text-emerald-400' : 'text-slate-600'} />
                  <span>Page Numbers: <b>{numbersEnabled ? numberPosition : 'Disabled'}</b></span>
                </div>
              </div>

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

              <button
                disabled={isProcessing}
                onClick={handleExecutePipeline}
                className={`w-full py-4 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 shadow-lg transition mt-2 ${
                  isProcessing
                    ? 'bg-slate-700 opacity-50 cursor-not-allowed'
                    : 'bg-[#e5322d] hover:bg-[#c92521] shadow-red-500/20 active:scale-[0.99]'
                }`}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw size={17} className="animate-spin" />
                    <span>Executing Pipeline...</span>
                  </>
                ) : (
                  <>
                    <Download size={17} />
                    <span>Run Multi-Tool &amp; Download</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}