import React, { useState, useRef } from 'react';
import ToolHeroUploader from './ToolHeroUploader';
import { mergePdfFiles } from '../../utils/pdfToolsEngine';
import { 
  Files, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  Plus, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  ArrowLeft
} from 'lucide-react';

export default function MergePdfTool({ darkMode = true, onBack }) {
  const [files, setFiles] = useState([]);
  const [isMerging, setIsMerging] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [mergedFileName, setMergedFileName] = useState('merged-document.pdf');
  const [errorMessage, setErrorMessage] = useState('');

  const additionalInputRef = useRef(null);

  // New files add handler
  const handleFilesAdded = (newFiles) => {
    setErrorMessage('');
    setDownloadUrl(null);
    setFiles((prev) => [...prev, ...newFiles]);
  };

  // Reorder: Move Up
  const moveFileUp = (index) => {
    if (index === 0) return;
    setFiles((prev) => {
      const updated = [...prev];
      const temp = updated[index - 1];
      updated[index - 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  // Reorder: Move Down
  const moveFileDown = (index) => {
    if (index === files.length - 1) return;
    setFiles((prev) => {
      const updated = [...prev];
      const temp = updated[index + 1];
      updated[index + 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  // Remove single file
  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setDownloadUrl(null);
  };

  // Process & Merge All
  const handleMergeAction = async () => {
    if (files.length < 2) {
      setErrorMessage('Please add at least 2 PDF files to merge.');
      return;
    }

    setIsMerging(true);
    setErrorMessage('');

    try {
      const arrayBuffers = await Promise.all(
        files.map((file) => file.arrayBuffer().then((buf) => new Uint8Array(buf)))
      );

      const mergedBytes = await mergePdfFiles(arrayBuffers);
      const blob = new Blob([mergedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setDownloadUrl(url);
      setMergedFileName(`merged-${Date.now()}.pdf`);

      // Trigger automatic instant download
      const a = document.createElement('a');
      a.href = url;
      a.download = `merged-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('Merge failure:', err);
      setErrorMessage('Failed to merge PDFs. Please verify valid, uncorrupted files.');
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Top Bar Navigation */}
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

        {files.length > 0 && (
          <button
            onClick={() => { setFiles([]); setDownloadUrl(null); }}
            className="text-xs font-semibold text-rose-400 hover:underline"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Screen 1: Initial Uploader Screen */}
      {files.length === 0 ? (
        <ToolHeroUploader
          title="Merge PDF files"
          subtitle="Combine multiple PDFs in the order you want with the easiest PDF merger available."
          buttonText="Select PDF files"
          multiple={true}
          darkMode={darkMode}
          onFilesSelected={handleFilesAdded}
        />
      ) : (
        /* Screen 2: Organize & Merge Panel */
        <div className={`p-6 rounded-3xl border shadow-xl flex flex-col gap-6 ${
          darkMode ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/60">
            <div>
              <h2 className="text-xl font-extrabold flex items-center gap-2">
                <Files size={22} className="text-red-500" />
                <span>Arrange PDFs to Merge ({files.length})</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Use up/down buttons to reorder how pages will be merged.
              </p>
            </div>

            <button
              onClick={() => additionalInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-2 self-start sm:self-auto transition"
            >
              <Plus size={15} />
              <span>Add More PDFs</span>
            </button>

            <input
              ref={additionalInputRef}
              type="file"
              accept="application/pdf"
              multiple
              className="hidden"
              onChange={(e) => {
                handleFilesAdded(Array.from(e.target.files || []));
                e.target.value = '';
              }}
            />
          </div>

          {/* Files List Table / Grid */}
          <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
            {files.map((file, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition ${
                  darkMode ? 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-red-500/10 text-red-500 font-black text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold truncate max-w-xs sm:max-w-md">
                      {file.name}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    disabled={idx === 0}
                    onClick={() => moveFileUp(idx)}
                    title="Move Up"
                    className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    disabled={idx === files.length - 1}
                    onClick={() => moveFileDown(idx)}
                    title="Move Down"
                    className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <ArrowDown size={13} />
                  </button>
                  <button
                    onClick={() => removeFile(idx)}
                    title="Remove"
                    className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Feedback & Error Alerts */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {downloadUrl && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} />
                <span>PDFs successfully merged! Auto-download has been triggered.</span>
              </div>
              <a
                href={downloadUrl}
                download={mergedFileName}
                className="font-bold underline ml-2 flex items-center gap-1"
              >
                <Download size={13} /> Re-download
              </a>
            </div>
          )}

          {/* Bottom Action Footer */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-400 font-medium">
              Client-side Processing: 100% private &amp; no server file uploads.
            </span>

            <button
              disabled={files.length < 2 || isMerging}
              onClick={handleMergeAction}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2.5 shadow-lg transition ${
                files.length < 2 || isMerging
                  ? 'bg-slate-700 opacity-50 cursor-not-allowed'
                  : 'bg-[#e5322d] hover:bg-[#c92521] shadow-red-500/20 active:scale-[0.99]'
              }`}
            >
              {isMerging ? (
                <>
                  <RefreshCw size={17} className="animate-spin" />
                  <span>Merging Documents...</span>
                </>
              ) : (
                <>
                  <Files size={17} />
                  <span>Merge PDF Files</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}