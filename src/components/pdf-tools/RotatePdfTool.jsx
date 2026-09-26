import React, { useState, useEffect } from 'react';
import ToolHeroUploader from './ToolHeroUploader';
import { rotatePdfPages } from '../../utils/pdfToolsEngine';
import * as pdfjsLib from 'pdfjs-dist';
import { 
  RotateCw, 
  RotateCcw, 
  ArrowLeft, 
  Download, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  CheckCheck 
} from 'lucide-react';

export default function RotatePdfTool({ darkMode = true, onBack }) {
  const [file, setFile] = useState(null);
  const [fileBytes, setFileBytes] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [thumbnails, setThumbnails] = useState([]);
  const [rotations, setRotations] = useState({}); // { [pageIndex]: angle }
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // PDF ના દરેક પેજના પ્રિવ્યુ થંબનેઇલ્સ જનરેટ કરવા માટે
  const generateThumbnails = async (bytes) => {
    setIsLoadingPages(true);
    try {
      const loadingTask = pdfjsLib.getDocument({ data: bytes.slice(0) });
      const pdf = await loadingTask.promise;
      const count = pdf.numPages;
      setPageCount(count);

      const thumbs = [];
      const initialRotations = {};

      for (let i = 1; i <= count; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.35 });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: ctx, viewport }).promise;
        thumbs.push(canvas.toDataURL('image/jpeg', 0.8));
        initialRotations[i - 1] = 0;
      }

      setThumbnails(thumbs);
      setRotations(initialRotations);
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

  // વ્યક્તિગત પેજ રોટેટ કરવું
  const rotateSinglePage = (pageIdx, angleDelta) => {
    setRotations((prev) => {
      const current = prev[pageIdx] || 0;
      const next = (current + angleDelta + 360) % 360;
      return { ...prev, [pageIdx]: next };
    });
  };

  // બધા પેજ એક સાથે રોટેટ કરવા
  const rotateAllPages = (angleDelta) => {
    setRotations((prev) => {
      const updated = {};
      for (let i = 0; i < pageCount; i++) {
        const current = prev[i] || 0;
        updated[i] = (current + angleDelta + 360) % 360;
      }
      return updated;
    });
  };

  const handleRotateAction = async () => {
    if (!fileBytes) return;
    setIsProcessing(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const rotatedBytes = await rotatePdfPages(fileBytes, rotations);
      const blob = new Blob([rotatedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `rotated-${file.name}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);

      setSuccessMessage('Rotated PDF downloaded successfully!');
    } catch (err) {
      setErrorMessage('Failed to rotate and save PDF.');
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
            onClick={() => { setFile(null); setFileBytes(null); setThumbnails([]); }}
            className="text-xs font-semibold text-rose-400 hover:underline"
          >
            Change File
          </button>
        )}
      </div>

      {!file ? (
        <ToolHeroUploader
          title="Rotate PDF pages"
          subtitle="Rotate specific pages or all pages of your PDF documents clockwise or counter-clockwise."
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
                <RotateCw size={20} className="text-red-500" />
                <span>{file.name}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Total {pageCount} Page(s) • Click individual page buttons or rotate all together.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => rotateAllPages(90)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition"
              >
                <RotateCw size={14} />
                <span>Rotate All Right</span>
              </button>

              <button
                type="button"
                onClick={() => rotateAllPages(-90)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition"
              >
                <RotateCcw size={14} />
                <span>Rotate All Left</span>
              </button>
            </div>
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
                const angle = rotations[idx] || 0;
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition ${
                      darkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="relative w-full aspect-[3/4] bg-white rounded-lg overflow-hidden flex items-center justify-center shadow-inner">
                      <img
                        src={thumbUrl}
                        alt={`Page ${idx + 1}`}
                        style={{ transform: `rotate(${angle}deg)` }}
                        className="max-w-full max-h-full object-contain transition-transform duration-300"
                      />
                    </div>

                    <div className="w-full flex items-center justify-between text-xs mt-1">
                      <span className="font-bold text-slate-400">Page {idx + 1}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => rotateSinglePage(idx, -90)}
                          className="p-1 rounded-lg border border-slate-700 hover:bg-slate-800 transition"
                          title="Rotate Left"
                        >
                          <RotateCcw size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => rotateSinglePage(idx, 90)}
                          className="p-1 rounded-lg border border-slate-700 hover:bg-slate-800 transition"
                          title="Rotate Right"
                        >
                          <RotateCw size={12} />
                        </button>
                      </div>
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
              Changes apply strictly client-side.
            </span>

            <button
              disabled={isProcessing || isLoadingPages}
              onClick={handleRotateAction}
              className={`px-8 py-3.5 rounded-2xl font-black text-sm text-white flex items-center gap-2 shadow-lg transition ${
                isProcessing || isLoadingPages
                  ? 'bg-slate-700 opacity-50 cursor-not-allowed'
                  : 'bg-[#e5322d] hover:bg-[#c92521] shadow-red-500/20 active:scale-[0.99]'
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={17} className="animate-spin" />
                  <span>Rotating PDF...</span>
                </>
              ) : (
                <>
                  <Download size={17} />
                  <span>Save &amp; Download</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}