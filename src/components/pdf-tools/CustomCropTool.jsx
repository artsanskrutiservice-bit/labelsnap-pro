import React, { useState, useRef, useEffect, useCallback } from 'react';
import ToolHeroUploader from './ToolHeroUploader';
import { cropPdfCustom } from '../../utils/pdfToolsEngine';
import * as pdfjsLib from 'pdfjs-dist';
import { 
  Crop, 
  ArrowLeft, 
  Download, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  ArrowRight
} from 'lucide-react';

export default function CustomCropTool({ darkMode = false, onBack }) {
  const [file, setFile] = useState(null);
  const [fileBytes, setFileBytes] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);

  // Pages to apply crop: 'all' | 'current'
  const [applyScope, setApplyScope] = useState('all');

  // Crop Box normalized values [0 to 1]
  // { x, y, width, height }
  const [cropBox, setCropBox] = useState({
    x: 0.15,
    y: 0.15,
    width: 0.7,
    height: 0.4
  });

  // Mouse interaction state
  const [interactionState, setInteractionState] = useState(null); 
  // interactionState: { type: 'draw' | 'move' | 'resize', handle?: 'tl'|'tr'|'bl'|'br', startX, startY, origBox }

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // PDF Page Renderer
  const renderPdfPage = useCallback(async (bytes, pageNum, zoomScale) => {
    if (!canvasRef.current || !bytes) return;
    try {
      const loadingTask = pdfjsLib.getDocument({ data: bytes.slice(0) });
      const pdf = await loadingTask.promise;
      setPageCount(pdf.numPages);

      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: zoomScale * 1.2 });

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: ctx, viewport }).promise;
    } catch (err) {
      console.error('Render error:', err);
    }
  }, []);

  useEffect(() => {
    if (fileBytes) {
      renderPdfPage(fileBytes, currentPage, scale);
    }
  }, [fileBytes, currentPage, scale, renderPdfPage]);

  const handleFileSelected = async (files) => {
    if (!files || files.length === 0) return;
    const selected = files[0];
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const buffer = await selected.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      setFile(selected);
      setFileBytes(bytes);
      setCurrentPage(1);
      setScale(1.0);
      setCropBox({ x: 0.15, y: 0.15, width: 0.7, height: 0.4 });
    } catch (err) {
      setErrorMessage('Could not load PDF file.');
    }
  };

  // Convert Mouse Event Coordinates to Normalized [0..1]
  const getCanvasRelativeCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { nx: 0, ny: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    return {
      nx: x / rect.width,
      ny: y / rect.height
    };
  };

  // Check if click is inside the crop rectangle
  const isInsideCropBox = (nx, ny) => {
    return (
      nx >= cropBox.x &&
      nx <= cropBox.x + cropBox.width &&
      ny >= cropBox.y &&
      ny <= cropBox.y + cropBox.height
    );
  };

  // Mouse Handlers
  const handleMouseDown = (e) => {
    if (!canvasRef.current) return;
    const { nx, ny } = getCanvasRelativeCoords(e);

    // If handle clicked, resize handled separately by handle props
    if (isInsideCropBox(nx, ny)) {
      // Move Existing Box
      setInteractionState({
        type: 'move',
        startX: nx,
        startY: ny,
        origBox: { ...cropBox }
      });
    } else {
      // Start Drawing New Box
      setCropBox({ x: nx, y: ny, width: 0.02, height: 0.02 });
      setInteractionState({
        type: 'draw',
        startX: nx,
        startY: ny,
        origBox: { x: nx, y: ny, width: 0.02, height: 0.02 }
      });
    }
  };

  const startResizeHandle = (e, handle) => {
    e.stopPropagation();
    const { nx, ny } = getCanvasRelativeCoords(e);
    setInteractionState({
      type: 'resize',
      handle,
      startX: nx,
      startY: ny,
      origBox: { ...cropBox }
    });
  };

  const handleMouseMove = (e) => {
    if (!interactionState) return;
    const { nx, ny } = getCanvasRelativeCoords(e);
    const { type, handle, startX, startY, origBox } = interactionState;
    const dx = nx - startX;
    const dy = ny - startY;

    if (type === 'move') {
      let newX = Math.max(0, Math.min(1 - origBox.width, origBox.x + dx));
      let newY = Math.max(0, Math.min(1 - origBox.height, origBox.y + dy));
      setCropBox((prev) => ({ ...prev, x: newX, y: newY }));
    } else if (type === 'draw') {
      const minX = Math.min(startX, nx);
      const minY = Math.min(startY, ny);
      const w = Math.abs(nx - startX);
      const h = Math.abs(ny - startY);
      setCropBox({
        x: Math.max(0, minX),
        y: Math.max(0, minY),
        width: Math.min(1 - minX, Math.max(0.04, w)),
        height: Math.min(1 - minY, Math.max(0.04, h))
      });
    } else if (type === 'resize') {
      let { x, y, width, height } = origBox;
      if (handle === 'tl') {
        const newX = Math.min(origBox.x + origBox.width - 0.05, Math.max(0, x + dx));
        const newY = Math.min(origBox.y + origBox.height - 0.05, Math.max(0, y + dy));
        width += (x - newX);
        height += (y - newY);
        x = newX;
        y = newY;
      } else if (handle === 'tr') {
        const newY = Math.min(origBox.y + origBox.height - 0.05, Math.max(0, y + dy));
        width = Math.min(1 - x, Math.max(0.05, origBox.width + dx));
        height += (y - newY);
        y = newY;
      } else if (handle === 'bl') {
        const newX = Math.min(origBox.x + origBox.width - 0.05, Math.max(0, x + dx));
        width += (x - newX);
        x = newX;
        height = Math.min(1 - y, Math.max(0.05, origBox.height + dy));
      } else if (handle === 'br') {
        width = Math.min(1 - x, Math.max(0.05, origBox.width + dx));
        height = Math.min(1 - y, Math.max(0.05, origBox.height + dy));
      }
      setCropBox({ x, y, width, height });
    }
  };

  const handleMouseUp = () => {
    setInteractionState(null);
  };

  const handleResetCrop = () => {
    setCropBox({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 });
  };

  // Perform Final Crop
  const handleExecuteCrop = async () => {
    if (!fileBytes) return;
    setIsProcessing(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // In PDF coordinate space, (0,0) is bottom-left, canvas is top-left
      const pdfCropBox = {
        x: cropBox.x,
        y: 1 - cropBox.y - cropBox.height,
        width: cropBox.width,
        height: cropBox.height
      };

      const targetPages = applyScope === 'current' ? [currentPage - 1] : null;
      const croppedBytes = await cropPdfCustom(fileBytes, pdfCropBox, targetPages);

      const blob = new Blob([croppedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cropped-${file.name}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);

      setSuccessMessage('PDF cropped & downloaded successfully!');
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to crop PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 max-w-7xl mx-auto">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl border transition ${
            darkMode ? 'border-slate-800 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <ArrowLeft size={14} />
          <span>Back to Studio</span>
        </button>

        {file && (
          <button
            onClick={() => { setFile(null); setFileBytes(null); }}
            className="text-xs font-semibold text-rose-500 hover:underline"
          >
            Change File
          </button>
        )}
      </div>

      {!file ? (
        <ToolHeroUploader
          title="Crop PDF"
          subtitle="Click and drag to select the area you want to keep. Resize if needed."
          buttonText="Select PDF file"
          multiple={false}
          darkMode={darkMode}
          onFilesSelected={handleFileSelected}
        />
      ) : (
        <div className={`rounded-3xl border shadow-xl grid grid-cols-1 lg:grid-cols-12 overflow-hidden ${
          darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          
          {/* LEFT AREA: Live Interactive Canvas Viewer */}
          <div 
            className="lg:col-span-8 p-4 sm:p-6 flex flex-col items-center justify-between min-h-[580px] bg-slate-100 dark:bg-slate-950/70 select-none relative"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {/* Scrollable Center Canvas Container */}
            <div 
              ref={containerRef}
              className="relative flex items-center justify-center overflow-auto max-w-full max-h-[520px] p-2"
            >
              <div 
                className="relative inline-block shadow-2xl rounded-sm overflow-hidden cursor-crosshair border border-slate-300 dark:border-slate-700"
                onMouseDown={handleMouseDown}
              >
                {/* Rendered PDF Page */}
                <canvas ref={canvasRef} className="block pointer-events-none" />

                {/* Dark Dim Overlay around the selected box */}
                <div 
                  className="absolute inset-0 bg-black/40 pointer-events-none"
                  style={{
                    clipPath: `polygon(
                      0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
                      ${cropBox.x * 100}% ${cropBox.y * 100}%,
                      ${cropBox.x * 100}% ${(cropBox.y + cropBox.height) * 100}%,
                      ${(cropBox.x + cropBox.width) * 100}% ${(cropBox.y + cropBox.height) * 100}%,
                      ${(cropBox.x + cropBox.width) * 100}% ${cropBox.y * 100}%,
                      ${cropBox.x * 100}% ${cropBox.y * 100}%
                    )`
                  }}
                />

                {/* The Interactive Bounding Crop Box */}
                <div
                  className="absolute border-2 border-blue-500 bg-white/10 cursor-move"
                  style={{
                    left: `${cropBox.x * 100}%`,
                    top: `${cropBox.y * 100}%`,
                    width: `${cropBox.width * 100}%`,
                    height: `${cropBox.height * 100}%`
                  }}
                >
                  {/* 4 Corner Resize Handles (Blue Dots) */}
                  <div
                    onMouseDown={(e) => startResizeHandle(e, 'tl')}
                    className="absolute -top-2 -left-2 w-4 h-4 bg-blue-600 border-2 border-white rounded-full cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
                  />
                  <div
                    onMouseDown={(e) => startResizeHandle(e, 'tr')}
                    className="absolute -top-2 -right-2 w-4 h-4 bg-blue-600 border-2 border-white rounded-full cursor-nesw-resize shadow-md hover:scale-125 transition-transform"
                  />
                  <div
                    onMouseDown={(e) => startResizeHandle(e, 'bl')}
                    className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-600 border-2 border-white rounded-full cursor-nesw-resize shadow-md hover:scale-125 transition-transform"
                  />
                  <div
                    onMouseDown={(e) => startResizeHandle(e, 'br')}
                    className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-600 border-2 border-white rounded-full cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Floating Control Bar (Page Switcher & Zoom) */}
            <div className={`mt-4 px-4 py-2 rounded-2xl border shadow-md flex items-center gap-4 text-xs font-semibold ${
              darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-700'
            }`}>
              {/* Page Navigator */}
              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                  title="Previous Page"
                >
                  <ChevronLeft size={16} />
                </button>
                <span>{currentPage} / {pageCount || 1}</span>
                <button
                  disabled={currentPage >= pageCount}
                  onClick={() => setCurrentPage((p) => Math.min(pageCount, p + 1))}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                  title="Next Page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />

              {/* Zoom Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setScale((s) => Math.max(0.6, s - 0.15))}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Zoom Out"
                >
                  <ZoomOut size={15} />
                </button>
                <span className="w-12 text-center">{Math.round(scale * 100)}%</span>
                <button
                  onClick={() => setScale((s) => Math.min(1.8, s + 0.15))}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Zoom In"
                >
                  <ZoomIn size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR: iLovePDF Style Controls */}
          <div className="lg:col-span-4 p-6 sm:p-8 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800">
            <div className="flex flex-col gap-6">
              
              {/* Title & Reset Button */}
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black tracking-tight">Crop PDF</h2>
                <button
                  type="button"
                  onClick={handleResetCrop}
                  className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1"
                >
                  <RotateCcw size={12} />
                  <span>Reset all</span>
                </button>
              </div>

              {/* Helpful Info Tip Box */}
              <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs leading-relaxed flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">i</span>
                <p>Click and drag to select the area you want to keep. Resize if needed.</p>
              </div>

              {/* Pages Selection Options */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pages:</span>
                
                <div className="flex items-center gap-6 text-sm font-semibold">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="cropScope"
                      value="all"
                      checked={applyScope === 'all'}
                      onChange={() => setApplyScope('all')}
                      className="w-4 h-4 accent-red-600 cursor-pointer"
                    />
                    <span>All pages</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="cropScope"
                      value="current"
                      checked={applyScope === 'current'}
                      onChange={() => setApplyScope('current')}
                      className="w-4 h-4 accent-red-600 cursor-pointer"
                    />
                    <span>Current page ({currentPage})</span>
                  </label>
                </div>
              </div>

              {/* Crop Coordinates Readout */}
              <div className={`p-3.5 rounded-xl border text-[11px] grid grid-cols-2 gap-2 ${
                darkMode ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <div>Selection Width: <b>{Math.round(cropBox.width * 100)}%</b></div>
                <div>Selection Height: <b>{Math.round(cropBox.height * 100)}%</b></div>
                <div>Left Offset: <b>{Math.round(cropBox.x * 100)}%</b></div>
                <div>Top Offset: <b>{Math.round(cropBox.y * 100)}%</b></div>
              </div>

              {/* Error & Success Feedback Alerts */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
                  <AlertCircle size={15} /> <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs flex items-center gap-2">
                  <CheckCircle2 size={15} /> <span>{successMessage}</span>
                </div>
              )}

            </div>

            {/* Red Action Button */}
            <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
              <button
                disabled={isProcessing}
                onClick={handleExecuteCrop}
                className={`w-full py-4 px-6 rounded-2xl font-black text-base text-white flex items-center justify-center gap-3 shadow-xl transition-all ${
                  isProcessing
                    ? 'bg-slate-700 opacity-50 cursor-not-allowed'
                    : 'bg-[#e5322d] hover:bg-[#c92521] shadow-red-500/25 active:scale-[0.99]'
                }`}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw size={20} className="animate-spin" />
                    <span>Cropping Document...</span>
                  </>
                ) : (
                  <>
                    <span>Crop PDF</span>
                    <ArrowRight size={20} className="stroke-[2.5]" />
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