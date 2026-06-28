import { useState } from "react";
import { Terminal, Search, Library, Settings, Star, Layers, Command as CmdIcon, ChevronRight } from "lucide-react";
import { LibraryView } from "./components/LibraryView";
import { TerminalPane } from "./components/Terminal";
import { motion } from "framer-motion";
import { useStore } from "./store";

function App() {
  const [activeTab, setActiveTab] = useState("search");
  const [terminalOpen, setTerminalOpen] = useState(true);
  const { searchQuery, setSearchQuery } = useStore();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--color-background)] text-[var(--color-foreground)]">
      
      {/* Sidebar */}
      <aside className="w-16 flex flex-col items-center py-6 glass border-r border-white/5 relative z-10">
        <div className="mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <CmdIcon size={22} />
          </div>
        </div>

        <nav className="flex flex-col gap-4 w-full px-2 flex-1">
          <NavItem icon={<Search size={20} />} active={activeTab === "search"} onClick={() => setActiveTab("search")} />
          <NavItem icon={<Library size={20} />} active={activeTab === "library"} onClick={() => setActiveTab("library")} />
          <NavItem icon={<Star size={20} />} active={activeTab === "favorites"} onClick={() => setActiveTab("favorites")} />
          <NavItem icon={<Layers size={20} />} active={activeTab === "plugins"} onClick={() => setActiveTab("plugins")} />
        </nav>

        <div className="mt-auto flex flex-col gap-4 w-full px-2">
          <NavItem icon={<Settings size={20} />} active={activeTab === "settings"} onClick={() => setActiveTab("settings")} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-0 h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-14 flex shrink-0 items-center px-6 border-b border-white/5 glass z-10 justify-between">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <span>CommandHub</span>
            <ChevronRight size={14} />
            <span className="text-zinc-100 capitalize">{activeTab}</span>
          </div>
          <div className="flex items-center gap-3">
             <button 
               onClick={() => setTerminalOpen(!terminalOpen)}
               className={`text-xs px-3 py-1.5 rounded-md flex items-center gap-2 transition-colors ${terminalOpen ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10'}`}
             >
               <Terminal size={14} /> Terminal
             </button>
             <div className="text-xs px-2 py-1.5 rounded-md bg-white/5 border border-white/10 text-zinc-400 flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span> Local Backend
             </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto relative custom-scrollbar">
          
          {/* Decorative background blob */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

          {activeTab === "search" && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto mt-20 px-6"
            >
              <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-500">
                What do you want to run?
              </h1>
              <p className="text-zinc-400 mb-8">Search for commands, scripts, or ask AI for help.</p>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl transition-opacity opacity-50 group-hover:opacity-100" />
                <div className="relative flex items-center bg-zinc-900/80 border border-white/10 rounded-2xl p-2 px-4 shadow-2xl backdrop-blur-md">
                  <Search className="text-zinc-400 mr-3" size={24} />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        setActiveTab('library');
                      }
                    }}
                    placeholder="Search commands or ask a question... (Ctrl+K)" 
                    className="w-full bg-transparent border-none outline-none text-lg py-3 text-zinc-100 placeholder:text-zinc-500"
                    autoFocus
                  />
                  <div className="flex items-center gap-1 text-xs text-zinc-500 bg-white/5 px-2 py-1 rounded-md border border-white/5">
                    <kbd>Ctrl</kbd> + <kbd>K</kbd>
                  </div>
                </div>
              </div>

              {/* Quick Actions / Categories */}
              <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
                 {[
                   { name: "Windows", icon: "❖" },
                   { name: "Network", icon: "🌐" },
                   { name: "Git", icon: "📦" },
                   { name: "Docker", icon: "🐳" },
                 ].map((cat) => (
                   <div key={cat.name} className="glass-panel rounded-xl p-4 cursor-pointer hover:bg-white/10 transition-all hover:border-white/20 group">
                      <div className="text-2xl mb-2 group-hover:scale-110 transition-transform origin-left">{cat.icon}</div>
                      <div className="text-sm font-medium text-zinc-300 group-hover:text-zinc-100 transition-colors">{cat.name}</div>
                   </div>
                 ))}
              </div>
            </motion.div>
          )}

          {activeTab === "library" && <LibraryView />}

          {activeTab !== "search" && activeTab !== "library" && (
            <div className="text-center text-zinc-500 mt-20">
              <p>Content for {activeTab} will be implemented in the next phase.</p>
            </div>
          )}
        </div>

        {/* Collapsible Terminal Pane */}
        {terminalOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 250, opacity: 1 }}
            className="border-t border-white/10 bg-[#09090b] flex flex-col relative z-20 shrink-0"
          >
            <div className="h-8 border-b border-white/5 flex items-center px-4 bg-zinc-900/50 text-xs text-zinc-400">
              <Terminal size={14} className="mr-2" /> 
              <span>Terminal</span>
              <div className="ml-auto flex gap-4">
                <button className="hover:text-zinc-200 transition-colors">Clear</button>
                <button onClick={() => setTerminalOpen(false)} className="hover:text-zinc-200 transition-colors">Close</button>
              </div>
            </div>
            <div className="flex-1 relative overflow-hidden">
              <TerminalPane />
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}

function NavItem({ icon, active, onClick }: { icon: React.ReactNode, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
        active 
        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]" 
        : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5 border border-transparent"
      }`}
    >
      {icon}
    </button>
  )
}

export default App;
