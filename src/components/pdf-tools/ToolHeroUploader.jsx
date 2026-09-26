import React, { useRef, useState } from 'react';
import { Upload, Plus, FileText } from 'lucide-react';

export default function ToolHeroUploader({
  title = "Select PDF files",
  subtitle = "Separate one page or a whole set for easy conversion into independent PDF files.",
  buttonText = "Select PDF files",
  multiple = true,
  onFilesSelected,
  darkMode = true
}) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files || []).filter(
      (file) => file.type === 'application/pdf' || file.name.endsWith('.pdf')
    );
    if (droppedFiles.length > 0 && onFilesSelected) {
      onFilesSelected(droppedFiles);
    }
  };

  const handleInputChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0 && onFilesSelected) {
      onFilesSelected(selectedFiles);
    }
    e.target.value = '';
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-full py-16 px-4 rounded-3xl flex flex-col items-center justify-center text-center transition-all duration-200 border-2 border-dashed ${
        isDragging
          ? 'border-red-500 bg-red-500/10 scale-[0.99]'
          : darkMode
          ? 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
          : 'border-slate-300 bg-white hover:border-slate-400 shadow-sm'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        multiple={multiple}
        className="hidden"
        onChange={handleInputChange}
      />

      {/* Main Title & Subtitle */}
      <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight ${
        darkMode ? 'text-white' : 'text-slate-900'
      }`}>
        {title}
      </h1>
      
      <p className={`mt-3 max-w-xl text-sm sm:text-base leading-relaxed ${
        darkMode ? 'text-slate-400' : 'text-slate-600'
      }`}>
        {subtitle}
      </p>

      {/* Primary Red Action Button (iLovePDF Style) */}
      <div className="mt-8 flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-8 py-4 sm:px-10 sm:py-5 rounded-2xl bg-[#e5322d] hover:bg-[#c92521] active:scale-[0.98] text-white font-bold text-base sm:text-lg shadow-lg hover:shadow-red-500/30 transition flex items-center gap-3"
        >
          <Upload size={22} className="stroke-[2.5]" />
          <span>{buttonText}</span>
        </button>
      </div>

      <p className={`mt-4 text-xs font-medium tracking-wide ${
        darkMode ? 'text-slate-500' : 'text-slate-400'
      }`}>
        or drop PDFs directly here
      </p>
    </div>
  );
}