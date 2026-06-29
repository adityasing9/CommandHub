import { useState } from 'react';
import { Package, Search, Download, Terminal as TermIcon, ShieldAlert } from 'lucide-react';

export function PackageManagerView() {
  const [manager, setManager] = useState('winget');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string>('');
  const [installLog, setInstallLog] = useState<string>('');
  const [installingPkg, setInstallingPkg] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResults('');
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/packages/search?pm=${manager}&q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.output || data.error || 'No results found.');
      } else {
        setResults('Search failed.');
      }
    } catch {
      setResults('Error contacting package server.');
    }
    setLoading(false);
  };

  const handleInstall = async (pkgName: string) => {
    setInstallingPkg(pkgName);
    setInstallLog('Starting installation...\n');
    try {
      const res = await fetch('http://127.0.0.1:8000/api/packages/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manager, package_name: pkgName }),
      });
      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          setInstallLog(prev => prev + decoder.decode(value, { stream: true }));
        }
      } else {
        setInstallLog(prev => prev + '[ERROR] Install request failed.');
      }
    } catch (e) {
      setInstallLog(prev => prev + `[ERROR] ${e}`);
    }
  };

  const PMS = [
    { id: 'winget', name: 'WinGet (Windows)' },
    { id: 'choco', name: 'Chocolatey' },
    { id: 'scoop', name: 'Scoop' },
    { id: 'npm', name: 'npm (Global)' },
    { id: 'pip', name: 'pip (Python)' },
    { id: 'cargo', name: 'cargo (Rust)' },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
          <Package size={28} className="text-blue-400"/> Dev Package Manager
        </h1>
        <p className="text-zinc-400 text-sm">Install developer tools and packages globally</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Search controls (Left col) */}
        <div className="glass-panel p-5 rounded-xl space-y-4 h-fit">
          <h2 className="text-sm font-semibold text-zinc-300">Target Environment</h2>
          <div className="space-y-2">
            {PMS.map(pm => (
              <button key={pm.id} onClick={() => { setManager(pm.id); setResults(''); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium border transition-colors flex items-center justify-between ${
                  manager === pm.id
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                    : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10'
                }`}>
                {pm.name}
              </button>
            ))}
          </div>

          <div className="border-t border-white/5 pt-4 space-y-3">
            <input
              type="text" value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search package name..."
              className="w-full bg-zinc-950/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-200 outline-none focus:border-blue-500/50 transition-colors"
            />
            <button onClick={handleSearch} disabled={loading}
              className="w-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
              <Search size={14}/> {loading ? 'Searching...' : 'Search Package'}
            </button>
          </div>
        </div>

        {/* Results output (Right col) */}
        <div className="md:col-span-2 flex flex-col gap-4">
          <div className="glass-panel p-5 rounded-xl flex-1 flex flex-col min-h-[300px]">
            <h2 className="text-sm font-semibold text-zinc-300 mb-3">Available Packages</h2>
            <div className="flex-1 bg-zinc-950/60 rounded-xl border border-white/5 p-4 font-mono text-xs text-zinc-400 overflow-auto whitespace-pre select-text custom-scrollbar">
              {results || <span className="text-zinc-600">Perform a search to see list.</span>}
            </div>

            {/* Quick Install Action Bar */}
            <div className="mt-4 flex gap-3">
              <input
                type="text" id="direct-install" placeholder="Enter exact package name to install..."
                className="flex-1 bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-2 text-xs text-zinc-200 outline-none focus:border-blue-500/50 transition-colors"
              />
              <button onClick={() => {
                const input = document.getElementById('direct-install') as HTMLInputElement;
                if (input && input.value.trim()) handleInstall(input.value.trim());
              }}
                className="bg-green-500/15 text-green-400 hover:bg-green-500/25 border border-green-500/20 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors">
                <Download size={13}/> Install Package
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Stream output terminal console for installer */}
      {installingPkg && (
        <div className="glass-panel p-5 rounded-xl space-y-3">
          <div className="flex justify-between items-center text-xs text-zinc-400">
            <span className="flex items-center gap-1.5 text-green-400 font-mono"><TermIcon size={14}/> Installing: {installingPkg}</span>
            <button onClick={() => setInstallingPkg(null)} className="hover:text-zinc-200">Close Log</button>
          </div>
          <div className="h-40 bg-zinc-950 rounded-xl border border-white/5 p-4 font-mono text-xs text-green-400 overflow-auto whitespace-pre-wrap select-text custom-scrollbar">
            {installLog}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-zinc-500">
            <ShieldAlert size={12} className="text-yellow-500/80"/>
            <span>Ensure you have adequate shell permissions to perform global installations.</span>
          </div>
        </div>
      )}

    </div>
  );
}
