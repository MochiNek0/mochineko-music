import { invoke } from '@tauri-apps/api/core';
import type { MusicItem, Library, CacheInfo, AppConfig, PlaybackMode, OnlineMusic } from '../types';

export const playerService = {
  async getState() {
    return invoke<any>('get_player_state');
  },

  async setPlaybackMode(mode: PlaybackMode) {
    return invoke('set_playback_mode', { mode });
  },

  async setVolume(volume: number) {
    return invoke('set_volume', { volume });
  },

  async setPosition(positionMs: number) {
    return invoke('set_position', { position_ms: positionMs });
  },

  async setPlaying(playing: boolean) {
    return invoke('set_playing', { playing });
  },

  async setCurrentSong(song: MusicItem | null) {
    return invoke('set_current_song', { song });
  },

  async setDuration(durationMs: number) {
    return invoke('set_duration', { duration_ms: durationMs });
  },

  async getQueue() {
    return invoke<MusicItem[]>('get_queue');
  },

  async setQueue(songs: MusicItem[], startIndex?: number) {
    return invoke('set_queue', { songs, startIndex });
  },

  async getQueueIndex() {
    return invoke<number>('get_queue_index');
  },

  async setQueueIndex(index: number) {
    return invoke('set_queue_index', { index });
  },

  async incrementPlayCount(musicId: number) {
    return invoke('increment_play_count', { music_id: musicId });
  },
};

export const libraryService = {
  async createLibrary(name: string) {
    return invoke<Library>('create_library', { name });
  },

  async getLibraries() {
    return invoke<Library[]>('get_libraries');
  },

  async deleteLibrary(id: number) {
    return invoke('delete_library', { id });
  },

  async renameLibrary(id: number, newName: string) {
    return invoke('rename_library', { id, new_name: newName });
  },

  async addMusicToLibrary(libraryId: number, musicId: number) {
    return invoke('add_music_to_library', { library_id: libraryId, music_id: musicId });
  },

  async removeMusicFromLibrary(libraryId: number, musicId: number) {
    return invoke('remove_music_from_library', { library_id: libraryId, music_id: musicId });
  },

  async getLibrarySongs(libraryId: number) {
    return invoke<MusicItem[]>('get_library_songs', { library_id: libraryId });
  },

  async scanDirectory(path: string) {
    return invoke<MusicItem[]>('scan_directory', { path });
  },

  async addMusicByPath(path: string) {
    return invoke<MusicItem>('add_music_by_path', { path });
  },

  async deleteMusic(id: number) {
    return invoke('delete_music', { music_id: id });
  },

  async getAllSongs() {
    return invoke<MusicItem[]>('get_all_songs');
  },
};

export const cacheService = {
  async getCacheInfo() {
    return invoke<CacheInfo>('get_cache_info');
  },

  async setCacheLimit(sizeMb: number) {
    return invoke('set_cache_limit', { size_mb: sizeMb });
  },

  async clearCache() {
    return invoke('clear_cache');
  },

  async ensureCacheSpace(requiredMb: number) {
    return invoke('ensure_cache_space', { required_mb: requiredMb });
  },

  async addToCachePool(musicId: number, cachePath: string, sizeMb: number) {
    return invoke('add_to_cache_pool', { music_id: musicId, cache_path: cachePath, size_mb: sizeMb });
  },

  async removeFromCachePool(musicId: number) {
    return invoke('remove_from_cache_pool', { music_id: musicId });
  },

  async incrementCachePlayCount(musicId: number) {
    return invoke('increment_cache_play_count', { music_id: musicId });
  },
};

export const searchService = {
  async searchMusic(query: string) {
    return invoke<MusicItem[]>('search_music', { query });
  },

  async getAllSongs() {
    return invoke<MusicItem[]>('get_all_songs');
  },

  async queryOnlineMusic(keyword: string) {
    return invoke<OnlineMusic[]>('query_online_music', { keyword });
  },

  async downloadMusic(id: string, url: string, title: string, artist: string, album: string, duration_ms: number) {
    return invoke<MusicItem>('download_music', { id, url, title, artist, album, duration_ms });
  },
};

export const systemService = {
  async getAppConfig() {
    return invoke<AppConfig>('get_app_config');
  },

  async saveAppConfig(config: AppConfig) {
    return invoke('save_app_config', { config });
  },

  async minimizeToTray() {
    return invoke('minimize_to_tray');
  },

  async showWindow() {
    return invoke('show_window');
  },
};
