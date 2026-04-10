use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub cache_limit_mb: u64,
    pub default_playback_mode: String,
    pub minimize_to_tray: bool,
    pub auto_scan_on_startup: bool,
    pub scan_directories: Vec<String>,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            cache_limit_mb: 2048,
            default_playback_mode: "ListLoop".to_string(),
            minimize_to_tray: true,
            auto_scan_on_startup: false,
            scan_directories: Vec::new(),
        }
    }
}
