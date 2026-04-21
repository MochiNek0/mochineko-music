export interface LyricLine {
  time: number; // ms
  text: string;
}

export const lyricsService = {
  /**
   * Fetch lyrics from LRCLIB
   */
  async fetchLyrics(title: string, artist: string, duration?: number) {
    try {
      // First try exact match
      const params = new URLSearchParams({
        track_name: title,
        artist_name: artist,
      });
      if (duration) params.append('duration', Math.floor(duration / 1000).toString());

      const response = await fetch(`https://lrclib.net/api/get?${params.toString()}`);
      
      let exactMatchData = null;
      if (response.ok) {
        exactMatchData = await response.json();
        // If the exact match has synced lyrics, use it immediately
        if (exactMatchData && exactMatchData.syncedLyrics && exactMatchData.syncedLyrics.trim() !== '') {
          return exactMatchData;
        }
      }

      // If exact match fails OR doesn't have syncedLyrics, try search to find any synced lyrics
      const searchParams = new URLSearchParams({
        q: `${title} ${artist}`,
      });
      const searchResponse = await fetch(`https://lrclib.net/api/search?${searchParams.toString()}`);
      
      if (searchResponse.ok) {
        const results = await searchResponse.json();
        if (results && results.length > 0) {
          // Prioritize result with syncedLyrics (LRC)
          const withSynced = results.find((r: any) => r.syncedLyrics && r.syncedLyrics.trim() !== '');
          if (withSynced) {
            return withSynced;
          }
          
          // If no synced lyrics in search, but we had an exact match with plain text, return the exact match
          if (exactMatchData) {
            return exactMatchData;
          }
          
          // Last resort: return the first search result
          return results[0];
        }
      }

      // If search failed but we had an exact match (with no synced lyrics), return it
      return exactMatchData;
    } catch (error) {
      console.error('Failed to fetch lyrics:', error);
      return null;
    }
  },

  /**
   * Parse LRC format string into LyricLine array
   */
  parseLRC(lrc: string): LyricLine[] {
    if (!lrc) return [];

    const lines = lrc.split('\n');
    const result: LyricLine[] = [];
    const timeTagRegex = /\[(\d+):(\d+(?:\.\d+)?)\]/g;

    for (const line of lines) {
      const text = line.replace(/\[\d+:\d+(?:\.\d+)?\]/g, '').trim();
      if (!text) continue;

      let match;
      timeTagRegex.lastIndex = 0;
      while ((match = timeTagRegex.exec(line)) !== null) {
        const minutes = parseInt(match[1]);
        const seconds = parseFloat(match[2]);
        const time = Math.floor((minutes * 60 + seconds) * 1000);
        result.push({ time, text });
      }
    }

    return result.sort((a, b) => a.time - b.time);
  },

  /**
   * Create approximate synced LRC from plain textual lyrics
   */
  createApproximateSynced(plainLyrics: string, durationMs: number): LyricLine[] {
    const lines = plainLyrics.split('\n').filter(l => l.trim().length > 0);
    if (lines.length === 0) return [];
    
    // Center it somewhat by giving buffer time
    const effectiveDuration = durationMs * 0.9; 
    const interval = Math.floor(effectiveDuration / lines.length);
    
    return lines.map((text, i) => ({
      time: Math.floor(interval * i),
      text: text.trim()
    }));
  },

  /**
   * Binary search for the current lyric line index
   */
  findCurrentIndex(lines: LyricLine[], currentTimeMs: number): number {
    if (lines.length === 0) return -1;
    
    let low = 0;
    let high = lines.length - 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (lines[mid].time <= currentTimeMs) {
        if (mid === lines.length - 1 || lines[mid + 1].time > currentTimeMs) {
          return mid;
        }
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    return -1;
  }
};
