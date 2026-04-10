use tauri::State;
use crate::db::Database;
use crate::models::{MusicItem, PlayerState, PlaybackMode};
use std::sync::Mutex;

pub struct AppState {
    pub player: Mutex<PlayerState>,
    pub queue: Mutex<Vec<MusicItem>>,
    pub queue_index: Mutex<i32>,
    pub active_download_id: Mutex<Option<String>>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            player: Mutex::new(PlayerState::default()),
            queue: Mutex::new(Vec::new()),
            queue_index: Mutex::new(-1),
            active_download_id: Mutex::new(None),
        }
    }
}

#[tauri::command(rename_all = "snake_case")]
pub fn get_player_state(state: State<AppState>) -> Result<PlayerState, String> {
    let player = state.player.lock().map_err(|e| e.to_string())?;
    Ok(player.clone())
}

#[tauri::command(rename_all = "snake_case")]
pub fn set_playback_mode(mode: String, state: State<AppState>) -> Result<(), String> {
    let mut player = state.player.lock().map_err(|e| e.to_string())?;
    player.playback_mode = match mode.as_str() {
        "ListLoop" => PlaybackMode::ListLoop,
        "SingleLoop" => PlaybackMode::SingleLoop,
        "Random" => PlaybackMode::Random,
        "Sequential" => PlaybackMode::Sequential,
        _ => PlaybackMode::ListLoop,
    };
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub fn set_volume(volume: f32, state: State<AppState>) -> Result<(), String> {
    let mut player = state.player.lock().map_err(|e| e.to_string())?;
    player.volume = volume.clamp(0.0, 1.0);
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub fn set_position(position_ms: u64, state: State<AppState>) -> Result<(), String> {
    let mut player = state.player.lock().map_err(|e| e.to_string())?;
    player.position_ms = position_ms;
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub fn set_playing(playing: bool, state: State<AppState>) -> Result<(), String> {
    let mut player = state.player.lock().map_err(|e| e.to_string())?;
    player.is_playing = playing;
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub fn set_current_song(song: Option<MusicItem>, state: State<AppState>) -> Result<(), String> {
    let mut player = state.player.lock().map_err(|e| e.to_string())?;
    player.current_song = song;
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub fn set_duration(duration_ms: u64, state: State<AppState>) -> Result<(), String> {
    let mut player = state.player.lock().map_err(|e| e.to_string())?;
    player.duration_ms = duration_ms;
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub fn get_queue(state: State<AppState>) -> Result<Vec<MusicItem>, String> {
    let queue = state.queue.lock().map_err(|e| e.to_string())?;
    Ok(queue.clone())
}

#[tauri::command(rename_all = "snake_case")]
pub fn set_queue(songs: Vec<MusicItem>, start_index: Option<i32>, state: State<AppState>) -> Result<(), String> {
    let mut queue = state.queue.lock().map_err(|e| e.to_string())?;
    let mut index = state.queue_index.lock().map_err(|e| e.to_string())?;

    *queue = songs;
    *index = start_index.unwrap_or(-1);
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub fn get_queue_index(state: State<AppState>) -> Result<i32, String> {
    let index = state.queue_index.lock().map_err(|e| e.to_string())?;
    Ok(*index)
}

#[tauri::command(rename_all = "snake_case")]
pub fn set_queue_index(index: i32, state: State<AppState>) -> Result<(), String> {
    let mut idx = state.queue_index.lock().map_err(|e| e.to_string())?;
    *idx = index;
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub fn increment_play_count(db: State<Database>, music_id: i64) -> Result<(), String> {
    db.increment_play_count(music_id).map_err(|e| e.to_string())?;
    Ok(())
}
