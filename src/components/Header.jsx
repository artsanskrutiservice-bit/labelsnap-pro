import React from 'react';
import { Scissors, Sun, Moon, LogIn, LogOut, ShieldAlert, ArrowLeft } from 'lucide-react';

export default function Header({
  platform,
  setPlatform,
  platforms,
  activePlatform,
  darkMode,
  setDarkMode,
  currentUser,
  isAdmin,
  isPro,
  loginWithGoogle,
  logout,
  showAdminView,
  setShowAdminView
}) {
  return (
    <header className={`border-b px-4 sm:px-6 py-3 sticky top-0 z-50 backdrop-blur-md transition-colors ${
      darkMode ? 'bg-[#0f172a]/95 border-slate-800' : 'bg-white/95 border-slate-200'
    }`}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* 1. Logo & Branding */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${activePlatform.activeBg} text-white shadow-md transition-colors duration-300`}>
              <Scissors size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  LabelSnap Pro
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  v2.0
                </span>
              </div>
              <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Smart E-Commerce Thermal Suite</p>
            </div>
          </div>

          {/* Mobile Admin & Theme Controls */}
          <div className="flex md:hidden items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => setShowAdminView(!showAdminView)}
                className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 ${
                  showAdminView 
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' 
                    : 'bg-slate-800 border-slate-700 text-slate-300'
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
              <button onClick={logout} className="p-2 rounded-xl border border-rose-500/30 text-rose-400">
                <LogOut size={15} />
              </button>
            ) : (
              <button onClick={loginWithGoogle} className="p-2 rounded-xl bg-blue-600 text-white text-xs font-bold">
                <LogIn size={15} />
              </button>
            )}
          </div>
        </div>

        {/* 2. Main 3 Marketplace Selector Tabs Inside Header */}
        {!showAdminView ? (
          <div className={`p-1 rounded-xl flex items-center relative w-full md:w-auto min-w-[340px] shadow-inner ${
            darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-slate-100'
          }`}>
            {platforms.map((p) => {
              const isActive = platform === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={`flex-1 py-1.5 px-4 rounded-lg text-xs font-bold transition-all duration-300 relative z-10 flex items-center justify-center gap-1.5 ${
                    isActive ? 'text-white' : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {p.name}
                </button>
              );
            })}

            {/* Animated Selection Pill */}
            <div 
              className={`absolute top-1 bottom-1 rounded-lg ${activePlatform.activeBg} transition-all duration-300 ease-out shadow-sm`}
              style={{
                width: `calc(100% / 3 - 3px)`,
                left: platform === 'flipkart' ? '3px' : platform === 'meesho' ? 'calc(100% / 3)' : 'calc((100% / 3) * 2 - 3px)'
              }}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-bold px-4 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
            <ShieldAlert size={15} />
            <span>Admin Control Center Active</span>
          </div>
        )}

        {/* 3. Desktop Admin, Theme & User Profile Actions */}
        <div className="hidden md:flex items-center gap-3">
          
          {/* Admin Switch Button (Only for Admin) */}
          {isAdmin && (
            <button
              onClick={() => setShowAdminView(!showAdminView)}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition ${
                showAdminView 
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20' 
                  : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
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

          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-xl border transition ${
              darkMode ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
            }`}
            title="Toggle Dark/Light Mode"
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {currentUser ? (
            <div className={`flex items-center gap-3 border pl-3 pr-2 py-1 rounded-xl ${
              darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
            }`}>
              <div className="flex flex-col text-right">
                <span className="text-xs font-semibold truncate max-w-[120px]">
                  {currentUser.displayName || currentUser.email}
                </span>
                <span className={`text-[10px] font-bold ${isPro ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {isAdmin ? 'ADMIN (PRO)' : isPro ? 'PRO UNLIMITED' : 'FREE TIER'}
                </span>
              </div>
              <button 
                onClick={logout}
                className="p-1.5 hover:bg-rose-500/20 rounded-lg text-slate-400 hover:text-rose-400 transition"
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