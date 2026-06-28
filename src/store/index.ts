import { create } from 'zustand';

export interface Command {
  id: int;
  title: string;
  description: string;
  category_id?: number;
  tags?: string;
  syntax: string;
  risk_level: string;
  category?: {
    name: string;
    icon: string;
  }
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  icon?: string;
}

interface AppState {
  commands: Command[];
  categories: Category[];
  searchQuery: string;
  isLoading: boolean;
  setSearchQuery: (query: string) => void;
  fetchCommands: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  explainCommand: (syntax: string) => Promise<any>;
}

const API_URL = "http://127.0.0.1:8000/api";

export const useStore = create<AppState>((set, get) => ({
  commands: [],
  categories: [],
  searchQuery: "",
  isLoading: false,

  setSearchQuery: (query) => {
    set({ searchQuery: query });
    get().fetchCommands();
  },

  fetchCommands: async () => {
    set({ isLoading: true });
    try {
      const q = get().searchQuery;
      // Use AI search endpoint if the query is a bit long/natural language-like
      const isNaturalLanguage = q && q.split(' ').length > 2;
      const url = q ? 
        (isNaturalLanguage ? `${API_URL}/ai/search?q=${encodeURIComponent(q)}` : `${API_URL}/commands?q=${encodeURIComponent(q)}`) 
        : `${API_URL}/commands`;
        
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        set({ commands: data });
      }
    } catch (err) {
      console.error("Failed to fetch commands", err);
    } finally {
      set({ isLoading: false });
    }
  },

  explainCommand: async (syntax: string) => {
    try {
      const res = await fetch(`${API_URL}/ai/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command_syntax: syntax })
      });
      if (res.ok) return await res.json();
      return null;
    } catch (err) {
      console.error("Failed to explain command", err);
      return null;
    }
  },

  fetchCategories: async () => {
    try {
      const res = await fetch(`${API_URL}/categories`);
      if (res.ok) {
        const data = await res.json();
        set({ categories: data });
      }
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  }
}));
