use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Library {
    pub id: i64,
    pub name: String,
    pub song_count: i64,
    pub created_at: String,
    pub updated_at: String,
}

