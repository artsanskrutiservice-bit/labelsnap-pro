import React, { useState } from 'react';
import ToolHeroUploader from './ToolHeroUploader';
import * as pdfjsLib from 'pdfjs-dist';
import { ImageIcon, ArrowLeft, Download, RefreshCw, AlertCircle, FileText } from 'lucide-react';

export default function PdfToImageTool({ darkMode = false, onBack }) {
  const [file, setFile] = useState(null);
  const [images, setImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileSelected = async (files) => {
    if (!files || files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    setIsProcessing(true);
    setErrorMessage('');
    
    try {
      const arrayBuffer = await selected.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const loadingTask = pdfjsLib.getDocument({ data: bytes.slice(0) });
      const pdf = await loadingTask.promise;
      
      const generatedImages = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // High quality scale
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        await page.render({ canvasContext: ctx, viewport }).promise;
        generatedImages.push(canvas.toDataURL('image/jpeg', 0.9));
      }
      setImages(generatedImages);
    } catch (err) {
      setErrorMessage('Failed to extract images from PDF. Please make sure it is a valid file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = (dataUrl, index) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `page-${index + 1}-${file.name.replace('.pdf', '')}.jpg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const downloadAll = async () => {
    for (let i = 0; i < images.length; i++) {
      downloadImage(images[i], i);
      await new Promise(resolve => setTimeout(resolve, 300)); // Prevent browser block
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl border transition ${darkMode ? 'border-slate-800 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-100'}`}>
          <ArrowLeft size={14} /> <span>Back to Studio</span>
        </button>
        {file && (
          <button onClick={() => { setFile(null); setImages([]); }} className="text-xs font-semibold text-rose-500 hover:underline">
            Change PDF
          </button>
        )}
      </div>

      {!file ? (
        <ToolHeroUploader
          title="PDF to Image"
          subtitle="Convert each page of your PDF into high-quality JPG images instantly."
          buttonText="Select PDF file"
          multiple={false}
          darkMode={darkMode}
          onFilesSelected={handleFileSelected}
        />
      ) : (
        <div className={`p-6 rounded-3xl border shadow-xl flex flex-col gap-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl border border-blue-500/20">
                <FileText size={24} />
              </div>
              <div>
                <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{file.name}</h2>
                <p className="text-xs text-slate-400">{isProcessing ? 'Extracting pages...' : `${images.length} Pages Extracted`}</p>
              </div>
            </div>
            {!isProcessing && images.length > 0 && (
              <button onClick={downloadAll} className="px-5 py-2.5 bg-[#e5322d] hover:bg-[#c92521] text-white text-xs font-bold rounded-xl shadow flex items-center gap-2 transition">
                <Download size={14} /> Download All Images
              </button>
            )}
          </div>

          {isProcessing ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-500">
              <RefreshCw size={32} className="animate-spin text-red-500" />
              <p className="text-sm font-semibold">Converting PDF pages to Images...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto">
              {images.map((img, idx) => (
                <div key={idx} className={`p-3 rounded-2xl border flex flex-col items-center gap-3 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="w-full aspect-[3/4] bg-white rounded-lg overflow-hidden border border-slate-200 shadow-sm flex items-center justify-center">
                    <img src={img} alt={`Page ${idx + 1}`} className="max-w-full max-h-full object-contain" />
                  </div>
                  <button onClick={() => downloadImage(img, idx)} className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5">
                    <Download size={13} /> Page {idx + 1}
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {errorMessage && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2"><AlertCircle size={15} /> <span>{errorMessage}</span></div>}
        </div>
      )}
    </div>
  );
}