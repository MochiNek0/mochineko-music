import { useEffect, useState } from 'react';
import { useLibraryStore } from '../../stores/libraryStore';
import { useCacheStore } from '../../stores/cacheStore';
import { open } from '@tauri-apps/plugin-dialog';
import {
  FolderOpen,
  Plus,
  Trash2,
  Database,
  Music,
  LayoutGrid,
  Globe,
  Settings,
} from 'lucide-react';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { Modal } from '../common/Modal';
import { SettingsModal } from '../common/SettingsModal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { cn } from '../../lib/utils';

interface SidebarProps {
  currentView?: 'library' | 'online';
  onViewChange?: (view: 'library' | 'online') => void;
}

export function Sidebar({ currentView = 'library', onViewChange }: SidebarProps) {
  const {
    libraries,
    selectedLibraryId,
    loadLibraries,
    createLibrary,
    deleteLibrary,
    selectLibrary,
    scanDirectory,
  } = useLibraryStore();

  const { cacheInfo, loadCacheInfo } = useCacheStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [newLibraryName, setNewLibraryName] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    loadLibraries();
    loadCacheInfo();
  }, []);

  const handleOpenFolder = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: '选择音乐文件夹',
    });

    if (selected) {
      setIsScanning(true);
      try {
        await scanDirectory(selected as string);
      } finally {
        setIsScanning(false);
      }
    }
  };

  const handleCreateLibrary = async () => {
    if (newLibraryName.trim()) {
      await createLibrary(newLibraryName.trim());
      setNewLibraryName('');
      setShowCreateModal(false);
    }
  };

  const handleDeleteLibrary = async (id: number) => {
    await deleteLibrary(id);
  };

  const totalSongs = libraries.reduce((acc, lib) => acc + lib.song_count, 0);

  return (
    <aside className="w-[280px] h-full flex flex-col shrink-0 border-r border-black/3 bg-black/1">
      {/* Sidebar Header */}
      <div className="px-8 pt-8 pb-6 shrink-0">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center">
              <LayoutGrid size={16} className="text-white" />
            </div>
            <span className="font-bold text-[13px] tracking-tight text-text-title">工作空间</span>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-brand-primary hover:bg-black/5 transition-all btn-premium"
            title="创建媒体库"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Action Pills */}
        <div className="space-y-1.5 focus-within:z-10">
          <button
            onClick={handleOpenFolder}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-semibold text-text-secondary hover:text-text-main hover:bg-white border border-transparent hover:border-black/2 transition-all group btn-premium"
            disabled={isScanning}
          >
            <div className="w-8 h-8 rounded-lg bg-brand-blue/5 flex items-center justify-center group-hover:bg-brand-blue/10 transition-colors">
              <FolderOpen size={16} className="text-brand-blue" />
            </div>
            <span>{isScanning ? '正在扫描...' : '导入媒体文件'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Scroll Area */}
      <nav className="flex-1 overflow-y-auto px-4 pb-6 space-y-8 custom-scrollbar">
        {/* Libraries Section */}
        <section>
          <div className="px-4 mb-4 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-text-muted">媒体库</span>
            <span className="text-[9px] font-bold text-text-muted/40 px-2 py-0.5 rounded-full border border-black/3">
              {totalSongs} 首歌曲
            </span>
          </div>
          
          <div className="space-y-1">
            <NavItem
              icon={<Music size={16} />}
              label="所有曲目"
              isActive={selectedLibraryId === null && currentView === 'library'}
              onClick={() => {
                selectLibrary(null);
                onViewChange?.('library');
              }}
            />

            <NavItem
              icon={<Globe size={16} />}
              label="在线搜索"
              isActive={currentView === 'online'}
              onClick={() => onViewChange?.('online')}
              highlight
            />

            {libraries.map((lib) => (
              <ContextMenu.Root key={lib.id}>
                <ContextMenu.Trigger>
                  <NavItem 
                    icon={<Database size={16} />}
                    label={lib.name}
                    count={lib.song_count}
                    isActive={selectedLibraryId === lib.id}
                    onClick={() => selectLibrary(lib.id)}
                  />
                </ContextMenu.Trigger>
                <ContextMenu.Portal>
                  <ContextMenu.Content className="min-w-[160px] bg-white border border-black/5 rounded-xl py-1.5 animate-in fade-in zoom-in-95 duration-200 z-1000">
                    <ContextMenu.Item 
                      className="flex items-center gap-2 px-3 py-2 text-[12px] font-semibold text-error hover:bg-error/5 cursor-pointer outline-none transition-colors mx-1 rounded-lg"
                      onClick={() => handleDeleteLibrary(lib.id)}
                    >
                      <Trash2 size={14} />
                      删除媒体库
                    </ContextMenu.Item>
                  </ContextMenu.Content>
                </ContextMenu.Portal>
              </ContextMenu.Root>
            ))}
          </div>
        </section>
      </nav>

      {/* Footer / Storage */}
      <footer className="p-6 shrink-0 mt-auto border-t border-black/2 space-y-4">
        <div className="px-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] text-text-muted font-bold tracking-widest uppercase">缓存</span>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-text-main font-extrabold">
                {cacheInfo ? `${Math.round(cacheInfo.total_size_mb)} MB` : '0 MB'}
              </span>
              <button 
                onClick={async () => {
                  if (confirm('确定要清空所有已缓存的歌曲吗？这将移除所有已下载的在线音乐。')) {
                    await useCacheStore.getState().clearCache();
                    await useLibraryStore.getState().loadAllSongs();
                  }
                }}
                className="w-5 h-5 rounded-md flex items-center justify-center text-text-muted hover:text-error hover:bg-error/5 transition-all"
                title="清空缓存"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
          <div className="h-1 bg-black/3 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full bg-brand-primary transition-all duration-1000 rounded-full",
                cacheInfo && (cacheInfo.total_size_mb / cacheInfo.limit_mb) > 0.8 ? "bg-error" : "bg-brand-primary"
              )}
              style={{
                width: cacheInfo
                  ? `${Math.min((cacheInfo.total_size_mb / cacheInfo.limit_mb) * 100, 100)}%`
                  : '0%',
              }}
            />
          </div>
        </div>

        <button
          onClick={() => setShowSettingsModal(true)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-semibold text-text-secondary hover:text-text-main hover:bg-white border border-transparent hover:border-black/2 transition-all group btn-premium"
        >
          <div className="w-8 h-8 rounded-lg bg-black/3 flex items-center justify-center group-hover:bg-brand-primary/10 transition-colors">
            <Settings size={16} className="text-text-muted group-hover:text-brand-primary transition-colors" />
          </div>
          <span>应用设置</span>
        </button>
      </footer>

      {/* Create Library Modal */}
      <Modal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        title="创建新媒体库"
      >
        <div className="space-y-6 pt-2">
          <Input
            placeholder="媒体库名称"
            value={newLibraryName}
            onChange={(e) => setNewLibraryName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateLibrary()}
            autoFocus
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
              取消
            </Button>
            <Button onClick={handleCreateLibrary} disabled={!newLibraryName.trim()}>
              确认
            </Button>
          </div>
        </div>
      </Modal>

      {/* Settings Modal */}
      <SettingsModal
        open={showSettingsModal}
        onOpenChange={setShowSettingsModal}
      />
    </aside>
  );
}

function NavItem({
  icon,
  label,
  count,
  isActive,
  onClick,
  highlight
}: {
  icon: React.ReactNode;
  label: string;
  count?: number;
  isActive: boolean;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all group btn-premium border border-transparent",
        isActive
          ? "bg-white text-text-main border border-black/2"
          : highlight
          ? "text-brand-primary hover:text-brand-primary hover:bg-brand-primary/5"
          : "text-text-secondary hover:text-text-main hover:bg-white/50"
      )}
    >
      <div className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0",
        isActive ? "bg-brand-primary text-white" :
        highlight ? "bg-brand-primary/10 text-brand-primary" : "bg-black/2 text-text-muted group-hover:text-text-main"
      )}>
        {icon}
      </div>
      <span className="flex-1 text-left truncate">{label}</span>
      {count !== undefined && (
        <span className={cn(
          "text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors shrink-0",
          isActive ? "bg-brand-primary/10 text-brand-primary" : "bg-black/2 text-text-muted"
        )}>
          {count}
        </span>
      )}
      {highlight && !isActive && (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-brand-primary/10 text-brand-primary shrink-0">
          新
        </span>
      )}
    </button>
  );
}

