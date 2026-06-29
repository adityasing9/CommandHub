import React, { useState, useEffect, useCallback } from 'react';
import {
  Terminal, Search, Library, Settings, Star, Layers, Home, Package, PlusCircle,
  Command as CmdIcon, ChevronRight, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardView } from './components/DashboardView';
import { LibraryView } from './components/LibraryView';
import { PackageManagerView } from './components/PackageManagerView';
import { CommandBuilderView } from './components/CommandBuilderView';
import { FavoritesView } from './components/FavoritesView';
import { PluginsView } from './components/PluginsView';
import { SettingsView } from './components/SettingsView';
import { TerminalPane } from './components/Terminal';
import { useStore } from './store';

const TABS = [
  { id: 'dashboard', icon: Home,         label: 'Dashboard' },
  { id: 'search',    icon: Search,       label: 'Search' },
  { id: 'library',   icon: Library,      label: 'Library' },
  { id: 'packages',  icon: Package,      label: 'Packages' },
  { id: 'builder',   icon: PlusCircle,   label: 'Builder' },
  { id: 'favorites', icon: Star,         label: 'Favorites' },
  { id: 'plugins',   icon: Layers,       label: 'Plugins' },
  { id: 'settings',  icon: Settings,     label: 'Settings' },
];

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [backendOk, setBackendOk] = useState(false);
  const { searchQuery, setSearchQuery, commands, fetchCommands, fetchCategories, fetchFavorites } = useStore();

  // Check backend health & load theme
  useEffect(() => {
    fetch('http://127.0.0.1:8000/')
      .then(r => { if (r.ok) setBackendOk(true); })
      .catch(() => setBackendOk(false));
    fetchCategories();
    fetchFavorites();
    fetchCommands();
    
    // Load theme class
    const savedTheme = localStorage.getItem('cmdforge-theme');
    if (savedTheme && savedTheme !== 'dark') {
      document.body.className = '';
      document.body.classList.add(`theme-${savedTheme}`);
    }
  }, []);

  // Hotkey navigation: Ctrl+K focus search, Ctrl+Shift+T terminal toggle
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      setActiveTab('search');
      setTimeout(() => document.getElementById('global-search')?.focus(), 50);
    }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
      e.preventDefault();
      setTerminalOpen(v => !v);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#09090b] text-zinc-100 font-sans select-none">

      {/* Sidebar navigation */}
      <aside className="w-16 flex flex-col items-center py-5 bg-zinc-950/80 border-r border-white/5 z-10 shrink-0">
        <div className="mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
            <CmdIcon size={20}/>
          </div>
        </div>

        <nav className="flex flex-col gap-2 w-full px-2 flex-1 overflow-y-auto no-scrollbar">
          {TABS.map(tab => (
            <NavBtn key={tab.id} icon={<tab.icon size={18}/>} active={activeTab === tab.id}
              label={tab.label} onClick={() => setActiveTab(tab.id)}/>
          ))}
        </nav>

        <div className="px-2 w-full mt-auto pt-4 border-t border-white/5">
          <NavBtn icon={<Terminal size={18}/>} active={terminalOpen} label="Terminal"
            onClick={() => setTerminalOpen(v => !v)}/>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        
        {/* Header */}
        <header className="h-12 flex shrink-0 items-center px-5 border-b border-white/5 bg-zinc-950/60 backdrop-blur justify-between z-10">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <span>CmdForge</span>
            <ChevronRight size={13}/>
            <span className="text-zinc-200 capitalize">{activeTab}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setTerminalOpen(v => !v)}
              className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border ${terminalOpen ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' : 'bg-white/5 text-zinc-500 border-white/10 hover:bg-white/10'}`}>
              <Terminal size={13}/> Terminal
              <span className="text-[10px] text-zinc-600 hidden sm:block">Ctrl+Shift+T</span>
            </button>
            <div className={`text-xs px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 ${backendOk ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${backendOk ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]' : 'bg-red-400'}`}/>
              {backendOk ? 'Online' : 'Offline'}
            </div>
          </div>
        </header>

        {/* Content Views */}
        <div className="flex-1 overflow-auto relative">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"/>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-[120px] pointer-events-none"/>

          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                <DashboardView/>
              </motion.div>
            )}

            {activeTab === 'search' && (
              <motion.div key="search" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="max-w-3xl mx-auto mt-20 px-6 pb-20">
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-zinc-100 to-zinc-500 bg-clip-text text-transparent">
                  What do you want to run?
                </h1>
                <p className="text-zinc-500 mb-10">Search commands, paste errors, or ask AI in plain English.</p>

                <div className="relative group mb-12">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/15 to-purple-500/15 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity"/>
                  <div className="relative flex items-center bg-zinc-900/80 border border-white/10 rounded-2xl px-5 shadow-2xl backdrop-blur-md focus-within:border-blue-500/40 transition-colors">
                    <Search className="text-zinc-500 mr-3 shrink-0" size={22}/>
                    <input id="global-search" type="text" value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && searchQuery.trim() && setActiveTab('library')}
                      placeholder="Search commands or describe your problem..."
                      className="w-full bg-transparent outline-none text-lg py-4 text-zinc-100 placeholder:text-zinc-600 select-text"
                      autoFocus/>
                    <div className="flex gap-1 text-[10px] text-zinc-600 shrink-0">
                      <kbd className="bg-white/5 px-1.5 py-0.5 rounded border border-white/10">↵</kbd>
                      <span>to search</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
                  {[
                    { name: 'Windows', icon: '❖', color: 'from-blue-500/10 to-blue-600/5 border-blue-500/20' },
                    { name: 'Network', icon: '🌐', color: 'from-cyan-500/10 to-cyan-600/5 border-cyan-500/20' },
                    { name: 'Git', icon: '📦', color: 'from-orange-500/10 to-orange-600/5 border-orange-500/20' },
                    { name: 'Docker', icon: '🐳', color: 'from-sky-500/10 to-sky-600/5 border-sky-500/20' },
                    { name: 'PowerShell', icon: '💙', color: 'from-indigo-500/10 to-indigo-600/5 border-indigo-500/20' },
                    { name: 'Python', icon: '🐍', color: 'from-green-500/10 to-green-600/5 border-green-500/20' },
                    { name: 'Node.js', icon: '🟢', color: 'from-lime-500/10 to-lime-600/5 border-lime-500/20' },
                    { name: 'Security', icon: '🔒', color: 'from-red-500/10 to-red-600/5 border-red-500/20' },
                  ].map(cat => (
                    <button key={cat.name}
                      onClick={() => { setSearchQuery(''); setActiveTab('library'); useStore.getState().setActiveCategory(cat.name); }}
                      className={`bg-gradient-to-br ${cat.color} border rounded-xl p-4 text-left hover:scale-105 transition-transform group`}>
                      <div className="text-2xl mb-2 group-hover:scale-110 transition-transform origin-left">{cat.icon}</div>
                      <div className="text-sm font-medium text-zinc-300">{cat.name}</div>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-6 text-sm text-zinc-600">
                  <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"/>{commands.length} commands</span>
                  <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500"/>8 categories</span>
                  <span className="flex items-center gap-1.5"><Sparkles size={12} className="text-purple-400"/>AI powered</span>
                </div>
              </motion.div>
            )}

            {activeTab === 'library' && (
              <motion.div key="library" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                <LibraryView/>
              </motion.div>
            )}

            {activeTab === 'packages' && (
              <motion.div key="packages" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                <PackageManagerView/>
              </motion.div>
            )}

            {activeTab === 'builder' && (
              <motion.div key="builder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                <CommandBuilderView/>
              </motion.div>
            )}

            {activeTab === 'favorites' && (
              <motion.div key="favorites" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                <FavoritesView/>
              </motion.div>
            )}

            {activeTab === 'plugins' && (
              <motion.div key="plugins" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                <PluginsView/>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full overflow-auto">
                <SettingsView/>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Terminal Frame */}
        <AnimatePresence>
          {terminalOpen && (
            <motion.div key="terminal"
              initial={{ height: 0, opacity: 0 }} animate={{ height: 260, opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="border-t border-white/10 bg-[#09090b] flex flex-col shrink-0 overflow-hidden z-20">
              <div className="h-8 border-b border-white/5 flex items-center px-4 bg-zinc-950/80 text-xs text-zinc-500 shrink-0">
                <Terminal size={13} className="mr-2"/>
                <span>Terminal</span>
                <div className="ml-auto flex gap-4">
                  <button onClick={() => setTerminalOpen(false)} className="hover:text-zinc-200 transition-colors">✕ Close</button>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <TerminalPane/>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavBtn({ icon, active, label, onClick }: { icon: React.ReactNode; active: boolean; label: string; onClick: () => void }) {
  return (
    <button title={label} onClick={onClick}
      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all mx-auto shrink-0 ${
        active
          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.15)]'
          : 'text-zinc-600 hover:text-zinc-200 hover:bg-white/5 border border-transparent'
      }`}>
      {icon}
    </button>
  );
}

export default App;
