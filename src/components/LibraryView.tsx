import React, { useEffect, useState, useRef } from 'react';
import { useStore, Command } from '../store';
import {
  Search, ChevronRight, Sparkles, X, AlertTriangle, Info, Terminal as TerminalIcon,
  Star, Copy, Check, Play, ShieldAlert, ShieldCheck, ShieldX, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const RISK = {
  green:  { label: 'SAFE',      cls: 'border-green-500/30 text-green-400 bg-green-500/10', icon: <ShieldCheck size={12}/> },
  yellow: { label: 'CAUTION',   cls: 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10', icon: <ShieldAlert size={12}/> },
  red:    { label: 'DANGER',    cls: 'border-red-500/30 text-red-400 bg-red-500/10', icon: <ShieldX size={12}/> },
};

export function LibraryView() {
  const {
    commands, categories, fetchCommands, fetchCategories, isLoading,
    explainCommand, searchQuery, setSearchQuery, activeCategory, setActiveCategory,
    toggleFavorite, favorites, executeCommand
  } = useStore();

  const [explaining, setExplaining] = useState<number | null>(null);
  const [explanation, setExplanation] = useState<any>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const [running, setRunning] = useState<Command | null>(null);
  const [runOutput, setRunOutput] = useState('');
  const [confirmCmd, setConfirmCmd] = useState<Command | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchCommands(); fetchCategories(); }, []);

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [runOutput]);

  const handleExplain = async (cmd: Command) => {
    setExplaining(cmd.id); setExplanation(null);
    const result = await explainCommand(cmd.syntax);
    setExplanation(result);
  };

  const handleCopy = (cmd: Command) => {
    navigator.clipboard.writeText(cmd.syntax);
    setCopied(cmd.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleRunClick = (cmd: Command) => {
    if (cmd.risk_level === 'red' || cmd.risk_level === 'yellow') {
      setConfirmCmd(cmd);
    } else {
      runCommand(cmd);
    }
  };

  const runCommand = async (cmd: Command) => {
    setConfirmCmd(null);
    setRunning(cmd);
    setRunOutput('Executing...\n');
    const output = await executeCommand(cmd.syntax);
    setRunOutput(output);
  };

  const allCats = ['All', ...categories.map(c => c.name)];

  return (
    <div className="h-full flex flex-col p-6 max-w-7xl mx-auto w-full relative">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 shrink-0 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold mb-1">Command Library</h1>
          <p className="text-zinc-400 text-sm">{commands.length} commands · Browse, copy, and execute safely</p>
        </div>
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16}/>
          <input
            type="text" value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search or ask AI (e.g. slow internet)..."
            className="w-full bg-zinc-900/60 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-sm text-zinc-200 outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 mb-6 overflow-x-auto shrink-0 pb-1 no-scrollbar">
        {allCats.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
              activeCategory === cat
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                : 'bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10 hover:text-zinc-200'
            }`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto pb-4 pr-1">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"/>
          </div>
        ) : commands.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-zinc-500 gap-2">
            <Search size={32} className="opacity-30"/>
            <p>No commands found. Try a different search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {commands.map((cmd, i) => {
              const risk = RISK[cmd.risk_level as keyof typeof RISK] || RISK.green;
              const isFav = favorites.includes(cmd.id);
              return (
                <motion.div key={cmd.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  className="glass-panel p-5 rounded-xl flex flex-col gap-3 group hover:border-white/15 transition-all">

                  {/* Top row */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg shrink-0">{cmd.category?.icon || '⚙️'}</span>
                      <h3 className="font-semibold text-zinc-100 text-sm leading-tight truncate">{cmd.title}</h3>
                    </div>
                    <div className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${risk.cls}`}>
                      {risk.icon} {risk.label}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{cmd.description}</p>

                  {/* Syntax block */}
                  <div className="bg-zinc-950/80 rounded-lg p-2.5 font-mono text-xs text-zinc-300 border border-white/5 overflow-x-auto whitespace-nowrap selectable">
                    {cmd.syntax}
                  </div>

                  {/* Tags */}
                  {cmd.tags && (
                    <div className="flex gap-1.5 flex-wrap">
                      {cmd.tags.split(',').slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] text-zinc-600 bg-white/5 px-1.5 py-0.5 rounded">
                          #{tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-auto pt-2 border-t border-white/5">
                    {/* Favorite */}
                    <button onClick={() => toggleFavorite(cmd.id)}
                      className={`p-1.5 rounded-lg transition-all ${isFav ? 'text-yellow-400 bg-yellow-500/10' : 'text-zinc-600 hover:text-zinc-300 hover:bg-white/5'}`}>
                      <Star size={14} fill={isFav ? 'currentColor' : 'none'}/>
                    </button>

                    {/* Copy */}
                    <button onClick={() => handleCopy(cmd)}
                      className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-white/5 transition-all">
                      {copied === cmd.id ? <Check size={14} className="text-green-400"/> : <Copy size={14}/>}
                    </button>

                    {/* AI Explain */}
                    <button onClick={() => handleExplain(cmd)}
                      className="ml-auto text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors">
                      <Sparkles size={12}/> Explain
                    </button>

                    {/* Run */}
                    <button onClick={() => handleRunClick(cmd)}
                      className={`text-xs font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                        cmd.risk_level === 'red'
                          ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25'
                          : cmd.risk_level === 'yellow'
                          ? 'bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/25'
                          : 'bg-blue-500/15 text-blue-400 hover:bg-blue-500/25'
                      }`}>
                      <Play size={12}/> Run
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Risk Confirmation Modal ── */}
      <AnimatePresence>
        {confirmCmd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm rounded-lg">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              className="bg-zinc-900 border border-yellow-500/30 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className={`p-4 border-b border-white/10 flex items-center gap-3 ${confirmCmd.risk_level === 'red' ? 'bg-red-500/10' : 'bg-yellow-500/10'}`}>
                <AlertTriangle size={20} className={confirmCmd.risk_level === 'red' ? 'text-red-400' : 'text-yellow-400'}/>
                <span className={`font-bold ${confirmCmd.risk_level === 'red' ? 'text-red-400' : 'text-yellow-400'}`}>
                  {confirmCmd.risk_level === 'red' ? 'DANGEROUS COMMAND' : 'CONFIRMATION REQUIRED'}
                </span>
              </div>
              <div className="p-6">
                <p className="text-zinc-300 mb-4">You are about to run:</p>
                <div className="bg-zinc-950 rounded-lg p-3 font-mono text-sm text-zinc-200 border border-white/10 mb-4">
                  {confirmCmd.syntax}
                </div>
                <p className="text-zinc-500 text-sm mb-6">{confirmCmd.description}</p>
                <div className="flex gap-3">
                  <button onClick={() => setConfirmCmd(null)}
                    className="flex-1 py-2 rounded-lg bg-white/5 text-zinc-400 hover:bg-white/10 transition-colors">
                    Cancel
                  </button>
                  <button onClick={() => runCommand(confirmCmd)}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${confirmCmd.risk_level === 'red' ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'}`}>
                    Yes, Execute
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Run Output Modal ── */}
      <AnimatePresence>
        {running && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm rounded-lg">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
              <div className="flex justify-between items-center p-4 border-b border-white/10 bg-zinc-800/50 shrink-0">
                <div className="flex items-center gap-2 text-green-400 font-mono text-sm">
                  <TerminalIcon size={16}/> {running.title}
                </div>
                <button onClick={() => { setRunning(null); setRunOutput(''); }}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors"><X size={20}/></button>
              </div>
              <div ref={outputRef}
                className="flex-1 p-4 font-mono text-xs text-green-400 bg-zinc-950/80 overflow-auto whitespace-pre-wrap selectable">
                {runOutput || <span className="animate-pulse text-zinc-500">Waiting for output...</span>}
              </div>
              <div className="p-3 border-t border-white/5 flex justify-end">
                <button onClick={() => navigator.clipboard.writeText(runOutput)}
                  className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                  <Copy size={12}/> Copy Output
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── AI Explain Modal ── */}
      <AnimatePresence>
        {explaining !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm rounded-lg">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              className="bg-zinc-900 border border-purple-500/20 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b border-white/10 bg-purple-500/10 shrink-0">
                <div className="flex items-center gap-2 text-purple-400 font-semibold"><Sparkles size={18}/> AI Command Analysis</div>
                <button onClick={() => { setExplaining(null); setExplanation(null); }} className="text-zinc-500 hover:text-zinc-300"><X size={20}/></button>
              </div>
              <div className="p-6 overflow-auto flex-1 text-sm text-zinc-300 space-y-5">
                {!explanation ? (
                  <div className="flex flex-col items-center h-40 justify-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"/>
                    <p className="text-zinc-500">Analyzing command...</p>
                  </div>
                ) : (<>
                  <div>
                    <h4 className="flex items-center gap-2 text-zinc-100 font-medium mb-2"><Info size={15} className="text-blue-400"/> Simple Explanation</h4>
                    <p className="bg-white/5 p-3 rounded-xl border border-white/5 text-zinc-200 selectable">{explanation.simple_explanation}</p>
                  </div>
                  <div>
                    <h4 className="flex items-center gap-2 text-zinc-100 font-medium mb-2"><TerminalIcon size={15} className="text-green-400"/> Technical Breakdown</h4>
                    <p className="bg-white/5 p-3 rounded-xl border border-white/5 text-zinc-300 leading-relaxed selectable">{explanation.advanced_explanation}</p>
                  </div>
                  {explanation.warnings?.length > 0 && (
                    <div>
                      <h4 className="flex items-center gap-2 text-red-400 font-medium mb-2"><AlertTriangle size={15}/> Warnings</h4>
                      <ul className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-red-200/90 list-disc list-inside space-y-1">
                        {explanation.warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}
                      </ul>
                    </div>
                  )}
                  {explanation.use_cases?.length > 0 && (
                    <div>
                      <h4 className="flex items-center gap-2 text-blue-400 font-medium mb-2"><Info size={15}/> Use Cases</h4>
                      <ul className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl text-blue-200/90 list-disc list-inside space-y-1">
                        {explanation.use_cases.map((u: string, i: number) => <li key={i}>{u}</li>)}
                      </ul>
                    </div>
                  )}
                </>)}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
