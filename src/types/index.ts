export type PlaybackMode = 'ListLoop' | 'SingleLoop' | 'Random' | 'Sequential';

export interface MusicItem {
  id: number;
  title: string;
  artist: string;
  album: string;
  duration_ms: number;
  path: string;
  is_local: boolean;
  play_count: number;
  added_at: string;
}

export interface PlayerState {
  is_playing: boolean;
  current_song: MusicItem | null;
  position_ms: number;
  duration_ms: number;
  volume: number;
  playback_mode: PlaybackMode;
}

export interface Library {
  id: number;
  name: string;
  song_count: number;
  created_at: string;
  updated_at: string;
}

export interface CacheInfo {
  total_size_mb: number;
  limit_mb: number;
  item_count: number;
  items: CacheItem[];
}

export interface CacheItem {
  id: number;
  music_id: number;
  cache_path: string;
  size_mb: number;
  play_count: number;
  cached_at: string;
}

export interface AppConfig {
  cache_limit_mb: number;
  default_playback_mode: string;
  minimize_to_tray: boolean;
  auto_scan_on_startup: boolean;
  scan_directories: string[];
}

export interface OnlineMusic {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration_ms: number;
  source: string;
  url: string;
  cover_url: string;
}
