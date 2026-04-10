use rusqlite::{Connection, Result, params};
use std::sync::Mutex;
use std::path::PathBuf;
use crate::models::{MusicItem, Library, CacheItem, CacheInfo, AppConfig};

pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    pub fn new() -> Result<Self> {
        let db_path = Self::get_db_path();

        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent).ok();
        }

        let conn = Connection::open(&db_path)?;
        let db = Self { conn: Mutex::new(conn) };
        db.init_tables()?;
        Ok(db)
    }

    fn get_db_path() -> PathBuf {
        dirs::data_local_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("MochiNekoMusic")
            .join("data.db")
    }

    fn init_tables(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();

        conn.execute(
            "CREATE TABLE IF NOT EXISTS libraries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS music_files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                artist TEXT DEFAULT 'Unknown',
                album TEXT DEFAULT 'Unknown',
                duration_ms INTEGER DEFAULT 0,
                path TEXT NOT NULL UNIQUE,
                is_local INTEGER DEFAULT 1,
                play_count INTEGER DEFAULT 0,
                added_at TEXT NOT NULL
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS library_music (
                library_id INTEGER,
                music_id INTEGER,
                added_at TEXT NOT NULL,
                PRIMARY KEY (library_id, music_id),
                FOREIGN KEY (library_id) REFERENCES libraries(id) ON DELETE CASCADE,
                FOREIGN KEY (music_id) REFERENCES music_files(id) ON DELETE CASCADE
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS cache_pool (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                music_id INTEGER NOT NULL,
                cache_path TEXT NOT NULL,
                size_mb REAL NOT NULL,
                play_count INTEGER DEFAULT 0,
                cached_at TEXT NOT NULL,
                FOREIGN KEY (music_id) REFERENCES music_files(id) ON DELETE CASCADE
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS app_config (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )",
            [],
        )?;

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_music_title ON music_files(title)",
            [],
        )?;

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_music_artist ON music_files(artist)",
            [],
        )?;

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_cache_play_count ON cache_pool(play_count)",
            [],
        )?;

        Ok(())
    }

    // Music operations
    pub fn insert_music(&self, music: &MusicItem) -> Result<i64> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT OR IGNORE INTO music_files (title, artist, album, duration_ms, path, is_local, play_count, added_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                music.title,
                music.artist,
                music.album,
                music.duration_ms,
                music.path,
                music.is_local as i32,
                music.play_count,
                music.added_at,
            ],
        )?;
        Ok(conn.last_insert_rowid())
    }

    pub fn get_music_by_path(&self, path: &str) -> Result<Option<MusicItem>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, title, artist, album, duration_ms, path, is_local, play_count, added_at
             FROM music_files WHERE path = ?1"
        )?;

        let mut rows = stmt.query(params![path])?;

        if let Some(row) = rows.next()? {
            Ok(Some(Self::row_to_music(row)?))
        } else {
            Ok(None)
        }
    }

    pub fn get_music_by_metadata(&self, title: &str, artist: &str) -> Result<Option<MusicItem>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, title, artist, album, duration_ms, path, is_local, play_count, added_at
             FROM music_files WHERE title = ?1 AND artist = ?2"
        )?;

        let mut rows = stmt.query(params![title, artist])?;

        if let Some(row) = rows.next()? {
            Ok(Some(Self::row_to_music(row)?))
        } else {
            Ok(None)
        }
    }

    pub fn get_all_music(&self) -> Result<Vec<MusicItem>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, title, artist, album, duration_ms, path, is_local, play_count, added_at
             FROM music_files ORDER BY title"
        )?;

        let mut rows = stmt.query([])?;
        let mut results = Vec::new();

        while let Some(row) = rows.next()? {
            results.push(Self::row_to_music(row)?);
        }

        Ok(results)
    }

    pub fn search_music(&self, query: &str) -> Result<Vec<MusicItem>> {
        let conn = self.conn.lock().unwrap();
        let pattern = format!("%{}%", query);
        let mut stmt = conn.prepare(
            "SELECT id, title, artist, album, duration_ms, path, is_local, play_count, added_at
             FROM music_files
             WHERE title LIKE ?1 OR artist LIKE ?1 OR album LIKE ?1
             ORDER BY title"
        )?;

        let mut rows = stmt.query(params![pattern])?;
        let mut results = Vec::new();

        while let Some(row) = rows.next()? {
            results.push(Self::row_to_music(row)?);
        }

        Ok(results)
    }

    pub fn increment_play_count(&self, music_id: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE music_files SET play_count = play_count + 1 WHERE id = ?1",
            params![music_id],
        )?;
        Ok(())
    }

    pub fn delete_music(&self, music_id: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM music_files WHERE id = ?1", params![music_id])?;
        Ok(())
    }

    fn row_to_music(row: &rusqlite::Row) -> Result<MusicItem> {
        Ok(MusicItem {
            id: row.get(0)?,
            title: row.get(1)?,
            artist: row.get(2)?,
            album: row.get(3)?,
            duration_ms: row.get(4)?,
            path: row.get(5)?,
            is_local: row.get::<_, i32>(6)? != 0,
            play_count: row.get(7)?,
            added_at: row.get(8)?,
        })
    }

    // Library operations
    pub fn create_library(&self, name: &str) -> Result<Library> {
        let conn = self.conn.lock().unwrap();
        let now = chrono_now();
        conn.execute(
            "INSERT INTO libraries (name, created_at, updated_at) VALUES (?1, ?2, ?3)",
            params![name, now, now],
        )?;
        let id = conn.last_insert_rowid();
        Ok(Library {
            id,
            name: name.to_string(),
            song_count: 0,
            created_at: now.clone(),
            updated_at: now,
        })
    }

    pub fn get_libraries(&self) -> Result<Vec<Library>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT l.id, l.name, l.created_at, l.updated_at,
                    (SELECT COUNT(*) FROM library_music WHERE library_id = l.id) as song_count
             FROM libraries l ORDER BY l.name"
        )?;

        let mut rows = stmt.query([])?;
        let mut results = Vec::new();

        while let Some(row) = rows.next()? {
            results.push(Library {
                id: row.get(0)?,
                name: row.get(1)?,
                created_at: row.get(2)?,
                updated_at: row.get(3)?,
                song_count: row.get(4)?,
            });
        }

        Ok(results)
    }

    pub fn delete_library(&self, id: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM libraries WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn rename_library(&self, id: i64, new_name: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let now = chrono_now();
        conn.execute(
            "UPDATE libraries SET name = ?1, updated_at = ?2 WHERE id = ?3",
            params![new_name, now, id],
        )?;
        Ok(())
    }

    pub fn add_music_to_library(&self, library_id: i64, music_id: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let now = chrono_now();
        conn.execute(
            "INSERT OR IGNORE INTO library_music (library_id, music_id, added_at) VALUES (?1, ?2, ?3)",
            params![library_id, music_id, now],
        )?;
        Ok(())
    }

    pub fn remove_music_from_library(&self, library_id: i64, music_id: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "DELETE FROM library_music WHERE library_id = ?1 AND music_id = ?2",
            params![library_id, music_id],
        )?;
        Ok(())
    }

    pub fn get_library_songs(&self, library_id: i64) -> Result<Vec<MusicItem>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT m.id, m.title, m.artist, m.album, m.duration_ms, m.path, m.is_local, m.play_count, m.added_at
             FROM music_files m
             INNER JOIN library_music lm ON m.id = lm.music_id
             WHERE lm.library_id = ?1
             ORDER BY m.title"
        )?;

        let mut rows = stmt.query(params![library_id])?;
        let mut results = Vec::new();

        while let Some(row) = rows.next()? {
            results.push(Self::row_to_music(row)?);
        }

        Ok(results)
    }

    // Cache operations
    pub fn get_cache_info(&self, limit_mb: u64) -> Result<CacheInfo> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, music_id, cache_path, size_mb, play_count, cached_at FROM cache_pool ORDER BY play_count ASC, cached_at ASC"
        )?;

        let mut rows = stmt.query([])?;
        let mut items = Vec::new();
        let mut total_size = 0.0;

        while let Some(row) = rows.next()? {
            let size_mb: f64 = row.get(3)?;
            total_size += size_mb;
            items.push(CacheItem {
                id: row.get(0)?,
                music_id: row.get(1)?,
                cache_path: row.get(2)?,
                size_mb,
                play_count: row.get(4)?,
                cached_at: row.get(5)?,
            });
        }

        Ok(CacheInfo {
            total_size_mb: total_size,
            limit_mb,
            item_count: items.len() as i64,
            items,
        })
    }

    pub fn add_to_cache(&self, music_id: i64, cache_path: &str, size_mb: f64) -> Result<CacheItem> {
        let conn = self.conn.lock().unwrap();
        let now = chrono_now();
        conn.execute(
            "INSERT INTO cache_pool (music_id, cache_path, size_mb, play_count, cached_at)
             VALUES (?1, ?2, ?3, 0, ?4)",
            params![music_id, cache_path, size_mb, now],
        )?;
        let id = conn.last_insert_rowid();
        Ok(CacheItem {
            id,
            music_id,
            cache_path: cache_path.to_string(),
            size_mb,
            play_count: 0,
            cached_at: now,
        })
    }

    pub fn remove_from_cache(&self, music_id: i64) -> Result<Option<String>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT cache_path FROM cache_pool WHERE music_id = ?1")?;
        let mut rows = stmt.query(params![music_id])?;

        if let Some(row) = rows.next()? {
            let cache_path: String = row.get(0)?;
            conn.execute("DELETE FROM cache_pool WHERE music_id = ?1", params![music_id])?;
            // Also delete from music_files if it's an online (cached) song
            conn.execute("DELETE FROM music_files WHERE id = ?1 AND is_local = 0", params![music_id])?;
            Ok(Some(cache_path))
        } else {
            Ok(None)
        }
    }

    pub fn increment_cache_play_count(&self, music_id: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE cache_pool SET play_count = play_count + 1 WHERE music_id = ?1",
            params![music_id],
        )?;
        Ok(())
    }

    pub fn clear_cache(&self) -> Result<Vec<String>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT cache_path FROM cache_pool")?;
        let mut rows = stmt.query([])?;
        let mut paths = Vec::new();

        while let Some(row) = rows.next()? {
            paths.push(row.get(0)?);
        }

        conn.execute("DELETE FROM cache_pool", [])?;
        // Also delete online songs from music_files
        conn.execute("DELETE FROM music_files WHERE is_local = 0", [])?;
        Ok(paths)
    }

    // Config operations
    pub fn get_config(&self) -> Result<AppConfig> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT key, value FROM app_config")?;
        let mut rows = stmt.query([])?;

        let mut config = AppConfig::default();

        while let Some(row) = rows.next()? {
            let key: String = row.get(0)?;
            let value: String = row.get(1)?;

            match key.as_str() {
                "cache_limit_mb" => {
                    config.cache_limit_mb = value.parse().unwrap_or(2048);
                }
                "default_playback_mode" => {
                    config.default_playback_mode = value;
                }
                "minimize_to_tray" => {
                    config.minimize_to_tray = value == "true";
                }
                "auto_scan_on_startup" => {
                    config.auto_scan_on_startup = value == "true";
                }
                "scan_directories" => {
                    config.scan_directories = serde_json::from_str(&value).unwrap_or_default();
                }
                _ => {}
            }
        }

        Ok(config)
    }

    pub fn save_config(&self, config: &AppConfig) -> Result<()> {
        let conn = self.conn.lock().unwrap();

        let pairs = [
            ("cache_limit_mb", config.cache_limit_mb.to_string()),
            ("default_playback_mode", config.default_playback_mode.clone()),
            ("minimize_to_tray", config.minimize_to_tray.to_string()),
            ("auto_scan_on_startup", config.auto_scan_on_startup.to_string()),
            ("scan_directories", serde_json::to_string(&config.scan_directories).unwrap_or_default()),
        ];

        for (key, value) in pairs {
            conn.execute(
                "INSERT OR REPLACE INTO app_config (key, value) VALUES (?1, ?2)",
                params![key, value],
            )?;
        }

        Ok(())
    }
}

fn chrono_now() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    format!("{}", duration.as_secs())
}
