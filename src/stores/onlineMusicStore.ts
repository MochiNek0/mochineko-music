import { create } from 'zustand';
import type { OnlineMusic } from '../types';
import { searchService } from '../services/api';

interface OnlineMusicStore {
  searchResults: OnlineMusic[];
  isSearching: boolean;
  searchError: string | null;
  selectedOnlineSong: OnlineMusic | null;
  isDownloading: boolean;
  downloadingSongId: string | null;
  downloadProgress: string | null;

  searchOnlineMusic: (keyword: string) => Promise<void>;
  clearSearchResults: () => void;
  selectOnlineSong: (song: OnlineMusic | null) => void;
  setDownloading: (downloading: boolean, progress?: string, songId?: string | null) => void;
}

export const useOnlineMusicStore = create<OnlineMusicStore>((set) => ({
  searchResults: [],
  isSearching: false,
  searchError: null,
  selectedOnlineSong: null,
  isDownloading: false,
  downloadingSongId: null,
  downloadProgress: null,

  searchOnlineMusic: async (keyword: string) => {
    if (!keyword.trim()) {
      set({ searchResults: [], searchError: null });
      return;
    }

    set({ isSearching: true, searchError: null });

    try {
      const results = await searchService.queryOnlineMusic(keyword);
      set({ searchResults: results, isSearching: false });
    } catch (error) {
      console.error('Failed to search online music:', error);
      set({
        searchError: error instanceof Error ? error.message : '搜索失败',
        isSearching: false,
        searchResults: []
      });
    }
  },

  clearSearchResults: () => {
    set({ searchResults: [], searchError: null });
  },

  selectOnlineSong: (song: OnlineMusic | null) => {
    set({ selectedOnlineSong: song });
  },

  setDownloading: (downloading: boolean, progress?: string, songId?: string | null) => {
    set({ 
      isDownloading: downloading, 
      downloadProgress: progress || null,
      downloadingSongId: downloading ? (songId ?? useOnlineMusicStore.getState().downloadingSongId) : null
    });
  },
}));
