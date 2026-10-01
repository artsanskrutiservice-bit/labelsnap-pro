import React, { useState, useRef, useEffect } from 'react';
import { 
  Scissors, 
  Sun, 
  Moon, 
  LogIn, 
  LogOut, 
  ShieldAlert, 
  ArrowLeft,
  ChevronDown,
  Files,
  Crop,
  RotateCw,
  Trash2,
  Hash,
  Edit3,
  Sparkles,
  FileSpreadsheet,
  Image as ImageIcon,
  FileImage,
  FileText
} from 'lucide-react';

export default function Header({
  platform,
  setPlatform,
  platforms,
  activePlatform,
  darkMode = false, // By default Light/White mode
  setDarkMode,
  currentUser,
  isAdmin,
  isPro,
  loginWithGoogle,
  logout,
  showAdminView,
  setShowAdminView,
  activeView = 'studio',
  setActiveView
}) {
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Updated PDF Tools List — "Merge PDF" removed (now direct button)
  const pdfTools = [
    { id: 'split', name: 'Split PDF', desc: 'Extract pages or ranges', icon: Scissors, color: 'text-amber-500' },
    { id: 'crop', name: 'Selected Crop', desc: 'Visual box / preset crop', icon: Crop, color: 'text-emerald-500' },
    { id: 'rotate', name: 'Rotate PDF', desc: 'Rotate pages 90° / 180°', icon: RotateCw, color: 'text-blue-500' },
    { id: 'remove', name: 'Remove Pages', desc: 'Delete redundant pages', icon: Trash2, color: 'text-rose-500' },
    { id: 'page-number', name: 'Page Numbers', desc: 'Add Page X of Y', icon: Hash, color: 'text-purple-500' },
    { id: 'editor', name: 'PDF Editor', desc: 'Text, Sign & Stamps', icon: Edit3, color: 'text-sky-500' },
    { id: 'image-to-pdf', name: 'Image to PDF', desc: 'Convert JPG/PNG to PDF', icon: ImageIcon, color: 'text-indigo-500' },
    { id: 'pdf-to-image', name: 'PDF to Image', desc: 'Extract pages to JPG', icon: FileImage, color: 'text-orange-500' },
    { id: 'multi-pipeline', name: 'Multi-Tool Studio', desc: 'Combo All-in-One', icon: Sparkles, color: 'text-pink-500' }
  ];

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowToolsDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectTool = (toolId) => {
    if (setActiveView) setActiveView(toolId);
    if (setShowAdminView) setShowAdminView(false);
    setShowToolsDropdown(false);
  };

  const handleSelectPlatform = (platformId) => {
    if (setActiveView) setActiveView('studio');
    if (setShowAdminView) setShowAdminView(false);
    setPlatform(platformId);
  };

  const isToolActive = activeView && activeView !== 'studio' && !showAdminView;
  const isMergeActive = activeView === 'merge' && !showAdminView;

  return (
    <header className={`border-b px-4 sm:px-6 py-3 sticky top-0 z-50 backdrop-blur-md transition-colors ${
      darkMode ? 'bg-[#0f172a]/95 border-slate-800 text-white' : 'bg-white/95 border-slate-200 text-slate-800'
    }`}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
      {/* 1. Logo & Branding */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div 
            onClick={() => { if (setActiveView) setActiveView('studio'); if (setShowAdminView) setShowAdminView(false); }}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            
            {/* Logo */}
            <div className="flex items-center justify-center shrink-0">
              <img src="/logo.png" alt="MyPDFClub Logo" className="h-10 w-auto object-contain" />
            </div>

            {/* Brand Name & Badge */}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  MyPDFClub
                </h1>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  darkMode ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-200'
                }`}>
                  v2.0
                </span>
              </div>
              <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Smart E-Commerce &amp; PDF Suite</p>
            </div>

          </div>

          {/* Mobile Admin & Theme Controls */}
          <div className="flex md:hidden items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => setShowAdminView(!showAdminView)}
                className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 ${
                  showAdminView 
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-500' 
                    : darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <ShieldAlert size={14} />
              </button>
            )}

            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-xl border transition ${
                darkMode ? 'bg-slate-800 border-slate-700 text-amber-400' : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}
            >
              {darkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {currentUser ? (
              <button onClick={logout} className="p-2 rounded-xl border border-rose-500/30 text-rose-500">
                <LogOut size={15} />
              </button>
            ) : (
              <button onClick={loginWithGoogle} className="p-2 rounded-xl bg-blue-600 text-white text-xs font-bold">
                <LogIn size={15} />
              </button>
            )}
          </div>
        </div>

        {/* 2. Main Navigation Bar: Marketplaces + Merge PDF + PDF Tools Dropdown */}
        {!showAdminView ? (
          <div className="flex flex-wrap items-center justify-center gap-2 w-full md:w-auto">
            {/* Marketplace Selector (Flipkart / Meesho / Amazon) */}
            <div className={`p-1 rounded-xl flex items-center shadow-sm border ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100/90 border-slate-200'
            }`}>
              {platforms?.map((p) => {
                const isActive = platform === p.id && (!activeView || activeView === 'studio');
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPlatform(p.id)}
                    className={`py-1.5 px-3.5 sm:px-4 rounded-lg text-xs font-bold transition-all duration-200 ${
                      isActive 
                        ? `${activePlatform?.activeBg || 'bg-blue-600'} text-white shadow-sm` 
                        : darkMode 
                          ? 'text-slate-400 hover:text-slate-200' 
                          : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>

            {/* ✅ Divider between platforms and Merge PDF */}
            <div className={`w-px h-5 mx-1 hidden sm:block ${darkMode ? 'bg-slate-700' : 'bg-slate-300'}`}></div>

            {/* ✅ Direct "Merge PDF" Button (moved out of dropdown) */}
            <button
              type="button"
              onClick={() => {
                if (setActiveView) setActiveView('merge');
                if (setShowAdminView) setShowAdminView(false);
              }}
              className={`py-2 px-3.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border shadow-sm ${
                isMergeActive
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-indigo-500/20'
                  : darkMode
                    ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
              }`}
              title="Merge multiple PDFs into one"
            >
              <Files size={14} className={isMergeActive ? 'text-white' : 'text-indigo-500'} />
              <span>Merge PDF</span>
            </button>

            {/* "All PDF Tools" Button with Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowToolsDropdown((prev) => !prev)}
                className={`py-2 px-3.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border shadow-sm ${
                  isToolActive
                    ? 'bg-[#e5322d] text-white border-red-600 shadow-red-500/20'
                    : showToolsDropdown
                    ? darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900 ring-2 ring-red-500/20'
                    : darkMode 
                      ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' 
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <Sparkles size={14} className={isToolActive ? 'text-white' : 'text-red-500'} />
                <span>PDF Tools</span>
                <ChevronDown size={13} className={`transition-transform duration-200 ${showToolsDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Tools Megamenu Dropdown */}
              {showToolsDropdown && (
                <div className={`absolute top-full left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 mt-2 w-72 sm:w-80 rounded-2xl border shadow-2xl p-2 grid grid-cols-1 gap-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150 ${
                  darkMode ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200 shadow-slate-300/50'
                }`}>
                  <div className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                    darkMode ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    Free PDF Utilities (100% Client-Side)
                  </div>

                  {pdfTools.map((tool) => {
                    const Icon = tool.icon;
                    const isSelected = activeView === tool.id;
                    return (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => handleSelectTool(tool.id)}
                        className={`p-2 rounded-xl text-left flex items-center gap-3 transition ${
                          isSelected
                            ? 'bg-red-500/10 border border-red-500/30'
                            : darkMode
                            ? 'hover:bg-slate-800/80 border border-transparent'
                            : 'hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <div className={`p-2 rounded-lg shrink-0 ${
                          darkMode ? 'bg-slate-800' : 'bg-slate-100'
                        } ${tool.color}`}>
                          <Icon size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-bold leading-tight ${
                            isSelected ? 'text-red-600' : darkMode ? 'text-slate-200' : 'text-slate-800'
                          }`}>
                            {tool.name}
                          </p>
                          <p className={`text-[10px] leading-tight mt-0.5 truncate ${
                            darkMode ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            {tool.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className={`flex items-center gap-2 text-xs font-bold px-4 py-1.5 rounded-xl border ${
            darkMode ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' : 'border-amber-300 bg-amber-50 text-amber-700'
          }`}>
            <ShieldAlert size={15} />
            <span>Admin Control Center Active</span>
          </div>
        )}

        {/* 3. Desktop Admin, Theme & User Profile Actions */}
        <div className="hidden md:flex items-center gap-3">
          
          {/* Admin Switch Button */}
          {isAdmin && (
            <button
              onClick={() => setShowAdminView(!showAdminView)}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition ${
                showAdminView 
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20' 
                  : darkMode
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
              }`}
            >
              {showAdminView ? (
                <>
                  <ArrowLeft size={14} />
                  <span>Back to Tool</span>
                </>
              ) : (
                <>
                  <ShieldAlert size={14} />
                  <span>Admin Panel</span>
                </>
              )}
            </button>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-xl border transition ${
              darkMode 
                ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' 
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
            }`}
            title="Toggle Dark/Light Mode"
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* User Profile / Auth State */}
          {currentUser ? (
            <div className={`flex items-center gap-3 border pl-3 pr-2 py-1 rounded-xl ${
              darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
            }`}>
              <div className="flex flex-col text-right">
                <span className="text-xs font-semibold truncate max-w-[120px]">
                  {currentUser.displayName || currentUser.email}
                </span>
                <span className={`text-[10px] font-bold ${isPro ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {isAdmin ? 'ADMIN (PRO)' : isPro ? 'PRO UNLIMITED' : 'FREE TIER'}
                </span>
              </div>
              <button 
                onClick={logout}
                className="p-1.5 hover:bg-rose-500/20 rounded-lg text-slate-400 hover:text-rose-500 transition"
                title="Logout"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button 
              onClick={loginWithGoogle}
              className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm shadow-blue-600/20"
            >
              <LogIn size={14} />
              <span>Sign In</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}