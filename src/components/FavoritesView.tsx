import React, { useEffect } from 'react';
import { useStore } from '../store';
import { Star, Clock, Trash2, Copy, Play } from 'lucide-react';
import { motion } from 'framer-motion';

export function FavoritesView() {
  const { commands, favorites, toggleFavorite, fetchCommands, fetchFavorites } = useStore();
  useEffect(() => { fetchCommands(); fetchFavorites(); }, []);
  const favCommands = commands.filter(c => favorites.includes(c.id));

  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
          <Star size={28} className="text-yellow-400"/> Favorites
        </h1>
        <p className="text-zinc-400 text-sm">{favCommands.length} pinned commands</p>
      </div>
      {favCommands.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-60 text-zinc-600 gap-3">
          <Star size={48} className="opacity-20"/>
          <p>No favorites yet. Click ☆ on any command to pin it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {favCommands.map((cmd, i) => (
            <motion.div key={cmd.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-panel p-4 rounded-xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{cmd.category?.icon || '⚙️'}</span>
                  <span className="font-semibold text-zinc-100 text-sm">{cmd.title}</span>
                </div>
                <button onClick={() => toggleFavorite(cmd.id)} className="text-yellow-400 hover:text-zinc-400 transition-colors">
                  <Star size={16} fill="currentColor"/>
                </button>
              </div>
              <div className="bg-zinc-950/80 rounded-lg p-2.5 font-mono text-xs text-zinc-300 border border-white/5 selectable">
                {cmd.syntax}
              </div>
              <div className="flex gap-2">
                <button onClick={() => navigator.clipboard.writeText(cmd.syntax)}
                  className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors">
                  <Copy size={12}/> Copy
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
