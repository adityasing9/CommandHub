import { useEffect, useState } from 'react';
import { useStore } from '../store';
import {
  Settings, Key, Trash2, Clock, Save, Paintbrush,
  Download, Upload, AlertCircle
} from 'lucide-react';

const THEMES = [
  { id: 'dark',        name: 'Dark Mode (Default)', color: 'bg-[#09090b]' },
  { id: 'amoled',      name: 'AMOLED Black',        color: 'bg-black' },
  { id: 'dracula',     name: 'Dracula',             color: 'bg-[#282a36]' },
  { id: 'nord',        name: 'Nord Ice',            color: 'bg-[#2e3440]' },
  { id: 'catppuccin',  name: 'Catppuccin Mocha',    color: 'bg-[#1e1e2e]' },
  { id: 'light',       name: 'Light Mode',          color: 'bg-[#f4f4f5] border-zinc-300 border' },
];

export function SettingsView() {
  const { settings, saveSetting, fetchSettings, history, fetchHistory, clearHistory } = useStore();
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  
  // Theme state
  const [theme, setTheme] = useState(localStorage.getItem('cmdforge-theme') || 'dark');

  // Import/Export state
  const [importJson, setImportJson] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [exportUrl, setExportUrl] = useState<string | null>(null);

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

  const handleThemeChange = (id: string) => {
    setTheme(id);
    localStorage.setItem('cmdforge-theme', id);
    document.body.className = '';
    if (id !== 'dark') {
      document.body.classList.add(`theme-${id}`);
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/export');
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        setExportUrl(url);
      }
    } catch {}
  };

  const handleImport = async () => {
    if (!importJson.trim()) return;
    try {
      const parsed = JSON.parse(importJson);
      const res = await fetch('http://127.0.0.1:8000/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      if (res.ok) {
        const data = await res.json();
        setImportStatus(data.message || 'Imported successfully!');
        setImportJson('');
      } else {
        setImportStatus('Failed to import commands.');
      }
    } catch (e) {
      setImportStatus('Invalid JSON format.');
    }
    setTimeout(() => setImportStatus(null), 3000);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto w-full space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
          <Settings size={28} className="text-zinc-400"/> Settings
        </h1>
        <p className="text-zinc-400 text-sm">Configure themes, keys, and backup custom libraries</p>
      </div>

      {/* Theme Options */}
      <section className="glass-panel p-6 rounded-xl space-y-4">
        <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2"><Paintbrush size={18} className="text-blue-400"/> Themes</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {THEMES.map(t => (
            <button key={t.id} onClick={() => handleThemeChange(t.id)}
              className={`p-3 rounded-xl border flex items-center gap-3 text-left transition-all ${
                theme === t.id
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/40 shadow-lg'
                  : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10 hover:text-zinc-200'
              }`}>
              <span className={`w-4 h-4 rounded-full shrink-0 ${t.color}`}/>
              <span className="text-xs font-semibold">{t.name}</span>
            </button>
          ))}
        </div>
      </section>

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

      {/* Import / Export Settings */}
      <section className="glass-panel p-6 rounded-xl space-y-4">
        <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2"><Upload size={18} className="text-emerald-400"/> Import / Export</h2>
        <div className="space-y-4">
          
          <div className="flex gap-3">
            <button onClick={handleExport}
              className="flex-1 py-2.5 bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors">
              <Download size={14}/> Generate Backup JSON
            </button>
            {exportUrl && (
              <a href={exportUrl} download="cmdforge-backup.json"
                className="px-4 py-2.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border border-emerald-500/30 transition-colors">
                Download file
              </a>
            )}
          </div>

          <div className="border-t border-white/5 pt-4 space-y-2">
            <label className="block text-xs font-semibold text-zinc-400">Import Commands (Paste JSON array)</label>
            <textarea
              value={importJson} onChange={e => setImportJson(e.target.value)}
              placeholder='{ "commands": [ { "title": "Test", "syntax": "echo test", "description": "test", "tags": "test" } ] }'
              className="w-full h-24 bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-2.5 font-mono text-xs text-zinc-200 outline-none focus:border-emerald-500/50 transition-colors resize-none"
            />
            <button onClick={handleImport}
              className="w-full py-2.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors">
              <Upload size={14}/> Import Data
            </button>
            {importStatus && (
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-2">
                <AlertCircle size={14} className="text-blue-400"/> {importStatus}
              </div>
            )}
          </div>

        </div>
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
        <h2 className="text-lg font-semibold text-zinc-100 mb-4">About CmdForge</h2>
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
