import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { io, Socket } from 'socket.io-client';
import type { AppState, User, Match, EventType, NewsItem, Player, GlobalSettings } from './types';

interface StoreState extends AppState {
  socket: Socket | null;
  user: User | null;
  theme: 'dark' | 'light' | 'cosmic' | 'crimson' | 'light-warm' | 'light-mint';
  settings: GlobalSettings;
  modal: 'login' | 'settings' | 'otp' | 'logoutConfirm' | null;
  setTheme: (theme: 'dark' | 'light' | 'cosmic' | 'crimson' | 'light-warm' | 'light-mint') => void;
  setModal: (modal: 'login' | 'settings' | 'otp' | 'logoutConfirm' | null) => void;
  setSettings: (settings: GlobalSettings) => void;
  setUser: (user: User | null) => void;
  initSocket: () => void;
  isAdminForEvent: (eventId: string) => boolean;
  isOwner: () => boolean;
  isNewsTeam: () => boolean;
  updateMatch: (match: Match) => void;
  addMatch: (match: Match) => void;
  deleteMatch: (id: string) => void;
  deleteMatches: (ids: string[]) => void;
  addMatches: (matches: Match[]) => void;
  createEvent: (event: EventType) => void;
  updateEvent: (event: EventType) => void;
  deleteEvent: (id: string) => void;
  addNews: (news: NewsItem) => void;
  updateNews: (news: NewsItem) => void;
  deleteNews: (id: string) => void;
  addPlayer: (player: Player) => void;
  updatePlayer: (player: Player) => void;
  deletePlayer: (id: string) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      events: [],
      matches: [],
      news: [],
      players: [],
      socket: null,
      user: { id: 'viewer', username: 'Guest', role: 'viewer' }, // default
      theme: 'dark',
      modal: null,
      settings: { 
        notifications: true,
        showAbbreviations: false,
        systemName: 'PRO SCORE',
        systemLogo: 'Trophy',
        otpCode: 'A1B2',
        otpTimestamp: Date.now(),
        newsPassword: 'news',
        devMode: false
      },

      setModal: (modal) => set({ modal }),

      setSettings: (settings) => {
        set({ settings });
        get().socket?.emit('update_settings', settings);
      },

      setTheme: (theme) => {
        set({ theme });
        document.documentElement.classList.remove('theme-light', 'theme-cosmic', 'theme-crimson', 'theme-light-warm', 'theme-light-mint');
        if (theme !== 'dark') {
          document.documentElement.classList.add(`theme-${theme}`);
        }
      },

  setUser: (user) => set({ user }),

  isAdminForEvent: (eventId: string) => {
    const user = get().user;
    if (user?.role === 'owner') return true;
    if (user?.role === 'admin' && user.eventId === eventId) return true;
    return false;
  },
  
  isOwner: () => get().user?.role === 'owner',
  
  isNewsTeam: () => {
    const user = get().user;
    return user?.role === 'news' || user?.role === 'admin' || user?.role === 'owner';
  },

  updateMatch: (match) => {
    set((state) => ({
      matches: state.matches.map(m => m.id === match.id ? match : m)
    }));
    get().socket?.emit('update_match', match);
  },

  addMatch: (match) => {
    set((state) => ({ matches: [...state.matches, match] }));
    get().socket?.emit('add_match', match);
  },

  deleteMatch: (id) => {
    set((state) => ({ matches: state.matches.filter(m => m.id !== id) }));
    get().socket?.emit('delete_match', id);
  },

  deleteMatches: (ids) => {
    set((state) => ({ matches: state.matches.filter(m => !ids.includes(m.id)) }));
    get().socket?.emit('delete_matches', ids);
  },

  addMatches: (matches) => {
    set((state) => ({ matches: [...state.matches, ...matches] }));
    get().socket?.emit('add_matches', matches);
  },

  createEvent: (event) => {
    get().socket?.emit('create_event', event);
  },

  updateEvent: (event) => {
    get().socket?.emit('update_event', event);
  },

  deleteEvent: (id) => {
    set((state) => ({ events: state.events.filter(e => e.id !== id), matches: state.matches.filter(m => m.eventId !== id) }));
    get().socket?.emit('delete_event', id);
  },

  addNews: (news) => {
    set((state) => ({ news: [news, ...state.news] }));
    get().socket?.emit('add_news', news);
  },

  updateNews: (news) => {
    set((state) => ({ news: state.news.map(n => n.id === news.id ? news : n) }));
    get().socket?.emit('update_news', news);
  },

  deleteNews: (id) => {
    set((state) => ({ news: state.news.filter(n => n.id !== id) }));
    get().socket?.emit('delete_news', id);
  },

  addPlayer: (player) => {
    set((state) => ({ players: [...state.players, player] }));
    get().socket?.emit('add_player', player);
  },

  updatePlayer: (player) => {
    set((state) => ({ players: state.players.map(p => p.id === player.id ? player : p) }));
    get().socket?.emit('update_player', player);
  },

  deletePlayer: (id) => {
    set((state) => ({ players: state.players.filter(p => p.id !== id) }));
    get().socket?.emit('delete_player', id);
  },

  initSocket: () => {
    if (get().socket) return; // Already initialized

    const socket = io(window.location.origin);
    
    socket.on('connect', () => {
      console.log('Connected to realtime server');
    });

    socket.on('sync_state', (state: AppState) => {
      set((currentState) => ({
        events: state.events,
        matches: state.matches,
        news: state.news,
        players: state.players || [],
        settings: state.settings || currentState.settings
      }));
    });

    socket.on('toast', (data: { message: string }) => {
      // Simple custom event for notifications
      window.dispatchEvent(new CustomEvent('app-toast', { detail: data.message }));
    });

    set({ socket });
  }
}), {
  name: 'pooltourney-storage',
  partialize: (state) => ({ 
    theme: state.theme, 
    settings: state.settings,
    user: state.user
  })
}));
