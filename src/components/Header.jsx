import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Scissors, Sun, Moon, LogIn, LogOut, ShieldAlert, ArrowLeft,
  ChevronDown, Files, Crop, RotateCw, Trash2, Hash, Edit3,
  Sparkles, Image as ImageIcon, FileImage
} from 'lucide-react';

export default function Header({
  platform,
  setPlatform,
  platforms,
  activePlatform,
  darkMode = false,
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
  const [themeIconKey, setThemeIconKey] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [navIndicator, setNavIndicator] = useState({ left: 0, width: 0, bg: 'bg-blue-600' });
  
  const dropdownRef = useRef(null);
  const navRef = useRef(null);
  const btnRefs = useRef({});

  // ─── PDF Tools List ───────────────────────────────────────
  const pdfTools = [
    { id: 'split', name: 'Split PDF', desc: 'Extract pages', icon: Scissors, color: 'text-amber-500' },
    { id: 'crop', name: 'Selected Crop', desc: 'Visual box crop', icon: Crop, color: 'text-emerald-500' },
    { id: 'rotate', name: 'Rotate PDF', desc: 'Rotate 90°/180°', icon: RotateCw, color: 'text-blue-500' },
    { id: 'remove', name: 'Remove Pages', desc: 'Delete pages', icon: Trash2, color: 'text-rose-500' },
    { id: 'page-number', name: 'Page Numbers', desc: 'Add X of Y', icon: Hash, color: 'text-purple-500' },
    { id: 'editor', name: 'PDF Editor', desc: 'Text & Signs', icon: Edit3, color: 'text-sky-500' },
    { id: 'image-to-pdf', name: 'Image → PDF', desc: 'JPG/PNG', icon: ImageIcon, color: 'text-indigo-500' },
    { id: 'pdf-to-image', name: 'PDF → Image', desc: 'Extract pages', icon: FileImage, color: 'text-orange-500' },
    { id: 'multi-pipeline', name: 'Multi Studio', desc: 'All-in-One', icon: Sparkles, color: 'text-pink-500' }
  ];

  // ─── Click Outside Dropdown ───────────────────────────────
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowToolsDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─── Scroll Shrink Effect ─────────────────────────────────
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ─── Sliding Indicator Update ─────────────────────────────
  const updateIndicator = useCallback(() => {
    const activeKey = 
      activeView === 'merge' ? 'merge' :
      activeView === 'studio' ? platform :
      null;

    if (!activeKey || !btnRefs.current[activeKey] || !navRef.current) return;

    const btn = btnRefs.current[activeKey];
    const nav = navRef.current;
    const btnRect = btn.getBoundingClientRect();
    const navRect = nav.getBoundingClientRect();

    setNavIndicator({
      left: btnRect.left - navRect.left,
      width: btnRect.width,
      bg: activeKey === 'merge' 
        ? 'bg-indigo-600' 
        : (activePlatform?.activeBg || 'bg-blue-600')
    });
  }, [activeView, platform, activePlatform]);

  useEffect(() => {
    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    // Small delay for initial mount to get correct dimensions
    const timer = setTimeout(updateIndicator, 100);
    return () => {
      window.removeEventListener('resize', updateIndicator);
      clearTimeout(timer);
    };
  }, [updateIndicator]);

  // ─── Handlers ─────────────────────────────────────────────
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

  const handleSelectMerge = () => {
    if (setActiveView) setActiveView('merge');
    if (setShowAdminView) setShowAdminView(false);
  };

  const handleToggleTheme = () => {
    setDarkMode(!darkMode);
    setThemeIconKey((prev) => prev + 1);
  };

  const handleGoHome = () => {
    if (setActiveView) setActiveView('studio');
    if (setShowAdminView) setShowAdminView(false);
  };

  const isToolActive = activeView && activeView !== 'studio' && activeView !== 'merge' && !showAdminView;
  const isMergeActive = activeView === 'merge' && !showAdminView;

  // ─── Style tokens ─────────────────────────────────────────
  const divider = darkMode ? 'bg-white/[0.08]' : 'bg-slate-300/70';
  const btnBase = darkMode 
    ? 'bg-white/[0.04] border-white/[0.08] text-slate-300 hover:bg-white/[0.08] hover:border-white/[0.12]' 
    : 'bg-white/80 border-slate-200/80 text-slate-700 hover:bg-white hover:border-slate-300';

  return (
    <>
      {/* ═══════════ BACKDROP DIMMING ═══════════ */}
      {showToolsDropdown && (
        <div 
          className="backdrop-dim" 
          onClick={() => setShowToolsDropdown(false)}
        />
      )}

      {/* ═══════════ FLOATING HEADER ═══════════ */}
      <div className={`header-floating ${scrolled ? 'scrolled' : ''}`}>
        <header className={`header-pill ${scrolled ? 'scrolled' : ''} ${darkMode ? 'dark' : 'light'}`}>
          <div className="flex items-center justify-between gap-4 px-4 sm:px-5 py-2.5">
            
            {/* ═══════════════ 1. LEFT ZONE — BRAND ═══════════════ */}
            <div 
              onClick={handleGoHome}
              className="flex items-center gap-3 cursor-pointer select-none logo-hover group shrink-0"
            >
              {/* Logo with glow */}
              <div className="relative flex items-center justify-center shrink-0">
                <div className={`absolute inset-0 rounded-xl blur-lg opacity-0 transition-opacity duration-300 group-hover:opacity-60 ${
                  darkMode ? 'bg-indigo-500/40' : 'bg-indigo-400/30'
                }`}></div>
                <img 
                  src="/logo.png" 
                  alt="MyPDFClub" 
                  className="logo-img relative h-9 w-auto object-contain transition-transform duration-300" 
                />
              </div>

              {/* Brand Name */}
              <div className="hidden sm:block">
                <div className="flex items-center gap-2">
                  <h1 className={`text-base font-black tracking-tight logo-shimmer ${
                    darkMode ? 'logo-shimmer-dark' : 'logo-shimmer-light'
                  }`}>
                    MyPDFClub
                  </h1>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border float-badge ${
                    darkMode 
                      ? 'bg-blue-500/10 text-blue-300 border-blue-500/25' 
                      : 'bg-blue-50 text-blue-600 border-blue-200/70'
                  }`}>
                    v2.0
                  </span>
                </div>
                <p className={`text-[10px] font-medium leading-tight ${
                  darkMode ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Smart PDF Suite
                </p>
              </div>
            </div>

            {/* ═══════════════ 2. CENTER ZONE — NAVIGATION PILL ═══════════════ */}
            {!showAdminView && (
              <nav 
                ref={navRef}
                className={`sliding-nav hidden md:flex ${
                  darkMode 
                    ? 'bg-white/[0.04] border border-white/[0.06]' 
                    : 'bg-slate-100/70 border border-slate-200/60'
                }`}
              >
                {/* Sliding Indicator */}
                <div 
                  className={`sliding-nav-indicator ${navIndicator.bg}`}
                  style={{
                    transform: `translateX(${navIndicator.left}px)`,
                    width: `${navIndicator.width}px`,
                    left: 0
                  }}
                />

                {/* Platform Buttons */}
                {platforms?.map((p) => {
                  const isActive = platform === p.id && (!activeView || activeView === 'studio');
                  return (
                    <button
                      key={p.id}
                      ref={(el) => { btnRefs.current[p.id] = el; }}
                      onClick={() => handleSelectPlatform(p.id)}
                      className={`sliding-nav-btn py-1.5 px-3.5 rounded-full text-xs font-bold ${
                        isActive 
                          ? 'text-white' 
                          : darkMode 
                            ? 'text-slate-400 hover:text-white' 
                            : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {p.name}
                    </button>
                  );
                })}

                {/* Merge PDF */}
                <button
                  ref={(el) => { btnRefs.current['merge'] = el; }}
                  onClick={handleSelectMerge}
                  className={`sliding-nav-btn py-1.5 px-3.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                    isMergeActive 
                      ? 'text-white' 
                      : darkMode 
                        ? 'text-slate-400 hover:text-white' 
                        : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Files size={12} />
                  <span>Merge PDF</span>
                </button>
              </nav>
            )}

            {/* Mobile menu indicator */}
            {showAdminView && (
              <div className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border ${
                darkMode 
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' 
                  : 'border-amber-300/70 bg-amber-50 text-amber-700'
              }`}>
                <ShieldAlert size={14} className="animate-pulse" />
                <span>Admin Mode</span>
              </div>
            )}

            {/* ═══════════════ 3. RIGHT ZONE — TOOLS & PROFILE ═══════════════ */}
            <div className="flex items-center gap-2 shrink-0">
              
              {/* Admin Button (Desktop) */}
              {isAdmin && (
                <button
                  onClick={() => setShowAdminView(!showAdminView)}
                  className={`hidden sm:flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border btn-lift ${
                    showAdminView 
                      ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/30' 
                      : darkMode
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/25 hover:bg-amber-500/20'
                      : 'bg-amber-50 text-amber-700 border-amber-200/70 hover:bg-amber-100'
                  }`}
                >
                  {showAdminView ? <ArrowLeft size={13} /> : <ShieldAlert size={13} />}
                </button>
              )}

              {/* PDF Tools Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowToolsDropdown((prev) => !prev)}
                  className={`py-2 px-3 rounded-xl text-xs font-black transition-all duration-300 flex items-center gap-1.5 border btn-lift sparkle-wiggle ${
                    isToolActive
                      ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white border-red-600 shadow-lg shadow-red-500/30'
                      : showToolsDropdown
                      ? darkMode 
                        ? 'bg-white/[0.08] border-white/[0.12] text-white' 
                        : 'bg-white border-slate-300 text-slate-900 ring-2 ring-red-500/15'
                      : btnBase
                  }`}
                >
                  <Sparkles 
                    size={13} 
                    className={`transition-all duration-300 ${isToolActive ? 'text-white' : 'text-red-500'}`} 
                  />
                  <span className="hidden sm:inline">PDF Tools</span>
                  <ChevronDown 
                    size={12} 
                    className={`chevron-smooth ${showToolsDropdown ? 'rotate-180' : 'rotate-0'}`} 
                  />
                </button>

                {/* ──── DROPDOWN (2-COLUMN) ──── */}
                {showToolsDropdown && (
                  <div className={`absolute top-full right-0 mt-3 w-[340px] sm:w-[420px] rounded-2xl border p-2 z-50 animate-dropdown-in ${
                    darkMode 
                      ? 'bg-[#0f1420]/98 backdrop-blur-2xl border-white/[0.08] shadow-2xl shadow-black/60' 
                      : 'bg-white/98 backdrop-blur-2xl border-slate-200/80 shadow-2xl shadow-slate-400/20'
                  }`}>
                    {/* Header */}
                    <div className={`px-3 py-2 mb-1 text-[10px] font-black uppercase tracking-[0.1em] flex items-center justify-between border-b ${
                      darkMode 
                        ? 'text-slate-500 border-white/[0.06]' 
                        : 'text-slate-400 border-slate-100'
                    }`}>
                      <span>⚡ PDF Utilities</span>
                      <span className="text-[9px] font-bold text-emerald-500">100% CLIENT-SIDE</span>
                    </div>

                    {/* 2-Column Grid */}
                    <div className="grid grid-cols-2 gap-1">
                      {pdfTools.map((tool, index) => {
                        const Icon = tool.icon;
                        const isSelected = activeView === tool.id;
                        return (
                          <button
                            key={tool.id}
                            type="button"
                            onClick={() => handleSelectTool(tool.id)}
                            style={{ animationDelay: `${index * 25}ms` }}
                            className={`p-2 rounded-xl text-left flex items-center gap-2.5 transition-all duration-200 animate-tool-item group/item ${
                              isSelected
                                ? darkMode 
                                  ? 'bg-gradient-to-r from-red-500/15 to-rose-500/10 border border-red-500/25' 
                                  : 'bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/60'
                                : darkMode
                                ? 'hover:bg-white/[0.05] border border-transparent'
                                : 'hover:bg-slate-50 border border-transparent'
                            }`}
                          >
                            <div className={`icon-container p-1.5 rounded-lg shrink-0 ${
                              darkMode ? 'bg-white/[0.05]' : 'bg-slate-100'
                            } ${tool.color}`}>
                              <Icon size={14} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`text-[11px] font-bold leading-tight truncate ${
                                isSelected 
                                  ? 'text-red-600 dark:text-red-400' 
                                  : darkMode ? 'text-slate-200' : 'text-slate-800'
                              }`}>
                                {tool.name}
                              </p>
                              <p className={`text-[9px] leading-tight truncate ${
                                darkMode ? 'text-slate-500' : 'text-slate-500'
                              }`}>
                                {tool.desc}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className={`w-px h-6 hidden sm:block divider-animate ${divider}`}></div>

              {/* Theme Toggle */}
              <button
                onClick={handleToggleTheme}
                className={`p-2 rounded-xl border btn-lift ${
                  darkMode 
                    ? 'bg-white/[0.04] border-white/[0.08] text-amber-400 hover:bg-white/[0.08]' 
                    : 'bg-slate-100/80 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
                title="Toggle Theme"
              >
                <div key={themeIconKey} className="icon-spin">
                  {darkMode ? <Sun size={15} /> : <Moon size={15} />}
                </div>
              </button>

              {/* User Profile / Sign In */}
              {currentUser ? (
                <div className={`hidden sm:flex items-center gap-2 border pl-2.5 pr-1.5 py-1 rounded-xl profile-hover ${
                  darkMode 
                    ? 'bg-white/[0.04] border-white/[0.08]' 
                    : 'bg-white/80 border-slate-200/80'
                }`}>
                  <div className="flex flex-col text-right leading-tight">
                    <span className="text-[11px] font-semibold truncate max-w-[90px]">
                      {currentUser.displayName || currentUser.email}
                    </span>
                    <span className={`text-[9px] font-black tracking-wider ${
                      isPro ? 'text-emerald-500' : 'text-amber-500'
                    }`}>
                      {isAdmin ? '★ ADMIN' : isPro ? '◆ PRO' : 'FREE'}
                    </span>
                  </div>
                  <button 
                    onClick={logout}
                    className="p-1.5 hover:bg-rose-500/15 rounded-lg text-slate-400 hover:text-rose-500 transition-all duration-200 hover:scale-110"
                    title="Logout"
                  >
                    <LogOut size={13} />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={loginWithGoogle}
                  className="group relative hidden sm:flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 hover:-translate-y-0.5 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  <LogIn size={13} className="relative" />
                  <span className="relative">Sign In</span>
                </button>
              )}

              {/* Mobile Sign In (icon only) */}
              {!currentUser && (
                <button 
                  onClick={loginWithGoogle}
                  className="sm:hidden p-2 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white btn-lift shadow-lg shadow-blue-500/25"
                >
                  <LogIn size={15} />
                </button>
              )}

              {currentUser && (
                <button 
                  onClick={logout}
                  className="sm:hidden p-2 rounded-xl border border-rose-500/30 text-rose-500 btn-lift"
                >
                  <LogOut size={15} />
                </button>
              )}
            </div>

          </div>

          {/* Mobile Platform Nav (below main bar) */}
          {!showAdminView && (
            <nav className={`md:hidden flex items-center gap-1 px-3 pb-2.5 overflow-x-auto scrollbar-hide border-t ${
              darkMode ? 'border-white/[0.06]' : 'border-slate-100'
            }`}>
              {platforms?.map((p) => {
                const isActive = platform === p.id && (!activeView || activeView === 'studio');
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPlatform(p.id)}
                    className={`flex-shrink-0 py-1.5 px-3 rounded-full text-[11px] font-bold transition-all duration-300 ${
                      isActive 
                        ? `${activePlatform?.activeBg || 'bg-blue-600'} text-white shadow-md` 
                        : darkMode 
                          ? 'text-slate-400 hover:text-white hover:bg-white/[0.06]' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}
              <div className={`w-px h-4 shrink-0 mx-1 ${divider}`}></div>
              <button
                onClick={handleSelectMerge}
                className={`flex-shrink-0 py-1.5 px-3 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all duration-300 ${
                  isMergeActive 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : darkMode 
                      ? 'text-slate-400 hover:text-white hover:bg-white/[0.06]' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <Files size={11} />
                <span>Merge</span>
              </button>
            </nav>
          )}
        </header>
      </div>
    </>
  );
}