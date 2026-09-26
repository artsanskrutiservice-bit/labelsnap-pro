import React from 'react';
import { 
  MousePointer, 
  Type, 
  Square, 
  PenTool, 
  Stamp, 
  ChevronLeft, 
  ChevronRight, 
  Undo2 
} from 'lucide-react';

export default function EditorToolbar({
  activeTool,
  setActiveTool,
  textConfig,
  setTextConfig,
  activeStamp,
  setActiveStamp,
  onOpenSignatureModal,
  onUndo,
  canUndo,
  currentPage,
  totalPages,
  onPrevPage,
  onNextPage,
  darkMode = true
}) {
  return (
    <div className={`w-full p-3 rounded-2xl border shadow-lg flex flex-wrap items-center justify-between gap-3 ${
      darkMode ? 'bg-slate-900/95 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
    }`}>
      {/* Primary Tool Buttons */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setActiveTool('pointer')}
          title="Pointer / Move Mode"
          className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
            activeTool === 'pointer'
              ? 'bg-red-500 text-white'
              : darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <MousePointer size={15} />
          <span className="hidden sm:inline">Select</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTool('text')}
          title="Type Text anywhere on PDF"
          className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
            activeTool === 'text'
              ? 'bg-red-500 text-white'
              : darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <Type size={15} />
          <span className="hidden sm:inline">Text</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTool('whiteout')}
          title="Whiteout / Erase sensitive details"
          className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
            activeTool === 'whiteout'
              ? 'bg-red-500 text-white'
              : darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <Square size={15} />
          <span className="hidden sm:inline">Whiteout</span>
        </button>

        <button
          type="button"
          onClick={onOpenSignatureModal}
          title="Add Signature"
          className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
            activeTool === 'signature'
              ? 'bg-red-500 text-white'
              : darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <PenTool size={15} />
          <span className="hidden sm:inline">Sign</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTool('stamp')}
          title="Add Pre-made Rubber Stamp"
          className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
            activeTool === 'stamp'
              ? 'bg-red-500 text-white'
              : darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <Stamp size={15} />
          <span className="hidden sm:inline">Stamp</span>
        </button>
      </div>

      {/* Dynamic Sub-bar for Text & Stamp */}
      {activeTool === 'text' && (
        <div className="flex items-center gap-2 text-xs">
          <input
            type="text"
            placeholder="Type text to place..."
            value={textConfig.text}
            onChange={(e) => setTextConfig((prev) => ({ ...prev, text: e.target.value }))}
            className={`px-3 py-1.5 rounded-lg border outline-none text-xs ${
              darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
            }`}
          />
          <select
            value={textConfig.fontSize}
            onChange={(e) => setTextConfig((prev) => ({ ...prev, fontSize: Number(e.target.value) }))}
            className={`px-2 py-1.5 rounded-lg border text-xs font-bold outline-none ${
              darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
            }`}
          >
            <option value={10}>10pt</option>
            <option value={14}>14pt</option>
            <option value={18}>18pt</option>
            <option value={24}>24pt</option>
          </select>
        </div>
      )}

      {activeTool === 'stamp' && (
        <div className="flex items-center gap-1 text-xs">
          {['PAID', 'CANCELLED', 'VERIFIED', 'URGENT'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setActiveStamp(st)}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-extrabold transition ${
                activeStamp === st
                  ? 'border-red-500 bg-red-500/20 text-red-400'
                  : 'border-slate-700 hover:border-slate-500'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      )}

      {/* Page Navigation & Undo */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!canUndo}
          onClick={onUndo}
          title="Undo last change"
          className="p-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <Undo2 size={14} />
        </button>

        <div className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-xl bg-slate-800/60 border border-slate-700">
          <button
            disabled={currentPage <= 1}
            onClick={onPrevPage}
            className="p-1 disabled:opacity-30"
          >
            <ChevronLeft size={14} />
          </button>
          <span>{currentPage} / {totalPages || 1}</span>
          <button
            disabled={currentPage >= totalPages}
            onClick={onNextPage}
            className="p-1 disabled:opacity-30"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}