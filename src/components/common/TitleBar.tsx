import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, X, Maximize2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useLyricsStore } from "../../stores/lyricsStore";
import { InlineLyrics } from "../player/InlineLyrics";

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const checkMaximized = async () => {
      const win = getCurrentWindow();
      setIsMaximized(await win.isMaximized());
    };
    checkMaximized();

    const unlisten = getCurrentWindow().onResized(async () => {
      const win = getCurrentWindow();
      setIsMaximized(await win.isMaximized());
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const handleMinimize = async () => {
    const win = getCurrentWindow();
    await win.minimize();
  };

  const handleMaximize = async () => {
    const win = getCurrentWindow();
    if (await win.isMaximized()) {
      await win.unmaximize();
      setIsMaximized(false);
    } else {
      await win.maximize();
      setIsMaximized(true);
    }
  };

  const handleClose = async () => {
    const win = getCurrentWindow();
    await win.close();
  };

  return (
    <div
      data-tauri-drag-region
      className="h-14 bg-transparent flex items-center justify-between select-none relative z-100 shrink-0"
    >
      {/* Brand Section */}
      <div className="flex items-center gap-3 px-8" data-tauri-drag-region>
        <div className="flex items-center justify-center h-7 w-7 bg-white rounded-xl border border-black/5 overflow-hidden">
          <img
            src="/logo.svg"
            alt="logo"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex flex-col gap-0">
          <span className="text-[11px] font-extrabold text-text-title uppercase tracking-[0.25em] leading-none">
            糯糯喵音
          </span>
          <span className="text-[9px] font-medium text-text-muted uppercase tracking-widest leading-none mt-0.5">
            MochiNeko
          </span>
        </div>
      </div>

      {/* Status Bar / Inline Lyrics */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center w-1/3 min-w-[200px] h-full pointer-events-none">
        {useLyricsStore((state) => state.isVisible) ? (
          <InlineLyrics />
        ) : (
          <div className="flex items-center gap-2.5 text-[10px] text-text-muted font-bold uppercase tracking-[0.18em]">
            <div className="w-1.5 h-1.5 rounded-full bg-success/60" />
            <span className="opacity-80">系统就绪</span>
          </div>
        )}
      </div>

      {/* Window Controls */}
      <div
        className="flex items-center h-full gap-2 pr-4"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <button
          onClick={handleMinimize}
          className="h-9 w-9 rounded-full flex items-center justify-center text-text-muted hover:text-text-main hover:bg-black/4 btn-premium"
          title="最小化"
        >
          <Minus size={15} strokeWidth={2.2} />
        </button>

        <button
          onClick={handleMaximize}
          className="h-9 w-9 rounded-full flex items-center justify-center text-text-muted hover:text-text-main hover:bg-black/4 btn-premium"
          title={isMaximized ? "还原" : "最大化"}
        >
          {isMaximized ? (
            <Square size={13} strokeWidth={2.2} />
          ) : (
            <Maximize2 size={14} strokeWidth={2.2} />
          )}
        </button>

        <button
          onClick={handleClose}
          className="h-9 w-9 rounded-full flex items-center justify-center text-text-muted hover:text-white hover:bg-error btn-premium"
          title="关闭"
        >
          <X size={16} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}
