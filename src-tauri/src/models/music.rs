use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PlaybackMode {
    ListLoop,
    SingleLoop,
    Random,
    Sequential,
}

impl Default for PlaybackMode {
    fn default() -> Self {
        PlaybackMode::ListLoop
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MusicItem {
    pub id: i64,
    pub title: String,
    pub artist: String,
    pub album: String,
    pub duration_ms: u64,
    pub path: String,
    pub is_local: bool,
    pub play_count: i64,
    pub added_at: String,
}

impl MusicItem {
    pub fn new(title: String, artist: String, album: String, duration_ms: u64, path: String, is_local: bool) -> Self {
        Self {
            id: 0,
            title,
            artist,
            album,
            duration_ms,
            path,
            is_local,
            play_count: 0,
            added_at: chrono_now(),
        }
    }

}

fn chrono_now() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    format!("{}", duration.as_secs())
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlayerState {
    pub is_playing: bool,
    pub current_song: Option<MusicItem>,
    pub position_ms: u64,
    pub duration_ms: u64,
    pub volume: f32,
    pub playback_mode: PlaybackMode,
}

impl Default for PlayerState {
    fn default() -> Self {
        Self {
            is_playing: false,
            current_song: None,
            position_ms: 0,
            duration_ms: 0,
            volume: 1.0,
            playback_mode: PlaybackMode::ListLoop,
        }
    }
}
