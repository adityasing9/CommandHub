import { useEffect } from 'react';
import { useStore } from '../store';
import { Layers, Package, RefreshCw, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

const COMMUNITY_PACKS = [
  { name: "Windows Power Pack", icon: "❖", cmds: 30, desc: "Advanced Windows administration commands", installed: true },
  { name: "Git Mastery Pack", icon: "📦", cmds: 25, desc: "Complete Git workflow automation", installed: false },
  { name: "Docker DevOps Pack", icon: "🐳", cmds: 20, desc: "Full Docker and container orchestration", installed: false },
  { name: "Networking Pack", icon: "🌐", cmds: 22, desc: "Deep network diagnostics and tools", installed: false },
  { name: "Python Dev Pack", icon: "🐍", cmds: 18, desc: "Python development and virtual envs", installed: false },
  { name: "Cybersecurity Pack", icon: "🔒", cmds: 15, desc: "Security auditing and hardening commands", installed: false },
];

export function PluginsView() {
  const { plugins, fetchPlugins } = useStore();
  useEffect(() => { fetchPlugins(); }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
            <Layers size={28} className="text-indigo-400"/> Plugins & Packs
          </h1>
          <p className="text-zinc-400 text-sm">Extend CommandHub with custom plugins and community command packs</p>
        </div>
        <button onClick={() => fetchPlugins()} className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg transition-colors">
          <RefreshCw size={14}/> Refresh
        </button>
      </div>

      {/* Loaded Plugins */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-zinc-200 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
          Active Plugins ({plugins.length})
        </h2>
        {plugins.length === 0 ? (
          <div className="glass-panel rounded-xl p-6 text-center text-zinc-500">
            <p className="text-sm">No plugins loaded. Drop a <code className="text-zinc-300 bg-white/5 px-1 rounded">.py</code> file into the <code className="text-zinc-300 bg-white/5 px-1 rounded">/plugins</code> folder to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plugins.map((p, i) => (
              <motion.div key={p} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="glass-panel p-4 rounded-xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-lg">
                  🧩
                </div>
                <div>
                  <div className="font-medium text-zinc-100">{p}</div>
                  <div className="text-xs text-zinc-500">Local Plugin · Active</div>
                </div>
                <div className="ml-auto text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">Loaded</div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Community Packs */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-200 mb-4 flex items-center gap-2">
          <Package size={18} className="text-blue-400"/> Community Packs
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {COMMUNITY_PACKS.map((pack, i) => (
            <motion.div key={pack.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-panel p-5 rounded-xl flex gap-4 items-start">
              <div className="text-3xl shrink-0">{pack.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-zinc-100 text-sm mb-1">{pack.name}</div>
                <div className="text-xs text-zinc-500 mb-3">{pack.desc} · {pack.cmds} commands</div>
                <button className={`text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
                  pack.installed
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20 cursor-default'
                    : 'bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 border border-blue-500/20'
                }`}>
                  {pack.installed ? '✔ Installed' : <><ExternalLink size={11}/> Install</>}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
