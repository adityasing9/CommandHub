import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { Search, ChevronRight, Sparkles, X, Terminal as TerminalIcon, AlertTriangle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function LibraryView() {
  const { commands, fetchCommands, isLoading, explainCommand, searchQuery, setSearchQuery } = useStore();
  const [explaining, setExplaining] = useState<number | null>(null);
  const [explanation, setExplanation] = useState<any>(null);

  useEffect(() => {
    fetchCommands();
  }, [fetchCommands]);

  const handleExplain = async (cmdId: number, syntax: string) => {
    setExplaining(cmdId);
    setExplanation(null);
    const result = await explainCommand(syntax);
    setExplanation(result);
  };

  const riskColors = {
    green: "border-green-500/30 text-green-400 bg-green-500/10",
    yellow: "border-yellow-500/30 text-yellow-400 bg-yellow-500/10",
    red: "border-red-500/30 text-red-400 bg-red-500/10",
  };

  return (
    <div className="h-full flex flex-col p-6 max-w-6xl mx-auto w-full relative">
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-bold mb-1">Command Library</h1>
          <p className="text-zinc-400 text-sm">Browse, learn, and execute commands safely.</p>
        </div>
        
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter or ask AI (e.g. slow internet)..." 
            className="w-full bg-zinc-900/50 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-zinc-200 outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto pr-2 pb-20 custom-scrollbar">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {commands.map((cmd, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={cmd.id} 
                className="glass-panel p-5 rounded-xl flex flex-col group transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{cmd.category?.icon || '⚙️'}</span>
                    <h3 className="font-semibold text-zinc-100">{cmd.title}</h3>
                  </div>
                  <div className={`text-xs px-2 py-0.5 rounded-full border ${riskColors[cmd.risk_level as keyof typeof riskColors] || riskColors.green}`}>
                    {cmd.risk_level.toUpperCase()}
                  </div>
                </div>
                
                <p className="text-sm text-zinc-400 mb-4 line-clamp-2 flex-1">
                  {cmd.description}
                </p>

                <div className="bg-zinc-950/80 rounded-md p-3 font-mono text-xs text-zinc-300 border border-white/5 mb-4 overflow-x-auto whitespace-nowrap">
                  {cmd.syntax}
                </div>

                <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                   <div className="flex gap-2">
                     {cmd.tags?.split(',').map(tag => (
                       <span key={tag} className="text-[10px] text-zinc-500 bg-white/5 px-2 py-0.5 rounded-md">
                         #{tag.trim()}
                       </span>
                     ))}
                   </div>
                   <div className="flex gap-2">
                     <button 
                       onClick={() => handleExplain(cmd.id, cmd.syntax)}
                       className="text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 px-3 py-1.5 rounded-md text-sm font-medium flex items-center transition-colors"
                     >
                       <Sparkles size={14} className="mr-1" /> AI
                     </button>
                     <button className="text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-md text-sm font-medium flex items-center transition-colors">
                       Run <ChevronRight size={14} className="ml-1" />
                     </button>
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {explaining !== null && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm rounded-lg"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="flex justify-between items-center p-4 border-b border-white/10 bg-zinc-800/50">
                <div className="flex items-center gap-2 text-purple-400 font-semibold">
                  <Sparkles size={18} /> AI Command Analysis
                </div>
                <button onClick={() => { setExplaining(null); setExplanation(null); }} className="text-zinc-500 hover:text-zinc-300">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 overflow-auto custom-scrollbar flex-1 text-sm text-zinc-300">
                {!explanation ? (
                  <div className="flex flex-col items-center justify-center h-48 gap-4">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                     <p className="text-zinc-400">Analyzing command logic...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h4 className="flex items-center gap-2 text-zinc-100 font-medium mb-2"><Info size={16} className="text-blue-400"/> Simple Explanation</h4>
                      <p className="bg-white/5 p-3 rounded-lg border border-white/5 text-zinc-200">{explanation.simple_explanation}</p>
                    </div>
                    
                    <div>
                      <h4 className="flex items-center gap-2 text-zinc-100 font-medium mb-2"><TerminalIcon size={16} className="text-green-400"/> Technical Breakdown</h4>
                      <p className="bg-white/5 p-3 rounded-lg border border-white/5 text-zinc-300 leading-relaxed">{explanation.advanced_explanation}</p>
                    </div>

                    {explanation.warnings && explanation.warnings.length > 0 && (
                      <div>
                        <h4 className="flex items-center gap-2 text-red-400 font-medium mb-2"><AlertTriangle size={16}/> Warnings</h4>
                        <ul className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-red-200/90 list-disc list-inside space-y-1">
                          {explanation.warnings.map((w: string, idx: number) => <li key={idx}>{w}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
