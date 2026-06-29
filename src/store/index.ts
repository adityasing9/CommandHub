import { create } from 'zustand';

export interface Command {
  id: number;
  title: string;
  description: string;
  category_id?: number;
  tags?: string;
  syntax: string;
  risk_level: string;
  is_custom?: boolean;
  category?: { name: string; icon: string; id: number };
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  icon?: string;
}

export interface HistoryEntry {
  id: number;
  raw_command: string;
  executed_at: string;
  exit_code?: number;
  output?: string;
}

export interface Setting {
  key: string;
  value?: string;
}

interface AppState {
  commands: Command[];
  categories: Category[];
  favorites: number[];      // list of favorited command IDs
  history: HistoryEntry[];
  settings: Record<string, string>;
  searchQuery: string;
  activeCategory: string;
  isLoading: boolean;
  plugins: string[];

  setSearchQuery: (query: string) => void;
  setActiveCategory: (cat: string) => void;
  fetchCommands: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchFavorites: () => Promise<void>;
  fetchHistory: () => Promise<void>;
  fetchSettings: () => Promise<void>;
  fetchPlugins: () => Promise<void>;
  explainCommand: (syntax: string) => Promise<any>;
  executeCommand: (command: string, shellType?: string) => Promise<string>;
  toggleFavorite: (commandId: number) => Promise<void>;
  saveSetting: (key: string, value: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  createCustomCommand: (cmd: Partial<Command>) => Promise<void>;
}

const API = 'http://127.0.0.1:8000/api';

export const useStore = create<AppState>((set, get) => ({
  commands: [],
  categories: [],
  favorites: [],
  history: [],
  settings: {},
  searchQuery: '',
  activeCategory: 'All',
  isLoading: false,
  plugins: [],

  setSearchQuery: (query) => {
    set({ searchQuery: query });
    get().fetchCommands();
  },

  setActiveCategory: (cat) => {
    set({ activeCategory: cat });
    get().fetchCommands();
  },

  fetchCommands: async () => {
    set({ isLoading: true });
    try {
      const q = get().searchQuery;
      const cat = get().activeCategory;
      const isNL = q && q.split(' ').length > 2;
      let url = `${API}/commands`;
      const params = new URLSearchParams();
      if (q) isNL ? (url = `${API}/ai/search?q=${encodeURIComponent(q)}`) : params.set('q', q);
      if (cat && cat !== 'All') params.set('category', cat);
      if (!isNL && params.toString()) url += '?' + params.toString();
      const res = await fetch(url);
      if (res.ok) set({ commands: await res.json() });
    } catch { console.error('Failed to fetch commands'); }
    finally { set({ isLoading: false }); }
  },

  fetchCategories: async () => {
    try {
      const res = await fetch(`${API}/categories`);
      if (res.ok) set({ categories: await res.json() });
    } catch {}
  },

  fetchFavorites: async () => {
    try {
      const res = await fetch(`${API}/favorites`);
      if (res.ok) {
        const data = await res.json();
        set({ favorites: data.map((f: any) => f.command_id) });
      }
    } catch {}
  },

  fetchHistory: async () => {
    try {
      const res = await fetch(`${API}/history`);
      if (res.ok) set({ history: await res.json() });
    } catch {}
  },

  fetchSettings: async () => {
    try {
      const res = await fetch(`${API}/settings`);
      if (res.ok) {
        const data: Setting[] = await res.json();
        const map: Record<string, string> = {};
        data.forEach(s => { map[s.key] = s.value || ''; });
        set({ settings: map });
      }
    } catch {}
  },

  fetchPlugins: async () => {
    try {
      const res = await fetch(`${API}/plugins`);
      if (res.ok) {
        const data = await res.json();
        set({ plugins: data.loaded || [] });
      }
    } catch {}
  },

  explainCommand: async (syntax) => {
    try {
      const res = await fetch(`${API}/ai/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command_syntax: syntax }),
      });
      if (res.ok) return await res.json();
    } catch {}
    return null;
  },

  executeCommand: async (command, shellType = 'powershell') => {
    try {
      const res = await fetch(`${API}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, shell_type: shellType }),
      });
      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let output = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          output += decoder.decode(value, { stream: true });
        }
        get().fetchHistory();
        return output;
      }
    } catch (e) { return `[ERROR] ${e}`; }
    return '[No output]';
  },

  toggleFavorite: async (commandId) => {
    const isFav = get().favorites.includes(commandId);
    if (isFav) {
      await fetch(`${API}/favorites/${commandId}`, { method: 'DELETE' });
      set({ favorites: get().favorites.filter(id => id !== commandId) });
    } else {
      await fetch(`${API}/favorites/${commandId}`, { method: 'POST' });
      set({ favorites: [...get().favorites, commandId] });
    }
  },

  saveSetting: async (key, value) => {
    await fetch(`${API}/settings/${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
    set({ settings: { ...get().settings, [key]: value } });
  },

  clearHistory: async () => {
    await fetch(`${API}/history`, { method: 'DELETE' });
    set({ history: [] });
  },

  createCustomCommand: async (cmd) => {
    await fetch(`${API}/commands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...cmd, is_custom: true, syntax: cmd.syntax || '' }),
    });
    get().fetchCommands();
  },
}));
