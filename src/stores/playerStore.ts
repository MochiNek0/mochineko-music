import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MusicItem, PlaybackMode, OnlineMusic } from "../types";
import { playerService, searchService } from "../services/api";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useCacheStore } from "./cacheStore";
import { useLibraryStore } from "./libraryStore";

interface PlayerStore {
  isPlaying: boolean;
  currentSong: MusicItem | null;
  position: number;
  duration: number;
  volume: number;
  playbackMode: PlaybackMode;
  queue: MusicItem[];
  queueIndex: number;
  audio: HTMLAudioElement | null;

  initAudio: () => void;
  play: (song?: MusicItem) => Promise<void>;
  playOnlineMusic: (
    onlineSong: OnlineMusic,
    onProgress?: (progress: string) => void,
  ) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  seek: (position: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackMode: (mode: PlaybackMode) => void;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  setQueue: (songs: MusicItem[], startIndex?: number) => void;
  playSongAtIndex: (index: number) => Promise<void>;
}

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      isPlaying: false,
      currentSong: null,
      position: 0,
      duration: 0,
      volume: 1.0,
      playbackMode: "ListLoop",
      queue: [],
      queueIndex: -1,
      audio: null,

      initAudio: () => {
        if (get().audio) return;

        const audio = new Audio();
        audio.volume = get().volume;

        // 设置初始源如果存在已持久化的歌曲
        const lastSong = get().currentSong;
        if (lastSong) {
          if (lastSong.path.startsWith("__online__:")) {
            const onlinePath = lastSong.path.replace("__online__:", "");
            const parts = onlinePath.split("|||");
            audio.src = parts[0] || onlinePath;
          } else {
            audio.src = convertFileSrc(lastSong.path);
          }
          audio.currentTime = get().position / 1000;
        }

        audio.addEventListener("timeupdate", () => {
          set({ position: Math.floor(audio.currentTime * 1000) });
        });

        audio.addEventListener("loadedmetadata", () => {
          set({ duration: Math.floor(audio.duration * 1000) });
        });

        audio.addEventListener("ended", () => {
          get().playNext();
        });

        audio.addEventListener("play", () => {
          set({ isPlaying: true });
        });

        audio.addEventListener("pause", () => {
          set({ isPlaying: false });
        });

        set({ audio });
      },

      play: async (song?: MusicItem) => {
        const { audio, queue, queueIndex } = get();

        if (!audio) {
          get().initAudio();
        }

        const audioEl = get().audio!;

        if (song) {
          set({ currentSong: song, position: 0 });

          // 判断是否为在线音乐（路径以 __online__: 开头）
          if (song.path.startsWith("__online__:")) {
            // 在线音乐，直接使用 URL
            // 格式: __online__:URL|||title，使用 ||| 作为分隔符避免 URL 中的冒号干扰
            const onlinePath = song.path.replace("__online__:", "");
            const parts = onlinePath.split("|||");
            const url = parts[0] || onlinePath;
            audioEl.src = url;
          } else {
            // 本地音乐，使用 convertFileSrc
            const fileUrl = convertFileSrc(song.path);
            audioEl.src = fileUrl;
          }

          try {
            await new Promise<void>((resolve, reject) => {
              const onCanPlay = () => {
                audioEl.removeEventListener("canplay", onCanPlay);
                audioEl.removeEventListener("error", onError);
                audioEl.play().then(resolve).catch(reject);
              };
              const onError = (e: Event) => {
                audioEl.removeEventListener("canplay", onCanPlay);
                audioEl.removeEventListener("error", onError);
                console.error("Audio error:", e);
                reject(e);
              };
              audioEl.addEventListener("canplay", onCanPlay);
              audioEl.addEventListener("error", onError);
              audioEl.load();
            });
            set({ isPlaying: true });

            if (song.id) {
              playerService.incrementPlayCount(song.id).catch(console.error);
            }
          } catch (e) {
            console.error("Failed to play:", e);
          }
        } else if (queue.length > 0) {
          const idx = queueIndex >= 0 ? queueIndex : 0;
          get().playSongAtIndex(idx);
        }
      },

      playOnlineMusic: async (
        onlineSong: OnlineMusic,
        onProgress?: (progress: string) => void,
      ) => {
        const { audio } = get();

        if (!audio) {
          get().initAudio();
        }

        const audioEl = get().audio!;

        try {
          if (onProgress) onProgress("正在准备...");

          // 先下载到本地（如果需要）
          const downloadedSong = await searchService.downloadMusic(
            onlineSong.id,
            onlineSong.url,
            onlineSong.title,
            onlineSong.artist,
            onlineSong.album,
            onlineSong.duration_ms,
          );

          // 下载完成后刷新缓存和库列表
          useCacheStore.getState().loadCacheInfo();
          useLibraryStore.getState().loadAllSongs();

          if (onProgress) onProgress("正在播放...");

          set({ currentSong: downloadedSong, position: 0 });

          // 下载完成后，使用本地文件路径播放
          const fileUrl = convertFileSrc(downloadedSong.path);
          audioEl.src = fileUrl;

          await new Promise<void>((resolve, reject) => {
            const onCanPlay = () => {
              audioEl.removeEventListener("canplay", onCanPlay);
              audioEl.removeEventListener("error", onError);
              audioEl.play().then(resolve).catch(reject);
            };
            const onError = (e: Event) => {
              audioEl.removeEventListener("canplay", onCanPlay);
              audioEl.removeEventListener("error", onError);
              console.error("Audio error:", e);
              reject(e);
            };
            audioEl.addEventListener("canplay", onCanPlay);
            audioEl.addEventListener("error", onError);
            audioEl.load();
          });

          set({ isPlaying: true });

          if (downloadedSong.id) {
            playerService
              .incrementPlayCount(downloadedSong.id)
              .catch(console.error);
          }
        } catch (e) {
          console.error("Failed to play online music:", e);
          throw e;
        }
      },

