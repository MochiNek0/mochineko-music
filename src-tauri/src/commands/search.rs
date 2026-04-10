use tauri::{State, Emitter, Window};
use crate::db::Database;
use crate::commands::player::AppState;
use crate::models::MusicItem;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use futures::StreamExt;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct OnlineMusic {
    pub id: String,
    pub title: String,
    pub artist: String,
    pub album: String,
    pub duration_ms: u64,
    pub source: String,
    pub url: String,
    pub cover_url: String,
}
 
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadProgress {
    pub id: String,
    pub progress: u32,
}

fn get_cache_dir() -> PathBuf {
    dirs::data_local_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("MochiNekoMusic")
        .join("cache")
}

const JAMENDO_CLIENT_ID: &str = "5c87b73a";

#[tauri::command(rename_all = "snake_case")]
pub async fn query_online_music(keyword: String) -> Result<Vec<OnlineMusic>, String> {
    if keyword.trim().is_empty() {
        return Ok(Vec::new());
    }

    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .build()
        .map_err(|e| e.to_string())?;

    // Jamendo API 搜索音乐
    let search_url = "https://api.jamendo.com/v3.0/tracks/";
    let params = [
        ("client_id", JAMENDO_CLIENT_ID),
        ("format", "json"),
        ("namesearch", keyword.as_str()),
        ("limit", "30"),
        ("audioformat", "mp32"), // 高音质 MP3
    ];

    let response = client
        .get(search_url)
        .query(&params)
        .send()
        .await
        .map_err(|e| format!("搜索请求失败: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("搜索返回错误状态: {}", response.status()));
    }

    #[derive(Debug, Deserialize)]
    struct JamendoResponse {
        results: Vec<JamendoTrack>,
    }

    #[derive(Debug, Deserialize)]
    struct JamendoTrack {
        id: String,
        name: String,
        duration: u64, // 单位: 秒
        artist_name: String,
        album_name: String,
        image: String,
        audio: String,
        audiodownload: String,
    }

    let search_result: JamendoResponse = response
        .json()
        .await
        .map_err(|e| format!("解析搜索结果失败: {}", e))?;

    let results: Vec<OnlineMusic> = search_result.results
        .into_iter()
        .map(|track| {
            OnlineMusic {
                id: track.id,
                title: track.name,
                artist: track.artist_name,
                album: track.album_name,
                duration_ms: track.duration * 1000, // 秒转毫秒
                source: "Jamendo".to_string(),
                // 优先使用 audiodownload 链接，如果为空则使用 audio
                url: if !track.audiodownload.is_empty() { track.audiodownload } else { track.audio },
                cover_url: track.image,
            }
        })
        .collect();

    Ok(results)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn download_music(
    window: Window,
    db: State<'_, Database>,
    app_state: State<'_, AppState>,
    id: String,
    url: String, 
    title: String, 
    artist: String, 
    album: String, 
    duration_ms: u64
) -> Result<MusicItem, String> {
    // 1. 检查数据库是否已存在同名同艺人的歌曲
    if let Ok(Some(existing_music)) = db.get_music_by_metadata(&title, &artist) {
        println!("Music already exists in library: {} - {}", artist, title);
        return Ok(existing_music);
    }

    // 2. 设置当前活跃的下载 ID 为此歌曲 ID
    {
        let mut active_id = app_state.active_download_id.lock().unwrap();
        *active_id = Some(id.clone());
    }

    // 下载音乐文件到本地缓存
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .build()
        .map_err(|e| e.to_string())?;

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("下载失败: {}", e))?;

    let status = response.status();

    if !status.is_success() {
        return Err(format!("下载失败，状态: {}", status));
    }

    // 从 Content-Type 头获取真实的文件类型
    let content_type = response.headers()
        .get("content-type")
        .and_then(|v: &reqwest::header::HeaderValue| v.to_str().ok())
        .map(|s: &str| s.to_string())
        .unwrap_or_else(|| "audio/mpeg".to_string());

    let total_size = response.content_length().unwrap_or(0);
    let mut downloaded: u64 = 0;
    let mut bytes = Vec::with_capacity(total_size as usize);
    let mut stream = response.bytes_stream();

    while let Some(item) = stream.next().await {
        // 3. 检查是否已被取消（只要 active_download_id 不再是当前歌曲 ID，就视为取消）
        {
            let active_id = app_state.active_download_id.lock().unwrap();
            if active_id.as_ref() != Some(&id) {
                println!("Download cancelled for: {}", title);
                return Err("Cancelled".to_string());
            }
        }

        let chunk = item.map_err(|e: reqwest::Error| format!("读取分块失败: {}", e))?;
        bytes.extend_from_slice(&chunk);
        downloaded += chunk.len() as u64;

        if total_size > 0 {
            let progress = (downloaded as f64 / total_size as f64 * 100.0) as u32;
            let _ = window.emit("download-progress", DownloadProgress {
                id: id.clone(),
                progress,
            });
        }
    }

    // 检查内容是否是 HTML（可能是错误页面）
    if bytes.len() > 100 {
        let content_start = String::from_utf8_lossy(&bytes[..100]);
        if content_start.contains("<!DOCTYPE") || content_start.contains("<html") {
            return Err("无法获取音频文件，可能是链接已失效".to_string());
        }
    }

    let size_mb = bytes.len() as f64 / (1024.0 * 1024.0);

    // 如果文件太小（小于10KB），可能是无效内容
    if bytes.len() < 10000 {
        return Err("音频文件太小，可能下载出错".to_string());
    }

    let cache_dir = get_cache_dir();
    std::fs::create_dir_all(&cache_dir).map_err(|e| e.to_string())?;

    let extension = if content_type.contains("flac") || url.contains(".flac") {
        "flac"
    } else if content_type.contains("ogg") || url.contains(".ogg") {
        "ogg"
    } else if content_type.contains("wav") || url.contains(".wav") {
        "wav"
    } else {
        "mp3"
    };

    let file_name = format!(
        "{}_{}.{}",
        artist.replace(" ", "_").replace("/", "_").replace("\\", "_"),
        title.replace(" ", "_").replace("/", "_").replace("\\", "_"),
        extension
    );

    let cache_path = cache_dir.join(&file_name);

    std::fs::write(&cache_path, &bytes).map_err(|e| format!("保存文件失败: {}", e))?;

    let db = Database::new().map_err(|e| e.to_string())?;

    let music = MusicItem::new(
        title,
        artist,
        album,
        duration_ms,
        cache_path.to_string_lossy().to_string(),
        false,
    );

    let music_id = db.insert_music(&music).map_err(|e| e.to_string())?;

    db.add_to_cache(music_id, &cache_path.to_string_lossy().to_string(), size_mb)
        .map_err(|e| e.to_string())?;

    let mut saved_music = music;
    saved_music.id = music_id;

    // 4. 下载成功后清除活跃下载 ID（如果是当前这首）
    {
        let mut active_id = app_state.active_download_id.lock().unwrap();
        if active_id.as_ref() == Some(&id) {
            *active_id = None;
        }
    }

    Ok(saved_music)
}

#[tauri::command(rename_all = "snake_case")]
pub fn search_music(query: String, db: State<Database>) -> Result<Vec<MusicItem>, String> {
    if query.trim().is_empty() {
        return db.get_all_music().map_err(|e| e.to_string());
    }
    db.search_music(&query).map_err(|e| e.to_string())
}

#[tauri::command(rename_all = "snake_case")]
pub fn get_all_songs(db: State<Database>) -> Result<Vec<MusicItem>, String> {
    db.get_all_music().map_err(|e| e.to_string())
}
