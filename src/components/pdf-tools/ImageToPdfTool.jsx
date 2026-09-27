import React, { useState } from 'react';
import ToolHeroUploader from './ToolHeroUploader';
import { PDFDocument } from 'pdf-lib';
import { Image as ImageIcon, ArrowLeft, Download, RefreshCw, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';

export default function ImageToPdfTool({ darkMode = false, onBack }) {
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleFilesSelected = (newFiles) => {
    const imageFiles = Array.from(newFiles).filter(file => 
      file.type === 'image/jpeg' || file.type === 'image/png'
    );
    
    if (imageFiles.length === 0) {
      setErrorMessage('Please select valid JPG or PNG images.');
      return;
    }
    
    setErrorMessage('');
    setSuccessMessage('');
    setFiles(prev => [...prev, ...imageFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const convertToPdf = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const pdfDoc = await PDFDocument.create();

      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        let image;
        
        if (file.type === 'image/jpeg') {
          image = await pdfDoc.embedJpg(arrayBuffer);
        } else if (file.type === 'image/png') {
          image = await pdfDoc.embedPng(arrayBuffer);
        }

        if (image) {
          const { width, height } = image.scale(1);
          const page = pdfDoc.addPage([width, height]);
          page.drawImage(image, {
            x: 0,
            y: 0,
            width: width,
            height: height,
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `converted-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      
      setSuccessMessage('Images successfully converted to PDF!');
    } catch (err) {
      setErrorMessage('Failed to convert images to PDF.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl border transition ${darkMode ? 'border-slate-800 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-100'}`}>
          <ArrowLeft size={14} /> <span>Back to Studio</span>
        </button>
        {files.length > 0 && (
          <button onClick={() => setFiles([])} className="text-xs font-semibold text-rose-500 hover:underline">
            Clear All
          </button>
        )}
      </div>

      {files.length === 0 ? (
        <ToolHeroUploader
          title="Image to PDF"
          subtitle="Convert JPG or PNG images to a single PDF document quickly and easily."
          buttonText="Select Images"
          multiple={true}
          darkMode={darkMode}
          onFilesSelected={(e) => handleFilesSelected(e.target ? e.target.files : e)}
        />
      ) : (
        <div className={`p-6 rounded-3xl border shadow-xl flex flex-col gap-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl border border-blue-500/20">
              <ImageIcon size={24} />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Images Ready to Convert</h2>
              <p className="text-xs text-slate-400">{files.length} image(s) selected</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto">
            {files.map((file, idx) => (
              <div key={idx} className={`relative p-2 rounded-xl border flex flex-col items-center gap-2 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-24 object-cover rounded-lg" />
                <span className="text-[10px] truncate w-full text-center text-slate-500">{file.name}</span>
                <button onClick={() => removeFile(idx)} className="absolute -top-2 -right-2 p-1.5 bg-rose-500 text-white rounded-full shadow hover:scale-110 transition">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          {errorMessage && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2"><AlertCircle size={15} /> <span>{errorMessage}</span></div>}
          {successMessage && <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs flex items-center gap-2"><CheckCircle2 size={15} /> <span>{successMessage}</span></div>}

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <button disabled={isProcessing} onClick={convertToPdf} className={`px-8 py-3.5 rounded-2xl font-black text-sm text-white flex items-center gap-2 shadow-lg transition-all ${isProcessing ? 'bg-slate-700 opacity-50' : 'bg-[#e5322d] hover:bg-[#c92521] shadow-red-500/25'}`}>
              {isProcessing ? <><RefreshCw size={17} className="animate-spin" /> <span>Converting...</span></> : <><Download size={17} /> <span>Convert to PDF</span></>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}