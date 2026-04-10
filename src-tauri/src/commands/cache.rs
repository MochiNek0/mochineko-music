use tauri::State;
use crate::db::Database;
use crate::models::{CacheInfo, CacheItem};
use std::fs;

#[tauri::command(rename_all = "snake_case")]
pub fn get_cache_info(db: State<Database>) -> Result<CacheInfo, String> {
    let config = db.get_config().map_err(|e| e.to_string())?;
    db.get_cache_info(config.cache_limit_mb).map_err(|e| e.to_string())
}

#[tauri::command(rename_all = "snake_case")]
pub fn set_cache_limit(size_mb: u64, db: State<Database>) -> Result<(), String> {
    let mut config = db.get_config().map_err(|e| e.to_string())?;
    config.cache_limit_mb = size_mb;
    db.save_config(&config).map_err(|e| e.to_string())
}

#[tauri::command(rename_all = "snake_case")]
pub fn clear_cache(db: State<Database>) -> Result<(), String> {
    let paths = db.clear_cache().map_err(|e| e.to_string())?;

    for path in paths {
        let _ = fs::remove_file(&path);
    }

    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub fn ensure_cache_space(required_mb: f64, db: State<Database>) -> Result<(), String> {
    let config = db.get_config().map_err(|e| e.to_string())?;
    let mut cache_info = db.get_cache_info(config.cache_limit_mb).map_err(|e| e.to_string())?;

    while cache_info.total_size_mb + required_mb > config.cache_limit_mb as f64 {
        if let Some(victim) = cache_info.items.first() {
            if let Ok(Some(cache_path)) = db.remove_from_cache(victim.music_id) {
                let _ = fs::remove_file(&cache_path);
            }
            cache_info.total_size_mb -= victim.size_mb;
            cache_info.items.remove(0);
        } else {
            break;
        }
    }

    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub fn add_to_cache_pool(music_id: i64, cache_path: String, size_mb: f64, db: State<Database>) -> Result<CacheItem, String> {
    ensure_cache_space(size_mb, db.clone())?;
    db.add_to_cache(music_id, &cache_path, size_mb).map_err(|e| e.to_string())
}

#[tauri::command(rename_all = "snake_case")]
pub fn remove_from_cache_pool(music_id: i64, db: State<Database>) -> Result<(), String> {
    if let Ok(Some(cache_path)) = db.remove_from_cache(music_id) {
        let _ = fs::remove_file(&cache_path);
    }
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub fn increment_cache_play_count(music_id: i64, db: State<Database>) -> Result<(), String> {
    db.increment_cache_play_count(music_id).map_err(|e| e.to_string())
}
