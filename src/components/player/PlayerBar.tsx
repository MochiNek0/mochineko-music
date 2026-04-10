import { usePlayerStore } from "../../stores/playerStore";
import { invoke } from "@tauri-apps/api/core";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  Shuffle,
  Volume2,
  VolumeX,
  Disc3,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLibraryStore } from "../../stores/libraryStore";
import { Slider } from "../common/Slider";

export function PlayerBar() {
  const {
    isPlaying,
    currentSong,
    position,
    duration,
    volume,
    playbackMode,
    initAudio,
    pause,
    resume,
    seek,
    setVolume,
    setPlaybackMode,
    playNext,
    playPrevious,
    queue,
    setQueue,
    playSongAtIndex,
  } = usePlayerStore();

  const { allSongs, loadAllSongs } = useLibraryStore();
  const [isDragging, setIsDragging] = useState(false);
  const [localSeekValue, setLocalSeekValue] = useState(0);

  useEffect(() => {
    initAudio();
    loadAllSongs();
  }, []);

  useEffect(() => {
    if (!isDragging) {
      setLocalSeekValue(position);
    }
  }, [position, isDragging]);

  useEffect(() => {
    if (currentSong) {
      invoke("update_tray_menu", { 
        title: `正在播放: ${currentSong.title} - ${currentSong.artist}` 
      }).catch(console.error);
    } else {
      invoke("update_tray_menu", { title: "未在播放" }).catch(console.error);
    }
  }, [currentSong]);

  useEffect(() => {
    invoke("update_tray_playback_mode", { mode: playbackMode }).catch(console.error);
  }, [playbackMode]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlayPause = () => {
    if (currentSong) {
      if (isPlaying) {
        pause();
      } else {
        resume();
      }
    } else if (allSongs.length > 0) {
      setQueue(allSongs, 0);
      playSongAtIndex(0);
    }
  };

  const handleSeek = (value: number[]) => {
    setIsDragging(true);
    setLocalSeekValue(value[0]);
  };

  const handleSeekCommitted = (value: number[]) => {
    seek(value[0]);
    setIsDragging(false);
  };

  const cyclePlaybackMode = () => {
    const modes: ("ListLoop" | "SingleLoop" | "Random" | "Sequential")[] = [
      "ListLoop",
      "SingleLoop",
      "Random",
      "Sequential",
    ];
    const currentIndex = modes.indexOf(playbackMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setPlaybackMode(modes[nextIndex]);
  };

  const getModeInfo = () => {
    switch (playbackMode) {
      case "SingleLoop":
        return { icon: <Repeat1 size={20} />, label: "单曲循环" };
      case "Random":
        return { icon: <Shuffle size={20} />, label: "随机播放" };
      case "Sequential":
        return {
          icon: <SkipForward size={20} className="rotate-90" />,
          label: "顺序播放",
        };
      default:
        return { icon: <Repeat size={20} />, label: "列表循环" };
    }
  };

  const { icon: modeIcon, label: modeLabel } = getModeInfo();

  return (
    <div className="w-full h-24 bg-white/95 rounded-3xl flex flex-col justify-center px-10 border border-black/5 relative outline-none">
      {/* 进度控制系统 */}
      <div className="absolute top-0 left-10 right-10 -translate-y-1/2 flex items-center gap-3">
        <span className="text-[10px] font-black tabular-nums text-text-muted/60 bg-white/90 px-2.5 py-0.5 rounded-full border border-black/5">
          {formatTime(localSeekValue)}
        </span>
        <Slider
          className="h-1.5"
          value={[localSeekValue]}
          max={duration || 100}
          onValueChange={handleSeek}
          onValueCommit={handleSeekCommitted}
        />
        <span className="text-[10px] font-black tabular-nums text-text-muted/60 bg-white/90 px-2.5 py-0.5 rounded-full border border-black/5">
          {formatTime(duration)}
        </span>
      </div>

      <div className="grid grid-cols-[1.2fr_1fr_1.2fr] items-center gap-8 pt-1">
        {/* 左侧：曲目信息 */}
        <div className="flex items-center gap-4 overflow-hidden">
          <div className="relative w-14 h-14 rounded-2xl bg-white border border-black/5 flex items-center justify-center shrink-0 group cursor-pointer overflow-hidden">
            {isPlaying ? (
              <div className="flex items-center gap-[3px] h-5">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-[3px] bg-brand-primary rounded-full animate-wave"
                    style={{ animationDelay: `${i * 0.15}s`, height: "14px" }}
                  />
                ))}
              </div>
            ) : (
              <Disc3 size={24} className="text-text-muted/30" />
            )}
          </div>
          <div className="flex flex-col min-w-0 pr-4">
            <h4 className="text-[15px] font-bold text-text-title truncate tracking-tight">
              {currentSong?.title || "暂无播放内容"}
            </h4>
            <p className="text-[11px] font-bold text-text-muted truncate mt-0.5 uppercase tracking-widest text-opacity-70">
              {currentSong?.artist || "请选择曲目以开始"}
            </p>
          </div>
        </div>

        {/* 中间：播放控制 */}
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={playPrevious}
            className="p-3 text-text-main hover:bg-black/5 rounded-2xl transition-all btn-premium disabled:opacity-20 translate-x-3 cursor-pointer"
            title="上一首"
            disabled={queue.length === 0 && allSongs.length === 0}
          >
            <SkipBack size={24} className="fill-current" />
          </button>

          <button
            onClick={handlePlayPause}
            className="w-12 h-12 rounded-2xl bg-brand-primary text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all btn-premium z-10 cursor-pointer"
            disabled={allSongs.length === 0 && !currentSong}
          >
            {isPlaying ? (
              <Pause size={24} className="fill-current" />
            ) : (
              <Play size={24} className="fill-current ml-1" />
            )}
          </button>

          <button
            onClick={playNext}
            className="p-3 text-text-main hover:bg-black/5 rounded-2xl transition-all btn-premium disabled:opacity-20 -translate-x-3 cursor-pointer"
            title="下一首"
            disabled={queue.length === 0 && allSongs.length === 0}
          >
            <SkipForward size={24} className="fill-current" />
          </button>
        </div>

        {/* 右侧：模式与音量 */}
        <div className="flex items-center justify-end gap-6">
          <button
            onClick={cyclePlaybackMode}
            className="group flex flex-col items-center gap-1.5 p-2 rounded-xl text-text-muted hover:text-brand-primary hover:bg-brand-primary/5 transition-all btn-premium min-w-[64px] cursor-pointer"
            title={modeLabel}
          >
            {modeIcon}
          </button>

          <div className="h-10 w-px bg-black/5 mx-1" />

          <div className="flex items-center gap-3 bg-black/3 px-4 py-2.5 rounded-2xl border border-black/5 hover:bg-black/5 transition-all group/volume">
            <button
              onClick={() => setVolume(volume > 0 ? 0 : 1)}
              className="text-text-muted hover:text-text-main transition-colors cursor-pointer"
            >
              {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <Slider
              className="w-24"
              variant="secondary"
              value={[volume * 100]}
              max={100}
              onValueChange={(v) => setVolume(v[0] / 100)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
