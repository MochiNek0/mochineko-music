import { create } from 'zustand';
import type { Library, MusicItem } from '../types';
import { libraryService } from '../services/api';

interface LibraryStore {
  libraries: Library[];
  selectedLibraryId: number | null;
  songs: MusicItem[];
  allSongs: MusicItem[];
  isLoading: boolean;

  loadLibraries: () => Promise<void>;
  createLibrary: (name: string) => Promise<void>;
  deleteLibrary: (id: number) => Promise<void>;
  renameLibrary: (id: number, newName: string) => Promise<void>;
  selectLibrary: (id: number | null) => Promise<void>;
  loadLibrarySongs: (libraryId: number) => Promise<void>;
  loadAllSongs: () => Promise<void>;
  addMusicToLibrary: (libraryId: number, musicId: number) => Promise<void>;
  removeMusicFromLibrary: (libraryId: number, musicId: number) => Promise<void>;
  scanDirectory: (path: string) => Promise<MusicItem[]>;
  addMusicByPath: (path: string) => Promise<MusicItem>;
  deleteMusic: (musicId: number) => Promise<void>;
}

export const useLibraryStore = create<LibraryStore>((set, get) => ({
  libraries: [],
  selectedLibraryId: null,
  songs: [],
  allSongs: [],
  isLoading: false,

  loadLibraries: async () => {
    set({ isLoading: true });
    try {
      const libraries = await libraryService.getLibraries();
      set({ libraries });
    } catch (e) {
      console.error('Failed to load libraries:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  createLibrary: async (name: string) => {
    try {
      await libraryService.createLibrary(name);
      await get().loadLibraries();
    } catch (e) {
      console.error('Failed to create library:', e);
    }
  },

  deleteLibrary: async (id: number) => {
    try {
      await libraryService.deleteLibrary(id);
      if (get().selectedLibraryId === id) {
        set({ selectedLibraryId: null, songs: [] });
      }
      await get().loadLibraries();
    } catch (e) {
      console.error('Failed to delete library:', e);
    }
  },

  renameLibrary: async (id: number, newName: string) => {
    try {
      await libraryService.renameLibrary(id, newName);
      await get().loadLibraries();
    } catch (e) {
      console.error('Failed to rename library:', e);
    }
  },

  selectLibrary: async (id: number | null) => {
    set({ selectedLibraryId: id });
    if (id !== null) {
      await get().loadLibrarySongs(id);
    } else {
      await get().loadAllSongs();
    }
  },

  loadLibrarySongs: async (libraryId: number) => {
    set({ isLoading: true });
    try {
      const songs = await libraryService.getLibrarySongs(libraryId);
      set({ songs });
    } catch (e) {
      console.error('Failed to load library songs:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  loadAllSongs: async () => {
    set({ isLoading: true });
    try {
      const allSongs = await libraryService.getAllSongs();
      set({ allSongs });
    } catch (e) {
      console.error('Failed to load all songs:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  addMusicToLibrary: async (libraryId: number, musicId: number) => {
    try {
      await libraryService.addMusicToLibrary(libraryId, musicId);
      await get().loadLibraries();
      if (get().selectedLibraryId === libraryId) {
        await get().loadLibrarySongs(libraryId);
      }
    } catch (e) {
      console.error('Failed to add music to library:', e);
    }
  },

  removeMusicFromLibrary: async (libraryId: number, musicId: number) => {
    try {
      await libraryService.removeMusicFromLibrary(libraryId, musicId);
      await get().loadLibraries();
      if (get().selectedLibraryId === libraryId) {
        await get().loadLibrarySongs(libraryId);
      }
    } catch (e) {
      console.error('Failed to remove music from library:', e);
    }
  },

  scanDirectory: async (path: string) => {
    try {
      const songs = await libraryService.scanDirectory(path);
      await get().loadAllSongs();
      await get().loadLibraries();
      return songs;
    } catch (e) {
      console.error('Failed to scan directory:', e);
      return [];
    }
  },

  addMusicByPath: async (path: string) => {
    const music = await libraryService.addMusicByPath(path);
    await get().loadAllSongs();
    return music;
  },

  deleteMusic: async (musicId: number) => {
    try {
      await libraryService.deleteMusic(musicId);
      await get().loadAllSongs();
      if (get().selectedLibraryId !== null) {
        await get().loadLibrarySongs(get().selectedLibraryId!);
      }
    } catch (e) {
      console.error('Failed to delete music:', e);
    }
  },
}));
