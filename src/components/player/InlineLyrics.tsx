import React from 'react';
import { useLyricsStore } from '../../stores/lyricsStore';

export const InlineLyrics: React.FC = () => {
  const {
    lines,
    plainText,
    currentIndex,
    loading,
    error,
  } = useLyricsStore();

  const currentLine = lines[currentIndex]?.text || plainText || (loading ? '正在同步歌词...' : error || '暂无播放内容');

  return (
    <div className="flex items-center justify-center w-full select-none cursor-default truncate bg-black/5 rounded-full px-3 py-1.5 backdrop-blur-sm border border-black/5">
      <span className="text-[11px] font-bold text-text-title transition-all duration-300 tracking-wider truncate opacity-80">
        {currentLine}
      </span>
    </div>
  );
};
