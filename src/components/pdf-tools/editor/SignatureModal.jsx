import React, { useRef, useState, useEffect } from 'react';
import { X, Check, RotateCcw, PenTool } from 'lucide-react';

export default function SignatureModal({ isOpen, onClose, onSave, darkMode = true }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#000000');
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    ctx.strokeStyle = penColor;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSaveSignature = () => {
    if (!hasDrawn) return;
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className={`w-full max-w-md p-5 rounded-3xl border shadow-2xl flex flex-col gap-4 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <PenTool size={18} className="text-red-500" />
            <h3 className="font-bold text-sm">Draw Digital Signature</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
            <X size={16} />
          </button>
        </div>

        {/* Color Switcher */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Ink Color:</span>
          <div className="flex items-center gap-2">
            {[
              { label: 'Black', val: '#000000' },
              { label: 'Blue', val: '#1d4ed8' },
              { label: 'Red', val: '#dc2626' }
            ].map((col) => (
              <button
                key={col.val}
                type="button"
                onClick={() => setPenColor(col.val)}
                className={`w-6 h-6 rounded-full border-2 transition ${
                  penColor === col.val ? 'border-white scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: col.val }}
              />
            ))}
          </div>
        </div>

        {/* Canvas Signature Pad */}
        <div className="w-full bg-white rounded-2xl border-2 border-dashed border-slate-300 overflow-hidden cursor-crosshair">
          <canvas
            ref={canvasRef}
            width={380}
            height={160}
            className="w-full h-40 touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 text-slate-300"
          >
            <RotateCcw size={13} />
            <span>Clear Pad</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              disabled={!hasDrawn}
              onClick={handleSaveSignature}
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center gap-1.5 shadow"
            >
              <Check size={14} />
              <span>Use Signature</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}