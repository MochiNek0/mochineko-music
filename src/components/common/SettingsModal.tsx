import { useEffect } from "react";
import { useSystemStore } from "../../stores/systemStore";
import { Modal } from "./Modal";
import { Settings, Monitor, Archive } from "lucide-react";
import { cn } from "../../lib/utils";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { config, loadConfig, updateConfig } = useSystemStore();

  useEffect(() => {
    if (open) {
      loadConfig();
    }
  }, [open]);

  if (!config) return null;

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="设置中心">
      <div className="space-y-8 py-4">
        {/* Basic Settings */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-brand-primary">
            <Monitor size={18} />
            <h3 className="text-[14px] font-bold">通用设置</h3>
          </div>

          <div className="space-y-3 bg-black/3 p-4 rounded-2xl border border-black/3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[13px] font-bold text-text-title">
                  关闭行为
                </p>
                <p className="text-[11px] text-text-muted">
                  点击主界面关闭按钮时的操作
                </p>
              </div>
              <div className="flex bg-black/5 p-1 rounded-xl gap-1">
                <button
                  onClick={() => updateConfig({ minimize_to_tray: true })}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer",
                    config.minimize_to_tray
                      ? "bg-white text-brand-primary"
                      : "text-text-muted hover:text-text-main",
                  )}
                >
                  缩小到托盘
                </button>
                <button
                  onClick={() => updateConfig({ minimize_to_tray: false })}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer",
                    !config.minimize_to_tray
                      ? "bg-white text-error"
                      : "text-text-muted hover:text-text-main",
                  )}
                >
                  退出应用
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Scan Settings */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-brand-blue">
            <Archive size={18} />
            <h3 className="text-[14px] font-bold">媒体库设置</h3>
          </div>

          <div className="space-y-3 bg-black/3 p-4 rounded-2xl border border-black/3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[13px] font-bold text-text-title">
                  启动时扫描
                </p>
                <p className="text-[11px] text-text-muted">
                  应用程序启动时自动扫描已选目录
                </p>
              </div>
              <button
                onClick={() =>
                  updateConfig({
                    auto_scan_on_startup: !config.auto_scan_on_startup,
                  })
                }
                className={cn(
                  "w-12 h-6 rounded-full relative transition-colors duration-300 outline-none cursor-pointer",
                  config.auto_scan_on_startup
                    ? "bg-brand-primary"
                    : "bg-black/10",
                )}
              >
                <div
                  className={cn(
                    "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300",
                    config.auto_scan_on_startup && "translate-x-6",
                  )}
                />
              </button>
            </div>
          </div>
        </section>

        {/* About */}
        <section className="pt-4 border-t border-black/5">
          <div className="flex items-center gap-3 text-text-muted">
            <div className="w-10 h-10 rounded-xl bg-black/3 flex items-center justify-center">
              <Settings size={20} />
            </div>
            <div>
              <p className="text-[12px] font-black text-text-title">
                Studio Music Player
              </p>
              <p className="text-[10px] font-bold">
                Version 0.1.0 · Powered by Tauri
              </p>
            </div>
          </div>
        </section>
      </div>
    </Modal>
  );
}
