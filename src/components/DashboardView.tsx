import { useEffect, useState } from 'react';
import { useStore } from '../store';
import {
  Terminal, ShieldCheck, Star, Activity, RefreshCw,
  Cpu, Zap, Play, Copy, Check
} from 'lucide-react';

export function DashboardView() {
  const { executeCommand, favorites } = useStore();
  const [stats, setStats] = useState<any>(null);
  const [scanResult, setScanResult] = useState<any>(null);
  const [loadingScan, setLoadingScan] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/dashboard/stats');
      if (res.ok) setStats(await res.json());
    } catch {}
  };

  const runScan = async () => {
    setLoadingScan(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/system/scan');
      if (res.ok) setScanResult(await res.json());
    } catch {}
    setLoadingScan(false);
  };

  useEffect(() => {
    fetchStats();
    runScan();
  }, []);

  const handleQuickAction = async (cmdText: string) => {
    await executeCommand(cmdText);
    fetchStats();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  const QUICK_ACTIONS = [
    { name: "Flush DNS", cmd: "ipconfig /flushdns", desc: "Clear local DNS lookup cache" },
    { name: "Restart Explorer", cmd: "taskkill /f /im explorer.exe && start explorer.exe", desc: "Reboot file manager UI" },
    { name: "Show Wi-Fi Info", cmd: "netsh wlan show interfaces", desc: "Check current WiFi signal" },
    { name: "Empty Recycle Bin", cmd: "powershell -Command \"Clear-RecycleBin -Force -ErrorAction SilentlyContinue\"", desc: "Free up disk storage" },
    { name: "Generate Battery Report", cmd: "powercfg /batteryreport", desc: "Check windows battery logs" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
      
      {/* Welcome Header */}
      <div className="flex justify-between items-center shrink-0 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Developer Dashboard</h1>
          <p className="text-zinc-400 text-sm">System stats, quick diagnostics, and dev tool status</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchStats} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 bg-white/5 px-3 py-2 rounded-lg border border-white/5 transition-colors">
            <RefreshCw size={12}/> Refresh Analytics
          </button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <Activity size={22}/>
          </div>
          <div>
            <div className="text-xs text-zinc-500 mb-0.5">Total Executions</div>
            <div className="text-2xl font-bold text-zinc-100">{stats?.total_runs ?? 0}</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-green-500/10 text-green-400 rounded-xl border border-green-500/20">
            <ShieldCheck size={22}/>
          </div>
          <div>
            <div className="text-xs text-zinc-500 mb-0.5">Success Rate</div>
            <div className="text-2xl font-bold text-zinc-100">{stats?.success_rate ?? 100}%</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-yellow-500/10 text-yellow-400 rounded-xl border border-yellow-500/20">
            <Star size={22}/>
          </div>
          <div>
            <div className="text-xs text-zinc-500 mb-0.5">Favorites Pinned</div>
            <div className="text-2xl font-bold text-zinc-100">{favorites.length}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* System Scanner (Left/Col 1-2) */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-zinc-200">
              <Cpu size={18} className="text-blue-400"/> System Dev Environment
            </h2>
            <button onClick={runScan} disabled={loadingScan} className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1">
              <RefreshCw size={11} className={loadingScan ? "animate-spin" : ""}/> {loadingScan ? "Scanning..." : "Rescan"}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-auto">
            {scanResult ? (
              Object.entries(scanResult).map(([tool, data]: any) => (
                <div key={tool} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                  <div>
                    <div className="text-sm font-semibold text-zinc-200">{tool}</div>
                    <div className="text-xs text-zinc-500 truncate max-w-[200px]" title={data.version}>
                      {data.installed ? data.version : "Not Installed"}
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                    data.installed ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-zinc-500/10 text-zinc-400 border-white/10"
                  }`}>
                    {data.installed ? "Ready" : "Missing"}
                  </span>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center text-zinc-600 py-6 text-sm">No scans performed yet.</div>
            )}
          </div>
        </div>

        {/* Quick Actions (Right/Col 3) */}
        <div className="glass-panel p-6 rounded-xl space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-zinc-200 border-b border-white/5 pb-3">
            <Zap size={18} className="text-yellow-400"/> Quick Tools
          </h2>
          <div className="space-y-3 max-h-96 overflow-auto pr-1">
            {QUICK_ACTIONS.map(action => (
              <div key={action.name} className="bg-white/5 p-3 rounded-xl border border-white/5 flex flex-col gap-2">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <div className="text-xs font-semibold text-zinc-200">{action.name}</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">{action.desc}</div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => copyToClipboard(action.cmd)} className="p-1 rounded hover:bg-white/5 text-zinc-500 hover:text-zinc-300">
                      {copied === action.cmd ? <Check size={12} className="text-green-400"/> : <Copy size={12}/>}
                    </button>
                    <button onClick={() => handleQuickAction(action.cmd)} className="p-1 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20">
                      <Play size={12}/>
                    </button>
                  </div>
                </div>
                <div className="bg-zinc-950 font-mono text-[9px] text-zinc-400 p-1.5 rounded border border-white/5 overflow-x-auto truncate select-all">
                  {action.cmd}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Recent Activity Section */}
      <div className="glass-panel p-6 rounded-xl space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-zinc-200">
          <Terminal size={18} className="text-purple-400"/> Recent Executions
        </h2>
        {stats?.recent_activity?.length > 0 ? (
          <div className="divide-y divide-white/5">
            {stats.recent_activity.map((act: any) => (
              <div key={act.id} className="flex justify-between items-center py-2.5 text-sm gap-4">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${act.exit_code === 0 ? "bg-green-500" : "bg-red-500"}`}/>
                  <code className="text-xs text-zinc-300 font-mono truncate">{act.raw_command}</code>
                </div>
                <span className="text-[10px] text-zinc-500 shrink-0">{new Date(act.executed_at).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-zinc-600 text-xs py-4 text-center">No recent activities available.</p>
        )}
      </div>

    </div>
  );
}
