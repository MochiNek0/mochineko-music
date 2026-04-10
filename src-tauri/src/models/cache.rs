use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheInfo {
    pub total_size_mb: f64,
    pub limit_mb: u64,
    pub item_count: i64,
    pub items: Vec<CacheItem>,
}

impl Default for CacheInfo {
    fn default() -> Self {
        Self {
            total_size_mb: 0.0,
            limit_mb: 2048,
            item_count: 0,
            items: Vec::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheItem {
    pub id: i64,
    pub music_id: i64,
    pub cache_path: String,
    pub size_mb: f64,
    pub play_count: i64,
    pub cached_at: String,
}
