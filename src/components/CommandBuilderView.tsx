import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { PlusCircle, Info, Sliders, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function CommandBuilderView() {
  const { categories, fetchCategories, createCustomCommand } = useStore();
  const [form, setForm] = useState({
    title: '',
    syntax: '',
    description: '',
    category_id: '',
    tags: '',
    risk_level: 'green',
    requirements: '',
    docs_url: ''
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.syntax) return;
    
    await createCustomCommand({
      title: form.title,
      syntax: form.syntax,
      description: form.description,
      category_id: form.category_id ? parseInt(form.category_id) : undefined,
      tags: form.tags,
      risk_level: form.risk_level,
      requirements: form.requirements,
      docs_url: form.docs_url
    });

    setSaved(true);
    setForm({
      title: '',
      syntax: '',
      description: '',
      category_id: '',
      tags: '',
      risk_level: 'green',
      requirements: '',
      docs_url: ''
    });

    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto w-full space-y-6 relative">
      <div>
        <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
          <PlusCircle size={28} className="text-emerald-400"/> Custom Command Builder
        </h1>
        <p className="text-zinc-400 text-sm">Design custom scripts and command parameters visually</p>
      </div>

      <AnimatePresence>
        {saved && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl flex items-center gap-2">
            <CheckCircle size={16}/> Command successfully saved to your library!
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSave} className="glass-panel p-6 rounded-xl space-y-5">
        
        {/* Core fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-zinc-400">Command Name *</label>
            <input
              type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})}
              placeholder="e.g. Purge System Logs"
              className="w-full bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-zinc-400">Category</label>
            <select
              value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})}
              className="w-full bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-400 outline-none focus:border-emerald-500/50 transition-colors"
            >
              <option value="">Select Category...</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Syntax script input */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-zinc-400">Script Syntax *</label>
          <input
            type="text" required value={form.syntax} onChange={e => setForm({...form, syntax: e.target.value})}
            placeholder="e.g. Remove-Item -Path C:\logs\* -Recurse -Force"
            className="w-full bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-2.5 font-mono text-sm text-zinc-200 outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-zinc-400">Description</label>
          <textarea
            value={form.description} onChange={e => setForm({...form, description: e.target.value})}
            placeholder="Describe what this command does, what system components it affects..."
            className="w-full h-24 bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-emerald-500/50 transition-colors resize-none"
          />
        </div>

        {/* Advanced details toggles */}
        <div className="border-t border-white/5 pt-4 space-y-4">
          <h3 className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5"><Sliders size={13}/> Optional Parameters</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs text-zinc-500">Requirements / Prerequisites</label>
              <input
                type="text" value={form.requirements} onChange={e => setForm({...form, requirements: e.target.value})}
                placeholder="e.g. Administrator privileges, python >= 3.8"
                className="w-full bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-zinc-200 outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-xs text-zinc-500">Official Docs URL</label>
              <input
                type="text" value={form.docs_url} onChange={e => setForm({...form, docs_url: e.target.value})}
                placeholder="e.g. https://docs.microsoft.com/..."
                className="w-full bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-zinc-200 outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs text-zinc-500">Tags (comma-separated)</label>
              <input
                type="text" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})}
                placeholder="e.g. admin, utility, clean"
                className="w-full bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-zinc-200 outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-xs text-zinc-500">Risk Assessment</label>
              <div className="flex gap-2">
                {(['green', 'yellow', 'red'] as const).map(level => (
                  <button key={level} type="button" onClick={() => setForm({...form, risk_level: level})}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg border capitalize transition-colors ${
                      form.risk_level === level
                        ? level === 'green'
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : level === 'yellow'
                          ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                          : 'bg-red-500/20 text-red-400 border-red-500/30'
                        : 'border-white/5 text-zinc-500 hover:border-white/10 hover:text-zinc-400'
                    }`}>
                    {level === 'green' ? 'Safe' : level === 'yellow' ? 'Caution' : 'Dangerous'}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

        <button type="submit"
          className="w-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors border border-emerald-500/20">
          Save Command to Library
        </button>

      </form>

      <div className="flex items-start gap-2.5 text-zinc-500 text-xs mt-4">
        <Info size={16} className="text-zinc-600 shrink-0"/>
        <span>New custom commands are safely stored in your local offline SQLite database and can be searched or executed instantly.</span>
      </div>

    </div>
  );
}
