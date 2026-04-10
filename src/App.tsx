import { useEffect, useState } from 'react';
import { TitleBar } from './components/common/TitleBar';
import { Sidebar } from './components/library/Sidebar';
import { SongList } from './components/playlist/SongList';
import { PlayerBar } from './components/player/PlayerBar';
import { OnlineSearch } from './components/playlist/OnlineSearch';
import { usePlayerStore } from './stores/playerStore';
import { listen } from '@tauri-apps/api/event';

type ViewType = 'library' | 'online';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('library');

  const {
    pause,
    resume,
    playNext,
    playPrevious,
    setPlaybackMode,
  } = usePlayerStore();

  useEffect(() => {
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

