import { useState, useEffect } from "react";
import { useOnlineMusicStore } from "../../stores/onlineMusicStore";
import { usePlayerStore } from "../../stores/playerStore";
import { useShallow } from 'zustand/react/shallow';
import {
  Search,
  X,
  Play,
  Loader2,
  User,
  Album,
  Clock,
  Globe,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { listen } from "@tauri-apps/api/event";

interface OnlineSearchProps {
  onClose?: () => void;
}

export function OnlineSearch({ onClose }: OnlineSearchProps) {
  const [keyword, setKeyword] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);

  const {
    searchResults,
    isSearching,
    searchError,
    isDownloading,
    downloadingSongId,
    downloadProgress,
    searchOnlineMusic,
    clearSearchResults,
  } = useOnlineMusicStore();

  const { currentSong, isPlaying, playOnlineMusic } = usePlayerStore(useShallow((state) => ({
    currentSong: state.currentSong,
    isPlaying: state.isPlaying,
    playOnlineMusic: state.playOnlineMusic
  })));

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (keyword.trim()) {
        searchOnlineMusic(keyword);
      } else {
        clearSearchResults();
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [keyword, searchOnlineMusic, clearSearchResults]);

  // 监听下载进度事件
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    
    const setupListener = async () => {
      unlisten = await listen<{ id: string; progress: number }>("download-progress", (event) => {
        const { id, progress } = event.payload;
        // 只有 ID 匹配时才更新进度条，避免多任务干扰
        if (id === useOnlineMusicStore.getState().downloadingSongId) {
          useOnlineMusicStore.getState().setDownloading(true, `正在下载: ${progress}%`);
        }
      });
    };

    setupListener();

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  const handlePlaySong = async (song: (typeof searchResults)[0]) => {
    try {
      useOnlineMusicStore.getState().setDownloading(true, "正在准备...", song.id);
      await playOnlineMusic(song, (progress) => {
        useOnlineMusicStore.getState().setDownloading(true, progress, song.id);
      });
    } catch (error: any) {
      if (error === "Cancelled" || error?.message === "Cancelled") {
        console.log("Download was cancelled, ignoring error UI");
      } else {
        console.error("Failed to play:", error);
      }
    } finally {
      useOnlineMusicStore.getState().setDownloading(false);
    }
  };

  const isCurrentSong = (song: (typeof searchResults)[0]) => {
    return (
      currentSong?.title === song.title && currentSong?.artist === song.artist
    );
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const isPlayingThisSong = (song: (typeof searchResults)[0]) => {
    return isCurrentSong(song) && isPlaying;
  };

  return (
    <div className="flex flex-col h-full bg-white/50">
      {/* Header */}
      <header className="px-12 pt-14 pb-10 shrink-0">
        <div className="flex items-end justify-between mb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-1.5 h-6 bg-brand-primary rounded-full" />
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-brand-primary/60">
                在线搜索
              </span>
            </div>
            <h1 className="text-5xl font-black tracking-tight text-text-title">
              发现音乐
            </h1>
            <p className="text-[13px] font-semibold text-text-muted">
              从 Jamendo 搜索合法免费音乐，播放即自动本地化加速
            </p>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative w-full max-w-xl group">
          <Search
            size={18}
            className={cn(
              "absolute left-5 top-1/2 -translate-y-1/2 transition-colors",
              isInputFocused ? "text-brand-primary" : "text-text-muted",
            )}
            strokeWidth={2.5}
          />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            placeholder="搜我想听的..."
            className={cn(
              "w-full h-14 pl-14 pr-14 bg-black/3 border border-transparent rounded-2xl",
              "text-[15px] font-semibold text-text-main placeholder:text-text-muted/40",
              "focus:outline-none focus:bg-white/90 focus:border-brand-primary/20 transition-all duration-300",
            )}
          />
          {keyword && (
            <button
              onClick={() => setKeyword("")}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main transition-all"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </header>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-12 pb-40 custom-scrollbar">
        {isSearching && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2
              size={40}
              className="text-brand-primary animate-spin mb-4"
            />
            <p className="text-[14px] font-semibold text-text-muted">
              搜索中...
            </p>
          </div>
        )}

        {searchError && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mb-4">
              <X size={28} className="text-error" />
            </div>
            <p className="text-[14px] font-semibold text-error">
              {searchError}
            </p>
          </div>
        )}

        {!isSearching &&
          !searchError &&
          searchResults.length === 0 &&
          keyword.trim() && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center mb-4">
                <Search size={28} className="text-text-muted/40" />
              </div>
              <h3 className="text-xl font-bold text-text-title mb-2">
                未找到相关音乐
              </h3>
              <p className="text-sm text-text-muted max-w-[280px] text-center">
                没有找到与 "{keyword}" 匹配的音乐，试试其他关键词吧。
              </p>
            </div>
          )}

        {!isSearching && searchResults.length > 0 && (
          <div className="space-y-2">
            <p className="text-[12px] font-bold text-text-muted mb-4">
              找到 {searchResults.length} 首音乐
            </p>
            <div className="space-y-1">
              {searchResults.map((song, index) => (
                <div
                  key={`${song.id}-${index}`}
                  onClick={() => handlePlaySong(song)}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-200",
                    isCurrentSong(song)
                      ? "bg-brand-primary/5 border border-brand-primary/10"
                      : "hover:bg-black/3 border border-transparent",
                    isDownloading && downloadingSongId === song.id && "bg-brand-primary/5"
                  )}
                >
                  <div className="relative group/cover shrink-0">
                    <img
                      src={song.cover_url || "/default-cover.png"}
                      className="w-12 h-12 rounded-xl object-cover shrink-0"
                      alt={song.title}
                    />
                    <div
                      className={cn(
                        "absolute inset-0 rounded-xl flex items-center justify-center transition-all",
                        (isCurrentSong(song) || (isDownloading && downloadingSongId === song.id))
                          ? "bg-brand-primary/80 text-white opacity-100"
                          : "bg-black/40 text-white opacity-0 group-hover/cover:opacity-100",
                      )}
                    >
                      {isDownloading && downloadingSongId === song.id ? (
                        <Loader2 size={18} className="animate-spin text-white" />
                      ) : isPlayingThisSong(song) ? (
                        <div className="flex items-center gap-[2px] h-3">
                          {[...Array(3)].map((_, i) => (
                            <div
                              key={i}
                              className="w-[2px] bg-white rounded-full animate-wave"
                              style={{ animationDelay: `${i * 0.1}s` }}
                            />
                          ))}
                        </div>
                      ) : (
                        <Play size={18} className="fill-current ml-0.5" />
                      )}
                    </div>
                  </div>

                  {/* Song Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={cn(
                          "text-[14px] font-bold truncate",
                          isCurrentSong(song)
                            ? "text-brand-primary"
                            : "text-text-title",
                        )}
                      >
                        {song.title}
                      </span>
                      {isDownloading && downloadingSongId === song.id && (
                        <span className="text-[12px] font-medium text-brand-primary animate-pulse">
                          {downloadProgress || "准备中..."}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-text-muted overflow-hidden">
                      <User size={12} className="shrink-0" />
                      <span className="text-[12px] font-semibold truncate leading-none pt-0.5">
                        {song.artist || "未知艺术家"}
                      </span>
                      <span className="mx-1 text-text-muted/30">·</span>
                      <Album size={12} className="shrink-0" />
                      <span className="text-[12px] font-semibold truncate leading-none pt-0.5">
                        {song.album || "单曲"}
                      </span>
                    </div>
                  </div>

                  {/* Duration & Source */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="flex items-center gap-1.5 text-text-muted">
                      <Globe size={12} />
                      <span className="text-[11px] font-bold">
                        {song.source}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-text-muted">
                      <Clock size={12} />
                      <span className="text-[12px] font-bold tabular-nums">
                        {formatDuration(song.duration_ms)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!keyword.trim() && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-3xl bg-black/3 flex items-center justify-center mb-6">
              <Globe size={36} className="text-text-muted/30" />
            </div>
            <h3 className="text-xl font-bold text-text-title mb-2">开始探索</h3>
            <p className="text-sm text-text-muted max-w-[300px] text-center">
              输入关键词搜索 Jamendo
              上的合法免费音乐，播放即可自动缓存并加速。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
