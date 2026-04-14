import { useEffect, useState } from 'react';
import { TitleBar } from './components/common/TitleBar';
import { Sidebar } from './components/library/Sidebar';
import { SongList } from './components/playlist/SongList';
import { PlayerBar } from './components/player/PlayerBar';
import { OnlineSearch } from './components/playlist/OnlineSearch';
import { usePlayerStore } from './stores/playerStore';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';

type ViewType = 'library' | 'online';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('library');

  const {
    pause,
    resume,
    playNext,
    playPrevious,
    setPlaybackMode,
    setIsVisible,
  } = usePlayerStore();

  useEffect(() => {
    const appWindow = getCurrentWebviewWindow();
    
    // 监听窗口焦点变化，作为可见性的主要参考
    const unlistenFocus = appWindow.onFocusChanged(({ payload: focused }) => {
      setIsVisible(focused);
    });

    // 监听标准的可见性变化（Web标准）
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    const unlistenPlayPause = listen('tray-play-pause', () => {
      if (usePlayerStore.getState().isPlaying) {
        pause();
      } else {
        resume();
      }
    });

    const unlistenPrev = listen('tray-prev', () => {
      playPrevious();
    });

    const unlistenNext = listen('tray-next', () => {
      playNext();
    });

    const unlistenMode = listen<string>('tray-mode', (event) => {
      setPlaybackMode(event.payload as any);
    });

    return () => {
      unlistenPlayPause.then((fn) => fn());
      unlistenPrev.then((fn) => fn());
      unlistenNext.then((fn) => fn());
      unlistenMode.then((fn) => fn());
      unlistenFocus.then((fn) => fn());
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div className="h-full w-full fluid-bg flex flex-col overflow-hidden relative">
      {/* Top Layer: TitleBar */}
      <TitleBar />

      {/* Middle Layer: Main Content Card */}
      <div className="flex-1 flex overflow-hidden px-10 pb-6 pt-2 gap-8 z-10 min-h-0">
        <div className="flex-1 flex overflow-hidden glass-card rounded-xl relative group transition-all duration-700 cubic-bezier-spring">
          {/* Sidebar Area */}
          <Sidebar
            currentView={currentView}
            onViewChange={setCurrentView}
          />

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col overflow-hidden relative">
            {currentView === 'library' ? (
              <SongList />
            ) : (
              <OnlineSearch onClose={() => setCurrentView('library')} />
            )}
          </main>
        </div>
      </div>

      {/* Bottom Layer: Player Bar */}
      <div className="w-full px-10 pb-8 z-20 shrink-0">
        <PlayerBar />
      </div>
    </div>
  );
}

export default App;

