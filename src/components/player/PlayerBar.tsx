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
import { useEffect, useState, memo } from "react";
import { useLibraryStore } from "../../stores/libraryStore";
import { Slider } from "../common/Slider";

// --- Helpers ---
const formatTime = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

// --- Sub-components ---

const SongInfo = memo(
  ({ currentSong, isPlaying }: { currentSong: any; isPlaying: boolean }) => {
    return (
      <div className="flex items-center gap-4 overflow-hidden">
        <div className="relative w-14 h-14 rounded-2xl bg-white border border-black/5 flex items-center justify-center shrink-0 group cursor-pointer overflow-hidden">
          {isPlaying ? (
            <div className="flex items-center gap-[3px] h-5">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-[3px] bg-brand-primary rounded-full animate-wave will-change-transform"
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
    );
  },
);

const PlaybackControls = memo(
  ({
    isPlaying,
    onPlayPause,
    onNext,
    onPrev,
    disabled,
  }: {
    isPlaying: boolean;
    onPlayPause: () => void;
    onNext: () => void;
    onPrev: () => void;
    disabled: boolean;
  }) => {
    return (
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={onPrev}
          className="p-3 text-text-main hover:bg-black/5 rounded-2xl transition-all btn-premium disabled:opacity-20 translate-x-3 cursor-pointer"
          title="上一首"
          disabled={disabled}
        >
          <SkipBack size={24} className="fill-current" />
        </button>

        <button
          onClick={onPlayPause}
          className="w-12 h-12 rounded-2xl bg-brand-primary text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all btn-premium z-10 cursor-pointer"
        >
          {isPlaying ? (
            <Pause size={24} className="fill-current" />
          ) : (
            <Play size={24} className="fill-current ml-1" />
          )}
        </button>

        <button
          onClick={onNext}
          className="p-3 text-text-main hover:bg-black/5 rounded-2xl transition-all btn-premium disabled:opacity-20 -translate-x-3 cursor-pointer"
          title="下一首"
          disabled={disabled}
        >
          <SkipForward size={24} className="fill-current" />
        </button>
      </div>
    );
  },
);

const PlaybackModeControl = memo(
  ({ mode, onCycle }: { mode: string; onCycle: () => void }) => {
    const getModeInfo = () => {
      switch (mode) {
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
      <button
        onClick={onCycle}
        className="group flex flex-col items-center gap-1.5 p-2 rounded-xl text-text-muted hover:text-brand-primary hover:bg-brand-primary/5 transition-all btn-premium min-w-[64px] cursor-pointer"
        title={modeLabel}
      >
        {modeIcon}
      </button>
    );
  },
);

const VolumeControl = memo(
  ({
    volume,
    onVolumeChange,
  }: {
    volume: number;
    onVolumeChange: (v: number) => void;
  }) => {
    return (
      <div className="flex items-center gap-3 bg-black/3 px-4 py-2.5 rounded-2xl border border-black/5 hover:bg-black/5 transition-all group/volume">
        <button
          onClick={() => onVolumeChange(volume > 0 ? 0 : 1)}
          className="text-text-muted hover:text-text-main transition-colors cursor-pointer"
        >
          {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <Slider
          className="w-24"
          variant="secondary"
          value={[volume * 100]}
          max={100}
          onValueChange={(v) => onVolumeChange(v[0] / 100)}
        />
      </div>
    );
  },
);

/**
 * ProgressControl now manages its own high-frequency updates and dragging state.
 * This prevents the parent PlayerBar from re-rendering during playback.
 */
const ProgressControl = memo(() => {
  // Use specific selectors to only re-render this component when these values change.
  const position = usePlayerStore((state) => state.position);
  const duration = usePlayerStore((state) => state.duration);
  const seek = usePlayerStore((state) => state.seek);

  const [isDragging, setIsDragging] = useState(false);
  const [localSeekValue, setLocalSeekValue] = useState(0);

  // Sync local value with store position when not dragging
  useEffect(() => {
    if (!isDragging) {
      setLocalSeekValue(position);
    }
  }, [position, isDragging]);

  const handleSeek = (value: number[]) => {
    setIsDragging(true);
    setLocalSeekValue(value[0]);
  };

  const handleSeekCommitted = (value: number[]) => {
    seek(value[0]);
    setIsDragging(false);
  };

  return (
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
  );
});

// --- Main Component ---

export function PlayerBar() {
  // IMPORTANT: We do NOT subscribe to 'position' or 'duration' here.
  // This prevents the entire PlayerBar from re-rendering 4-60 times per second.
  const {
    isPlaying,
    currentSong,
    volume,
    playbackMode,
    initAudio,
    pause,
    resume,
    setVolume,
    setPlaybackMode,
    playNext,
    playPrevious,
    queue,
    setQueue,
    playSongAtIndex,
  } = usePlayerStore();

  const { allSongs, loadAllSongs } = useLibraryStore();

  useEffect(() => {
    initAudio();
    loadAllSongs();
  }, []);

  useEffect(() => {
    if (currentSong) {
      invoke("update_tray_menu", {
        title: `正在播放: ${currentSong.title} - ${currentSong.artist}`,
      }).catch(console.error);
    } else {
      invoke("update_tray_menu", { title: "未在播放" }).catch(console.error);
    }
  }, [currentSong]);

  useEffect(() => {
    invoke("update_tray_playback_mode", { mode: playbackMode }).catch(
      console.error,
    );
  }, [playbackMode]);

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

  return (
    <div className="w-full h-24 bg-white/95 rounded-3xl flex flex-col justify-center px-10 border border-black/5 relative outline-none">
      {/* ProgressControl is now self-contained and manages high-frequency state */}
      <ProgressControl />

      <div className="grid grid-cols-[1.2fr_1fr_1.2fr] items-center gap-8 pt-1">
        <SongInfo currentSong={currentSong} isPlaying={isPlaying} />

        <PlaybackControls
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onNext={playNext}
          onPrev={playPrevious}
          disabled={queue.length === 0 && allSongs.length === 0}
        />

        <div className="flex items-center justify-end gap-6">
          <PlaybackModeControl
            mode={playbackMode}
            onCycle={cyclePlaybackMode}
          />
          <div className="h-10 w-px bg-black/5 mx-1" />
          <VolumeControl volume={volume} onVolumeChange={setVolume} />
        </div>
      </div>
    </div>
  );
}
