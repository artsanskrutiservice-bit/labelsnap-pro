import React, { useState, useRef, useEffect } from 'react';
import ToolHeroUploader from '../ToolHeroUploader';
import EditorToolbar from './EditorToolbar';
import SignatureModal from './SignatureModal';
import { applyEditorOperations } from '../../../utils/pdfEditorEngine';
import * as pdfjsLib from 'pdfjs-dist';
import { 
  Edit3, 
  ArrowLeft, 
  Download, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Trash2 
} from 'lucide-react';

export default function PdfEditorStudio({ darkMode = true, onBack }) {
  const [file, setFile] = useState(null);
  const [fileBytes, setFileBytes] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Editor State
  const [activeTool, setActiveTool] = useState('pointer'); // 'pointer' | 'text' | 'whiteout' | 'signature' | 'stamp'
  const [textConfig, setTextConfig] = useState({ text: 'Sample Text', fontSize: 14, color: '#000000', isBold: true });
  const [activeStamp, setActiveStamp] = useState('PAID');
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [recentSignature, setRecentSignature] = useState(null);

  // Applied Operations History
  const [operations, setOperations] = useState([]);

  // Processing & Feedback State
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // PDF Page Renderer via pdfjs
  const renderCurrentPage = async (bytes, pageNum) => {
    if (!canvasRef.current || !bytes) return;
    try {
      const loadingTask = pdfjsLib.getDocument({ data: bytes.slice(0) });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.3 });

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: ctx, viewport }).promise;
    } catch (err) {
      console.error('Render error:', err);
    }
  };

  useEffect(() => {
    if (fileBytes) {
      renderCurrentPage(fileBytes, currentPage);
    }
  }, [fileBytes, currentPage]);

  const handleFileSelected = async (files) => {
    if (!files || files.length === 0) return;
    const selected = files[0];
    setErrorMessage('');
    setSuccessMessage('');
    setOperations([]);

    try {
      const buffer = await selected.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const loadingTask = pdfjsLib.getDocument({ data: bytes.slice(0) });
      const pdf = await loadingTask.promise;

      setFile(selected);
      setFileBytes(bytes);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
    } catch (err) {
      setErrorMessage('Could not load PDF file for editing.');
    }
  };

  // Canvas Click Handler: Place Text, Stamp, Signature, or Whiteout
  const handleCanvasClick = (e) => {
    if (activeTool === 'pointer' || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert Canvas Top-Left to PDF Bottom-Up Normalized Coordinates
    const normX = clickX / rect.width;
    const normY = (rect.height - clickY) / rect.height;

    const pageIdx = currentPage - 1;

    if (activeTool === 'text' && textConfig.text.trim()) {
      setOperations((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: 'text',
          pageIndex: pageIdx,
          x: normX,
          y: normY,
          text: textConfig.text,
          fontSize: textConfig.fontSize,
          color: textConfig.color,
          isBold: textConfig.isBold,
          // Canvas preview coordinates
          canvasX: clickX,
          canvasY: clickY,
        }
      ]);
    } else if (activeTool === 'stamp') {
      setOperations((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: 'stamp',
          pageIndex: pageIdx,
          x: normX,
          y: normY,
          stampText: activeStamp,
          canvasX: clickX,
          canvasY: clickY,
        }
      ]);
    } else if (activeTool === 'signature' && recentSignature) {
      setOperations((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: 'signature',
          pageIndex: pageIdx,
          x: normX,
          y: normY,
          width: 130,
          imageDataUrl: recentSignature,
          canvasX: clickX,
          canvasY: clickY,
        }
      ]);
    } else if (activeTool === 'whiteout') {
      setOperations((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: 'whiteout',
          pageIndex: pageIdx,
          x: normX,
          y: normY - 0.04, // adjust anchor
          width: 0.25,
          height: 0.04,
          fillColor: '#ffffff',
          canvasX: clickX,
          canvasY: clickY,
          canvasW: rect.width * 0.25,
          canvasH: rect.height * 0.04,
        }
      ]);
    }
  };

  const removeOperation = (id) => {
    setOperations((prev) => prev.filter((op) => op.id !== id));
  };

  const handleUndo = () => {
    setOperations((prev) => prev.slice(0, -1));
  };

  const handleSaveAndDownload = async () => {
    if (!fileBytes) return;
    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const editedBytes = await applyEditorOperations(fileBytes, operations);
      const blob = new Blob([editedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `edited-${file.name}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);

      setSuccessMessage('Edited PDF saved and downloaded successfully!');
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to save edited PDF.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Top Header */}
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
            onClick={() => { setFile(null); setFileBytes(null); setOperations([]); }}
            className="text-xs font-semibold text-rose-400 hover:underline"
          >
            Change File
          </button>
        )}
      </div>

      {!file ? (
        <ToolHeroUploader
          title="Interactive PDF Editor"
          subtitle="Add text annotations, draw signatures, place official stamps, or whiteout sensitive info."
          buttonText="Select PDF to Edit"
          multiple={false}
          darkMode={darkMode}
          onFilesSelected={handleFileSelected}
        />
      ) : (
        <div className={`p-6 rounded-3xl border shadow-xl flex flex-col gap-5 ${
          darkMode ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          {/* Floating Toolbar */}
          <EditorToolbar
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            textConfig={textConfig}
            setTextConfig={setTextConfig}
            activeStamp={activeStamp}
            setActiveStamp={setActiveStamp}
            onOpenSignatureModal={() => setIsSignModalOpen(true)}
            onUndo={handleUndo}
            canUndo={operations.length > 0}
            currentPage={currentPage}
            totalPages={totalPages}
            onPrevPage={() => setCurrentPage((p) => Math.max(1, p - 1))}
            onNextPage={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            darkMode={darkMode}
          />

          {/* Interactive PDF Canvas Area */}
          <div
            ref={containerRef}
            className="relative flex justify-center p-4 border border-dashed rounded-2xl min-h-[460px] bg-slate-950/60 overflow-auto cursor-crosshair"
            onClick={handleCanvasClick}
          >
            <div className="relative shadow-2xl rounded overflow-hidden">
              <canvas ref={canvasRef} className="block max-w-full" />

              {/* Render Visible Operations for Current Page */}
              {operations
                .filter((op) => op.pageIndex === currentPage - 1)
                .map((op) => (
                  <div
                    key={op.id}
                    style={{ left: `${op.canvasX}px`, top: `${op.canvasY}px` }}
                    className="absolute z-10 group pointer-events-auto"
                  >
                    {op.type === 'text' && (
                      <span className="px-1.5 py-0.5 bg-yellow-300/80 text-black font-bold text-xs rounded border border-yellow-500 shadow-sm">
                        {op.text}
                      </span>
                    )}

                    {op.type === 'stamp' && (
                      <span className="px-2 py-0.5 border-2 border-emerald-500 bg-white text-emerald-600 font-black text-xs rounded shadow uppercase tracking-wider">
                        {op.stampText}
                      </span>
                    )}

                    {op.type === 'signature' && (
                      <img src={op.imageDataUrl} alt="Signature" className="w-28 h-auto drop-shadow" />
                    )}

                    {op.type === 'whiteout' && (
                      <div
                        style={{ width: `${op.canvasW || 120}px`, height: `${op.canvasH || 24}px` }}
                        className="bg-white border border-slate-300 shadow-sm"
                      />
                    )}

                    {/* Delete Tag on Hover */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeOperation(op.id); }}
                      className="hidden group-hover:flex absolute -top-3 -right-3 p-1 rounded-full bg-red-600 text-white shadow hover:scale-110 transition"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {/* Alerts */}
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
          <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Total Annotations: <b>{operations.length}</b>
            </span>

            <button
              disabled={isSaving}
              onClick={handleSaveAndDownload}
              className={`px-8 py-3.5 rounded-2xl font-black text-sm text-white flex items-center gap-2 shadow-lg transition ${
                isSaving
                  ? 'bg-slate-700 opacity-50 cursor-not-allowed'
                  : 'bg-[#e5322d] hover:bg-[#c92521] shadow-red-500/20 active:scale-[0.99]'
              }`}
            >
              {isSaving ? (
                <>
                  <RefreshCw size={17} className="animate-spin" />
                  <span>Saving Edits...</span>
                </>
              ) : (
                <>
                  <Download size={17} />
                  <span>Save Edits &amp; Download</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Signature Pad Modal */}
      <SignatureModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        onSave={(dataUrl) => {
          setRecentSignature(dataUrl);
          setActiveTool('signature');
        }}
        darkMode={darkMode}
      />
    </div>
  );
}