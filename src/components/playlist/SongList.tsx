import { useEffect, useMemo, useState } from 'react';
import { MusicItem } from '../../types';
import { useLibraryStore } from '../../stores/libraryStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useShallow } from 'zustand/react/shallow';
import { SearchBar } from './SearchBar';
import { Music, Play, Plus, Trash2, Clock, Album, User, Database } from 'lucide-react';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { useCacheStore } from '../../stores/cacheStore';
import { cn } from '../../lib/utils';
import { Button } from '../common/Button';
import { open } from '@tauri-apps/plugin-dialog';

export function SongList() {
  const { songs, allSongs, loadAllSongs, selectedLibraryId, deleteMusic, addMusicByPath } =
    useLibraryStore();
  const { currentSong, isPlaying, play, pause, setQueue, playSongAtIndex } =
    usePlayerStore(useShallow((state) => ({
      currentSong: state.currentSong,
      isPlaying: state.isPlaying,
      play: state.play,
      pause: state.pause,
      setQueue: state.setQueue,
      playSongAtIndex: state.playSongAtIndex
    })));
  const { loadCacheInfo } = useCacheStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  useEffect(() => {
    loadAllSongs();
    loadCacheInfo();
  }, []);

  const sourceSongs = useMemo(() => {
    return selectedLibraryId === null ? allSongs : songs;
  }, [songs, allSongs, selectedLibraryId]);

  const displaySongs = useMemo(() => {
    if (!searchQuery.trim()) {
      return sourceSongs;
    }

    const query = searchQuery.toLowerCase();
    
    return sourceSongs.filter(
      (song) =>
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query) ||
        song.album.toLowerCase().includes(query)
    );
  }, [searchQuery, sourceSongs]);

  const ROW_HEIGHT = 76;
  const VISIBLE_COUNT = 16;
  const OVERSCAN = 5;

  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(
    displaySongs.length,
    Math.floor(scrollTop / ROW_HEIGHT) + VISIBLE_COUNT + OVERSCAN
  );

  const paddingTop = startIndex * ROW_HEIGHT;
  const paddingBottom = Math.max(0, displaySongs.length - endIndex) * ROW_HEIGHT;

  const renderedSongs = displaySongs.slice(startIndex, endIndex);

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlaySong = (song: MusicItem) => {
    if (currentSong?.id === song.id) {
      if (isPlaying) {
        pause();
      } else {
        play();
      }
    } else {
      const index = sourceSongs.findIndex(s => s.id === song.id);
      const playIndex = index !== -1 ? index : 0;
      setQueue(sourceSongs, playIndex);
      playSongAtIndex(playIndex);
    }
  };

  const handleAddMusic = async () => {
    const selected = await open({
      multiple: false,
      filters: [
        {
          name: '音频',
          extensions: ['mp3', 'flac', 'wav', 'ogg', 'm4a'],
        },
      ],
      title: '选择音乐文件',
    });

    if (selected) {
      await addMusicByPath(selected as string);
    }
  };

  const handleDeleteSong = async (id: number) => {
    await deleteMusic(id);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white/50 font-sans">
      {/* List Header */}
      <header className="px-12 pt-14 pb-10 shrink-0">
        <div className="flex items-end justify-between mb-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-1.5 h-6 bg-brand-primary rounded-full" />
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-brand-primary/60">
                {selectedLibraryId === null ? '全局媒体库' : '媒体库视图'}
              </span>
            </div>
            <h1 className="text-5xl font-black tracking-tight text-text-title">
              {selectedLibraryId === null ? '音乐宇宙' : '发现'}
            </h1>
            <p className="text-[13px] font-semibold text-text-muted">
              {displaySongs.length} 首曲目已收录
            </p>
          </div>

          <div className="flex items-center gap-4">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
            <Button 
              onClick={handleAddMusic}
              className="h-12 px-8"
            >
              <Plus size={18} className="mr-2" />
              添加曲目
            </Button>
          </div>
        </div>
      </header>

      {/* Table Content */}
      <div 
        className="flex-1 overflow-y-auto px-12 pb-40 custom-scrollbar"
        onScroll={handleScroll}
      >
        {displaySongs.length === 0 ? (
          <div className="h-[400px] flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-3xl bg-black/3 flex items-center justify-center mb-6">
              <Music size={32} className="text-text-muted/30" />
            </div>
            <h3 className="text-xl font-bold text-text-title mb-2">未发现音乐</h3>
            <p className="text-sm text-text-muted max-w-[280px]">
              {searchQuery ? "没有搜索到匹配的曲目。" : "尝试导入媒体文件夹以开始你的收藏。"}
            </p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-20 bg-white/95">
              <tr className="text-left border-b border-black/3">
                <th className="py-4 pl-4 w-12 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">#</th>
                <th className="py-4 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">曲目详情</th>
                <th className="py-4 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted hidden md:table-cell">专辑</th>
                <th className="py-4 pr-4 w-28 text-right text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">时长</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/3">
              {paddingTop > 0 && (
                <tr style={{ height: paddingTop }}>
                  <td colSpan={4} className="p-0 border-0"></td>
                </tr>
              )}
              {renderedSongs.map((song, localIndex) => {
                const index = startIndex + localIndex;
                const isCurrent = currentSong?.id === song.id;
                const isPlayingRow = isCurrent && isPlaying;
                
                return (
                  <ContextMenu.Root key={song.id}>
                    <ContextMenu.Trigger asChild>
                      <tr 
                        onClick={() => handlePlaySong(song)}
                        className={cn(
                          "group cursor-pointer transition-all duration-300",
                          isCurrent ? "bg-brand-primary/5" : "hover:bg-black/1"
                        )}
                      >
                        <td className="py-4 pl-4 rounded-l-xl">
                          <div className="w-6 text-[12px] font-bold tabular-nums text-text-muted/60">
                            {isPlayingRow ? (
                              <div className="flex items-center gap-[2px] h-3">
                                {[...Array(3)].map((_, i) => (
                                  <div 
                                    key={i} 
                                    className="w-[3px] bg-brand-primary rounded-full animate-wave"
                                    style={{ animationDelay: `${i * 0.1}s` }}
                                  />
                                ))}
                              </div>
                            ) : (
                              <span className={cn(isCurrent && "text-brand-primary")}>
                                {String(index + 1).padStart(2, '0')}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-white border border-black/5 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-500">
                               <Music size={18} className={cn(isCurrent ? "text-brand-primary" : "text-text-muted/40")} />
                            </div>
                            <div className="flex flex-col min-w-0 pr-4">
                              <span className={cn(
                                "text-[14px] font-bold truncate tracking-tight mb-0.5",
                                isCurrent ? "text-brand-primary" : "text-text-title"
                              )}>
                                {song.title}
                              </span>
                              <div className="flex items-center gap-1.5 text-text-muted group-hover:text-text-main transition-colors overflow-hidden">
                                <User size={12} className="shrink-0" />
                                <span className="text-[12px] font-semibold truncate leading-none pt-0.5">
                                  {song.artist || '未知艺术家'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 hidden md:table-cell">
                          <div className="flex items-center gap-1.5 text-text-muted group-hover:text-text-main transition-colors overflow-hidden pr-8">
                            <Album size={12} className="shrink-0" />
                            <span className="text-[12px] font-semibold truncate leading-none pt-0.5">
                              {song.album || '单曲'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 pr-4 text-right rounded-r-xl">
                          <div className="flex items-center justify-end gap-2 text-text-muted">
                            <Clock size={12} />
                            <span className="text-[12px] font-bold tabular-nums">
                              {formatDuration(song.duration_ms)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    </ContextMenu.Trigger>
                    <ContextMenu.Portal>
                      <ContextMenu.Content className="min-w-[180px] bg-white border border-black/5 rounded-xl py-2 animate-in fade-in zoom-in-95 duration-200 z-1000">
                        <ContextMenu.Item 
                          className="flex items-center gap-3 px-4 py-2 text-[12px] font-bold text-text-main hover:bg-black/5 cursor-pointer outline-none transition-colors mx-1 rounded-lg"
                          onClick={() => handlePlaySong(song)}
                        >
                          <Play size={14} className="text-brand-primary fill-brand-primary" />
                          立即播放
                        </ContextMenu.Item>
                        <ContextMenu.Separator className="h-px bg-black/3 my-1.5 mx-3" />
                        <ContextMenu.Item 
                          className="flex items-center gap-3 px-4 py-2 text-[12px] font-bold text-error hover:bg-error/5 cursor-pointer outline-none transition-colors mx-1 rounded-lg"
                          onClick={() => handleDeleteSong(song.id)}
                        >
                          <Trash2 size={14} />
                          移除此曲
                        </ContextMenu.Item>
                        {!song.is_local && (
                          <ContextMenu.Item 
                            className="flex items-center gap-3 px-4 py-2 text-[12px] font-bold text-text-secondary hover:bg-black/5 cursor-pointer outline-none transition-colors mx-1 rounded-lg"
                            onClick={async () => {
                              await useCacheStore.getState().removeFromCache(song.id);
                              await loadAllSongs();
                            }}
                          >
                            <Database size={14} />
                            清除缓存文件
                          </ContextMenu.Item>
                        )}
                      </ContextMenu.Content>
                    </ContextMenu.Portal>
                  </ContextMenu.Root>
                );
              })}
              {paddingBottom > 0 && (
                <tr style={{ height: paddingBottom }}>
                  <td colSpan={4} className="p-0 border-0"></td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

