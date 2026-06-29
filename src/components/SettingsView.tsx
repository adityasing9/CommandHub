import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { Settings, Key, Trash2, Clock, Save, Plus, X } from 'lucide-react';
import { motion } from 'framer-motion';

export function SettingsView() {
  const { settings, saveSetting, fetchSettings, history, fetchHistory, clearHistory, createCustomCommand } = useStore();
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [showAddCmd, setShowAddCmd] = useState(false);
  const [newCmd, setNewCmd] = useState({ title: '', syntax: '', description: '', risk_level: 'green' });

  useEffect(() => {
    fetchSettings();
    fetchHistory();
  }, []);

  useEffect(() => {
    setApiKey(settings['openrouter_api_key'] || '');
  }, [settings]);

  const handleSaveKey = async () => {
    await saveSetting('openrouter_api_key', apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAddCustomCmd = async () => {
    if (!newCmd.title || !newCmd.syntax) return;
    await createCustomCommand(newCmd);
    setNewCmd({ title: '', syntax: '', description: '', risk_level: 'green' });
    setShowAddCmd(false);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto w-full space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
          <Settings size={28} className="text-zinc-400"/> Settings
        </h1>
        <p className="text-zinc-400 text-sm">Configure CommandHub to your preferences</p>
      </div>

      {/* AI Settings */}
      <section className="glass-panel p-6 rounded-xl space-y-4">
        <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2"><Key size={18} className="text-purple-400"/> AI Configuration</h2>
        <div>
          <label className="block text-sm text-zinc-400 mb-2">OpenRouter API Key</label>
          <div className="flex gap-3">
            <input
              type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
              placeholder="sk-or-..."
              className="flex-1 bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-purple-500/50 transition-colors"
            />
            <button onClick={handleSaveKey}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${saved ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'}`}>
              <Save size={14}/> {saved ? 'Saved!' : 'Save'}
            </button>
          </div>
          <p className="text-xs text-zinc-600 mt-2">Get your free key at <a href="https://openrouter.ai" target="_blank" className="text-purple-400 hover:underline">openrouter.ai</a>. Used for AI explanations and natural language search.</p>
        </div>
      </section>

      {/* Custom Commands */}
      <section className="glass-panel p-6 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2"><Plus size={18} className="text-blue-400"/> Custom Commands</h2>
          <button onClick={() => setShowAddCmd(!showAddCmd)}
            className="text-sm text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
            {showAddCmd ? <><X size={14}/> Cancel</> : <><Plus size={14}/> Add Command</>}
          </button>
        </div>
        {showAddCmd && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 bg-white/5 rounded-xl p-4 border border-white/10">
            <input value={newCmd.title} onChange={e => setNewCmd({...newCmd, title: e.target.value})}
              placeholder="Command Title *" className="w-full bg-zinc-950/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none focus:border-blue-500/50 transition-colors"/>
            <input value={newCmd.syntax} onChange={e => setNewCmd({...newCmd, syntax: e.target.value})}
              placeholder="Command Syntax * (e.g. echo hello)" className="w-full bg-zinc-950/50 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-zinc-200 outline-none focus:border-blue-500/50 transition-colors"/>
            <input value={newCmd.description} onChange={e => setNewCmd({...newCmd, description: e.target.value})}
              placeholder="Description" className="w-full bg-zinc-950/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none focus:border-blue-500/50 transition-colors"/>
            <div className="flex items-center gap-3">
              <label className="text-xs text-zinc-400">Risk Level:</label>
              {(['green','yellow','red'] as const).map(r => (
                <button key={r} onClick={() => setNewCmd({...newCmd, risk_level: r})}
                  className={`text-xs px-3 py-1 rounded-full border transition-all ${newCmd.risk_level === r ? (r === 'green' ? 'bg-green-500/20 text-green-400 border-green-500/30' : r === 'yellow' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30') : 'border-white/10 text-zinc-500 hover:border-white/20'}`}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
            <button onClick={handleAddCustomCmd}
              className="w-full py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 text-sm font-medium transition-colors">
              Add to Library
            </button>
          </motion.div>
        )}
      </section>

      {/* Execution History */}
      <section className="glass-panel p-6 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2"><Clock size={18} className="text-blue-400"/> Execution History</h2>
          {history.length > 0 && (
            <button onClick={clearHistory}
              className="text-sm text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
              <Trash2 size={14}/> Clear All
            </button>
          )}
        </div>
        {history.length === 0 ? (
          <p className="text-zinc-600 text-sm text-center py-4">No commands executed yet.</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-auto pr-1">
            {history.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2.5 border border-white/5">
                <div className={`w-2 h-2 rounded-full shrink-0 ${entry.exit_code === 0 ? 'bg-green-500' : entry.exit_code == null ? 'bg-zinc-500' : 'bg-red-500'}`}/>
                <code className="text-xs text-zinc-300 flex-1 truncate">{entry.raw_command}</code>
                <span className="text-[10px] text-zinc-600 shrink-0">{new Date(entry.executed_at).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* App Info */}
      <section className="glass-panel p-6 rounded-xl">
        <h2 className="text-lg font-semibold text-zinc-100 mb-4">About CommandHub</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            ['Version', '1.0.0'],
            ['License', 'MIT'],
            ['Repository', 'github.com/adityasing9/CommandHub'],
            ['Backend', 'Python FastAPI + SQLite'],
            ['Frontend', 'React + TypeScript + Tailwind'],
            ['Desktop', 'Tauri (Rust)'],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="text-zinc-500 text-xs mb-0.5">{k}</div>
              <div className="text-zinc-300 text-sm">{v}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
