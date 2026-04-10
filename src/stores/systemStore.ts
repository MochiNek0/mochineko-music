import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';

interface AppConfig {
  cache_limit_mb: number;
  default_playback_mode: string;
  minimize_to_tray: boolean;
  auto_scan_on_startup: boolean;
  scan_directories: string[];
}

interface SystemState {
  config: AppConfig | null;
  isLoading: boolean;
  loadConfig: () => Promise<void>;
  updateConfig: (config: Partial<AppConfig>) => Promise<void>;
}

export const useSystemStore = create<SystemState>((set, get) => ({
  config: null,
  isLoading: false,

  loadConfig: async () => {
    set({ isLoading: true });
    try {
      const config = await invoke<AppConfig>('get_app_config');
      set({ config, isLoading: false });
    } catch (error) {
      console.error('Failed to load config:', error);
      set({ isLoading: false });
    }
  },

  updateConfig: async (newConfig) => {
    const currentConfig = get().config;
    if (!currentConfig) return;

    const updatedConfig = { ...currentConfig, ...newConfig };
    try {
      await invoke('save_app_config', { config: updatedConfig });
      set({ config: updatedConfig });
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  },
}));
