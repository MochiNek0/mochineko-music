use tauri::State;
use crate::db::Database;
use crate::models::{Library, MusicItem};
use std::path::Path;
use lofty::{AudioFile, TaggedFileExt, Accessor};

#[tauri::command(rename_all = "snake_case")]
pub fn create_library(name: String, db: State<Database>) -> Result<Library, String> {
    db.create_library(&name).map_err(|e| e.to_string())
}

#[tauri::command(rename_all = "snake_case")]
pub fn get_libraries(db: State<Database>) -> Result<Vec<Library>, String> {
    db.get_libraries().map_err(|e| e.to_string())
}

#[tauri::command(rename_all = "snake_case")]
pub fn delete_library(id: i64, db: State<Database>) -> Result<(), String> {
    db.delete_library(id).map_err(|e| e.to_string())
}

#[tauri::command(rename_all = "snake_case")]
pub fn rename_library(id: i64, new_name: String, db: State<Database>) -> Result<(), String> {
    db.rename_library(id, &new_name).map_err(|e| e.to_string())
}

#[tauri::command(rename_all = "snake_case")]
pub fn add_music_to_library(library_id: i64, music_id: i64, db: State<Database>) -> Result<(), String> {
    db.add_music_to_library(library_id, music_id).map_err(|e| e.to_string())
}

#[tauri::command(rename_all = "snake_case")]
pub fn remove_music_from_library(library_id: i64, music_id: i64, db: State<Database>) -> Result<(), String> {
    db.remove_music_from_library(library_id, music_id).map_err(|e| e.to_string())
}

#[tauri::command(rename_all = "snake_case")]
pub fn get_library_songs(library_id: i64, db: State<Database>) -> Result<Vec<MusicItem>, String> {
    db.get_library_songs(library_id).map_err(|e| e.to_string())
}

#[tauri::command(rename_all = "snake_case")]
pub fn scan_directory(path: String, db: State<Database>) -> Result<Vec<MusicItem>, String> {
    let supported_extensions = ["mp3", "flac", "wav", "ogg", "m4a"];
    let mut results = Vec::new();

    let dir_path = Path::new(&path);
    if !dir_path.is_dir() {
        return Err("Invalid directory path".to_string());
    }

    fn scan_dir(dir: &Path, supported: &[&str], db: &Database, results: &mut Vec<MusicItem>) -> Result<(), String> {
        let entries = std::fs::read_dir(dir).map_err(|e| e.to_string())?;

        for entry in entries.flatten() {
            let path = entry.path();

            if path.is_dir() {
                scan_dir(&path, supported, db, results)?;
            } else if let Some(ext) = path.extension() {
                let ext_str = ext.to_string_lossy().to_lowercase();
                if supported.contains(&ext_str.as_str()) {
                    if let Ok(music) = parse_music_file(&path) {
                        if let Ok(existing) = db.get_music_by_path(&music.path) {
                            if existing.is_none() {
                                if let Ok(id) = db.insert_music(&music) {
                                    let mut item = music;
                                    item.id = id;
                                    results.push(item);
                                }
                            } else if let Some(item) = existing {
                                results.push(item);
                            }
                        }
                    }
                }
            }
        }
        Ok(())
    }

    scan_dir(dir_path, &supported_extensions, &db, &mut results)?;
    Ok(results)
}

fn parse_music_file(path: &Path) -> Result<MusicItem, String> {
    let tagged_file = lofty::read_from_path(path).map_err(|e| e.to_string())?;

    let default_title = || {
        path.file_stem()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_else(|| "Unknown".to_string())
    };

    let (title, artist, album) = if let Some(tag) = tagged_file.primary_tag() {
        let title_str: String = tag.title()
            .map(|s| s.to_string())
            .unwrap_or_else(default_title);
        let artist_str: String = tag.artist()
            .map(|s| s.to_string())
            .unwrap_or_else(|| "Unknown".to_string());
        let album_str: String = tag.album()
            .map(|s| s.to_string())
            .unwrap_or_else(|| "Unknown".to_string());
        (title_str, artist_str, album_str)
    } else {
        (
            default_title(),
            "Unknown".to_string(),
            "Unknown".to_string(),
        )
    };

    let duration_ms = tagged_file.properties().duration().as_millis() as u64;

    Ok(MusicItem::new(
        title,
        artist,
        album,
        duration_ms,
        path.to_string_lossy().to_string(),
        true,
    ))
}

#[tauri::command(rename_all = "snake_case")]
pub fn add_music_by_path(path: String, db: State<Database>) -> Result<MusicItem, String> {
    if let Ok(existing) = db.get_music_by_path(&path) {
        if let Some(music) = existing {
            return Ok(music);
        }
    }

    let path_obj = Path::new(&path);
    if !path_obj.exists() {
        return Err("File does not exist".to_string());
    }

    let music = parse_music_file(path_obj)?;
    let id = db.insert_music(&music).map_err(|e| e.to_string())?;

    let mut item = music;
    item.id = id;
    Ok(item)
}

#[tauri::command(rename_all = "snake_case")]
pub fn delete_music(music_id: i64, db: State<Database>) -> Result<(), String> {
    db.delete_music(music_id).map_err(|e| e.to_string())
}
