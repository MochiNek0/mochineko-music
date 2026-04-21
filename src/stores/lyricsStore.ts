import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LyricLine, lyricsService } from '../services/lyricsService';

interface LyricsState {
  // Persisted settings
  isVisible: boolean;
  isLocked: boolean;
  fontSize: number;
  capsuleWidth: number;
  capsuleHeight: number;
  position: { x: number; y: number };

  // Runtime state
  lines: LyricLine[];
  plainText: string;
  currentIndex: number;
  loading: boolean;
  error: string | null;

  // Actions
  toggleVisibility: () => void;
  toggleLock: () => void;
  setFontSize: (size: number) => void;
  setCapsuleSize: (width: number, height: number) => void;
  setPosition: (x: number, y: number) => void;
  loadLyrics: (title: string, artist: string, duration?: number) => Promise<void>;
  updateCurrentIndex: (positionMs: number) => void;
  clear: () => void;
}

export const useLyricsStore = create<LyricsState>()(
  persist(
    (set, get) => ({
      isVisible: false,
      isLocked: false,
      fontSize: 24,
      capsuleWidth: 500,
      capsuleHeight: 64,
      position: { x: 50, y: 80 }, // Percentage or initial px

      lines: [],
      plainText: '',
      currentIndex: -1,
      loading: false,
      error: null,

      toggleVisibility: () => set((state) => ({ isVisible: !state.isVisible })),
      toggleLock: () => set((state) => ({ isLocked: !state.isLocked })),
      setFontSize: (fontSize) => set({ fontSize }),
      setCapsuleSize: (capsuleWidth, capsuleHeight) => set({ capsuleWidth, capsuleHeight }),
      setPosition: (x, y) => set({ position: { x, y } }),

      loadLyrics: async (title, artist, duration) => {
        set({ loading: true, error: null, lines: [], plainText: '', currentIndex: -1 });
        try {
          const data = await lyricsService.fetchLyrics(title, artist, duration);
          if (data) {
            if (data.syncedLyrics) {
              const lines = lyricsService.parseLRC(data.syncedLyrics);
              set({ lines, plainText: '', loading: false });
            } else if (data.plainLyrics) {
              const approxLines = lyricsService.createApproximateSynced(data.plainLyrics, duration || 240000);
              set({ lines: approxLines, plainText: '', loading: false });
            } else {
              set({ plainText: '暂无歌词', lines: [], loading: false });
            }
          } else {
            set({ error: '未找到歌词', loading: false });
          }
        } catch (err) {
          set({ error: '加载失败', loading: false });
        }
      },

      updateCurrentIndex: (positionMs) => {
        const { lines, currentIndex } = get();
        if (lines.length === 0) return;
        
        const nextIndex = lyricsService.findCurrentIndex(lines, positionMs);
        if (nextIndex !== currentIndex) {
          set({ currentIndex: nextIndex });
        }
      },

      clear: () => set({ lines: [], plainText: '', currentIndex: -1, error: null }),
    }),
    {
      name: 'lyrics-storage',
      partialize: (state) => ({
        isVisible: state.isVisible,
        isLocked: state.isLocked,
        fontSize: state.fontSize,
        capsuleWidth: state.capsuleWidth,
        capsuleHeight: state.capsuleHeight,
        position: state.position,
      }),
    }
  )
);