      pause: () => {
        const { audio } = get();
        if (audio) {
          audio.pause();
          set({ isPlaying: false });
        }
      },

      resume: () => {
        const { audio } = get();
        if (audio) {
          audio.play();
          set({ isPlaying: true });
        }
      },

      stop: () => {
        const { audio } = get();
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
          set({ isPlaying: false, position: 0 });
        }
      },

      seek: (position: number) => {
        const { audio } = get();
        if (audio) {
          audio.currentTime = position / 1000;
          set({ position });
        }
      },

      setVolume: (volume: number) => {
        const { audio } = get();
        const vol = Math.max(0, Math.min(1, volume));
        if (audio) {
          audio.volume = vol;
        }
        set({ volume: vol });
      },

      setPlaybackMode: async (mode: PlaybackMode) => {
        set({ playbackMode: mode });
        await playerService.setPlaybackMode(mode);
      },

      playNext: async () => {
        let { queue, queueIndex, playbackMode } = get();

        if (queue.length === 0) {
          const allSongs = useLibraryStore.getState().allSongs;
          if (allSongs.length > 0) {
            const currentSong = get().currentSong;
            const idx = currentSong
              ? allSongs.findIndex((s) => s.id === currentSong.id)
              : 0;
            get().setQueue(allSongs, idx >= 0 ? idx : 0);
            queue = get().queue;
            queueIndex = get().queueIndex;
          } else {
            return;
          }
        }

        let nextIndex = queueIndex + 1;

        if (playbackMode === "Random") {
          nextIndex = Math.floor(Math.random() * queue.length);
        } else if (playbackMode === "SingleLoop") {
          nextIndex = queueIndex;
        } else if (nextIndex >= queue.length) {
          nextIndex = 0;
        }

        await get().playSongAtIndex(nextIndex);
      },

      playPrevious: async () => {
        let { queue, queueIndex } = get();

        if (queue.length === 0) {
          const allSongs = useLibraryStore.getState().allSongs;
          if (allSongs.length > 0) {
            const currentSong = get().currentSong;
            const idx = currentSong
              ? allSongs.findIndex((s) => s.id === currentSong.id)
              : 0;
            get().setQueue(allSongs, idx >= 0 ? idx : 0);
            queue = get().queue;
            queueIndex = get().queueIndex;
          } else {
            return;
          }
        }

        let prevIndex = queueIndex - 1;

        if (prevIndex < 0) {
          prevIndex = queue.length - 1;
        }

        await get().playSongAtIndex(prevIndex);
      },

      setQueue: (songs: MusicItem[], startIndex?: number) => {
        set({ queue: songs, queueIndex: startIndex ?? -1 });
      },

      playSongAtIndex: async (index: number) => {
        const { queue, audio } = get();

        if (index < 0 || index >= queue.length) return;

        const song = queue[index];

        if (audio) {
          // 判断是否为在线音乐
          if (song.path.startsWith("__online__:")) {
            // 格式: __online__:URL|||title，使用 ||| 作为分隔符避免 URL 中的冒号干扰
            const onlinePath = song.path.replace("__online__:", "");
            const parts = onlinePath.split("|||");
            const url = parts[0] || onlinePath;
            audio.src = url;
          } else {
            const fileUrl = convertFileSrc(song.path);
            audio.src = fileUrl;
          }

          try {
            await new Promise<void>((resolve, reject) => {
              const onCanPlay = () => {
                audio.removeEventListener("canplay", onCanPlay);
                audio.removeEventListener("error", onError);
                audio.play().then(resolve).catch(reject);
              };
              const onError = (e: Event) => {
                audio.removeEventListener("canplay", onCanPlay);
                audio.removeEventListener("error", onError);
                console.error("Audio error:", e);
                reject(e);
              };
              audio.addEventListener("canplay", onCanPlay);
              audio.addEventListener("error", onError);
              audio.load();
            });
            set({
              currentSong: song,
              queueIndex: index,
              isPlaying: true,
              position: 0,
            });

            if (song.id) {
              playerService.incrementPlayCount(song.id).catch(console.error);
            }
          } catch (e) {
            console.error("Failed to play:", e);
          }
        }
      },
    }),
    {
      name: "player-storage",
      partialize: (state) => ({
        currentSong: state.currentSong,
        position: state.position,
        duration: state.duration,
        volume: state.volume,
        playbackMode: state.playbackMode,
        // Note: queue and queueIndex are NOT persisted to prevent stringification bloat.
      }),
    },
  ),
);
