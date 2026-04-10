import { create } from 'zustand';
import type { CacheInfo } from '../types';
import { cacheService } from '../services/api';

interface CacheStore {
  cacheInfo: CacheInfo | null;
  isLoading: boolean;

  loadCacheInfo: () => Promise<void>;
  setCacheLimit: (sizeMb: number) => Promise<void>;
  clearCache: () => Promise<void>;
  removeFromCache: (musicId: number) => Promise<void>;
  ensureCacheSpace: (requiredMb: number) => Promise<void>;
}

export const useCacheStore = create<CacheStore>((set, get) => ({
  cacheInfo: null,
  isLoading: false,

  loadCacheInfo: async () => {
    set({ isLoading: true });
    try {
      const cacheInfo = await cacheService.getCacheInfo();
      set({ cacheInfo });
    } catch (e) {
      console.error('Failed to load cache info:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  setCacheLimit: async (sizeMb: number) => {
    try {
      await cacheService.setCacheLimit(sizeMb);
      await get().loadCacheInfo();
    } catch (e) {
      console.error('Failed to set cache limit:', e);
    }
  },

  clearCache: async () => {
    try {
      await cacheService.clearCache();
      await get().loadCacheInfo();
    } catch (e) {
      console.error('Failed to clear cache:', e);
    }
  },

  removeFromCache: async (musicId: number) => {
    try {
      await cacheService.removeFromCachePool(musicId);
      await get().loadCacheInfo();
    } catch (e) {
      console.error('Failed to remove from cache:', e);
    }
  },

  ensureCacheSpace: async (requiredMb: number) => {
    try {
      await cacheService.ensureCacheSpace(requiredMb);
      await get().loadCacheInfo();
    } catch (e) {
      console.error('Failed to ensure cache space:', e);
    }
  },
}));
