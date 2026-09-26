import React, { useState } from 'react';
import ToolHeroUploader from './ToolHeroUploader';
import { removePdfPages } from '../../utils/pdfToolsEngine';
import * as pdfjsLib from 'pdfjs-dist';
import { 
  Trash2, 
  ArrowLeft, 
  Download, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Undo2 
} from 'lucide-react';

export default function RemovePagesTool({ darkMode = true, onBack }) {
  const [file, setFile] = useState(null);
  const [fileBytes, setFileBytes] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [thumbnails, setThumbnails] = useState([]);
  const [markedToRemove, setMarkedToRemove] = useState(new Set());
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const generateThumbnails = async (bytes) => {
    setIsLoadingPages(true);
    try {
      const loadingTask = pdfjsLib.getDocument({ data: bytes.slice(0) });
      const pdf = await loadingTask.promise;
      const count = pdf.numPages;
      setPageCount(count);

      const thumbs = [];
      for (let i = 1; i <= count; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.35 });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: ctx, viewport }).promise;
        thumbs.push(canvas.toDataURL('image/jpeg', 0.8));
      }

      setThumbnails(thumbs);
    } catch (err) {
      console.error('Thumbnail generation error:', err);
      setErrorMessage('Failed to generate page previews.');
    } finally {
      setIsLoadingPages(false);
    }
  };

  const handleFileSelected = async (files) => {
    if (!files || files.length === 0) return;
    const selected = files[0];
    setErrorMessage('');
    setSuccessMessage('');
    setThumbnails([]);
    setMarkedToRemove(new Set());

    try {
      const buffer = await selected.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      setFile(selected);
      setFileBytes(bytes);
      await generateThumbnails(bytes);
    } catch (err) {
      setErrorMessage('Could not load PDF file.');
    }
  };

  const togglePageRemoval = (pageIdx) => {
    setMarkedToRemove((prev) => {
      const next = new Set(prev);
      if (next.has(pageIdx)) {
        next.delete(pageIdx);
      } else {
        if (next.size + 1 >= pageCount) {
          setErrorMessage('You must keep at least one page in the document.');
          return prev;
        }
        next.add(pageIdx);
      }
      return next;
    });
  };

  const handleRemoveAction = async () => {
    if (!fileBytes) return;
    if (markedToRemove.size === 0) {
      setErrorMessage('Please click on at least one page to delete.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const targetIndices = Array.from(markedToRemove);
      const remainingBytes = await removePdfPages(fileBytes, targetIndices);
      const blob = new Blob([remainingBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `pages-removed-${file.name}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);

      setSuccessMessage(`${markedToRemove.size} page(s) deleted and new PDF downloaded!`);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to remove pages.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 max-w-6xl mx-auto">
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
            onClick={() => { setFile(null); setFileBytes(null); setThumbnails([]); setMarkedToRemove(new Set()); }}
            className="text-xs font-semibold text-rose-400 hover:underline"
          >
            Change File
          </button>
        )}
      </div>

      {!file ? (
        <ToolHeroUploader
          title="Remove PDF pages"
          subtitle="Delete unwanted pages, blank sheets, or redundant invoice pages from your PDF file."
          buttonText="Select PDF file"
          multiple={false}
          darkMode={darkMode}
          onFilesSelected={handleFileSelected}
        />
      ) : (
        <div className={`p-6 rounded-3xl border shadow-xl flex flex-col gap-6 ${
          darkMode ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/60">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Trash2 size={20} className="text-red-500" />
                <span>{file.name}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Click on any page thumbnail to mark it for deletion. ({markedToRemove.size} selected to delete)
              </p>
            </div>

            {markedToRemove.size > 0 && (
              <button
                type="button"
                onClick={() => setMarkedToRemove(new Set())}
                className="px-3.5 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 transition self-start sm:self-auto"
              >
                <Undo2 size={13} />
                <span>Reset All</span>
              </button>
            )}
          </div>

          {/* Loading Pages Spinner */}
          {isLoadingPages && (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw size={28} className="animate-spin text-red-500" />
              <span className="text-xs font-semibold">Generating page thumbnails...</span>
            </div>
          )}

          {/* Thumbnails Grid */}
          {!isLoadingPages && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[500px] overflow-y-auto p-1">
              {thumbnails.map((thumbUrl, idx) => {
                const isSelected = markedToRemove.has(idx);
                return (
                  <div
                    key={idx}
                    onClick={() => togglePageRemoval(idx)}
                    className={`group relative p-2.5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col items-center gap-2 ${
                      isSelected
                        ? 'border-red-500 bg-red-500/10 scale-[0.97]'
                        : darkMode
                        ? 'border-slate-800 bg-slate-950/70 hover:border-slate-600'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-400'
                    }`}
                  >
                    <div className="relative w-full aspect-[3/4] bg-white rounded-lg overflow-hidden flex items-center justify-center shadow-inner">
                      <img
                        src={thumbUrl}
                        alt={`Page ${idx + 1}`}
                        className={`max-w-full max-h-full object-contain transition-opacity ${
                          isSelected ? 'opacity-30 grayscale' : 'opacity-100'
                        }`}
                      />

                      {/* Red Overlay when selected */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-red-500/20 flex flex-col items-center justify-center gap-1 text-red-500 font-black">
                          <Trash2 size={24} className="stroke-[2.5]" />
                          <span className="text-[10px] tracking-wider uppercase bg-white/90 px-1.5 py-0.5 rounded shadow">
                            DELETE
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="w-full flex items-center justify-between text-xs px-1">
                      <span className={`font-bold ${isSelected ? 'text-red-400 line-through' : 'text-slate-400'}`}>
                        Page {idx + 1}
                      </span>
                      <span className={`text-[10px] font-semibold ${isSelected ? 'text-red-400' : 'text-slate-500'}`}>
                        {isSelected ? 'Removed' : 'Keep'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

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

          {/* Bottom Action Footer */}
          <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Remaining Pages: <b>{pageCount - markedToRemove.size}</b> / {pageCount}
            </span>

            <button
              disabled={isProcessing || isLoadingPages || markedToRemove.size === 0}
              onClick={handleRemoveAction}
              className={`px-8 py-3.5 rounded-2xl font-black text-sm text-white flex items-center gap-2 shadow-lg transition ${
                isProcessing || isLoadingPages || markedToRemove.size === 0
                  ? 'bg-slate-700 opacity-50 cursor-not-allowed'
                  : 'bg-[#e5322d] hover:bg-[#c92521] shadow-red-500/20 active:scale-[0.99]'
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={17} className="animate-spin" />
                  <span>Deleting Pages...</span>
                </>
              ) : (
                <>
                  <Trash2 size={17} />
                  <span>Delete &amp; Download</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}   