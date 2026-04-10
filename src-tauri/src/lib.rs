mod commands;
mod db;
mod models;
mod tray;

use commands::{
    player::{
        get_player_state, set_playback_mode, set_volume, set_position, set_playing,
        set_current_song, set_duration, get_queue, set_queue, get_queue_index,
        set_queue_index, increment_play_count, AppState,
    },
    library::{
        create_library, get_libraries, delete_library, rename_library,
        add_music_to_library, remove_music_from_library, get_library_songs,
        scan_directory, add_music_by_path, delete_music,
    },
    cache::{
        get_cache_info, set_cache_limit, clear_cache, ensure_cache_space,
        add_to_cache_pool, remove_from_cache_pool, increment_cache_play_count,
    },
    search::{search_music, get_all_songs, query_online_music, download_music},
    system::{get_app_config, save_app_config, minimize_to_tray, show_window, update_tray_menu, update_tray_playback_mode},
};

use db::Database;
use tauri::{menu::{MenuItem, CheckMenuItem}, Manager, Wry};
use std::sync::Mutex;

pub struct TrayState {
    pub current_song_item: Mutex<Option<MenuItem<Wry>>>,
    pub list_loop_item: Mutex<Option<CheckMenuItem<Wry>>>,
    pub single_loop_item: Mutex<Option<CheckMenuItem<Wry>>>,
    pub random_item: Mutex<Option<CheckMenuItem<Wry>>>,
}

impl Default for TrayState {
    fn default() -> Self {
        Self {
            current_song_item: Mutex::new(None),
            list_loop_item: Mutex::new(None),
            single_loop_item: Mutex::new(None),
            random_item: Mutex::new(None),
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();

    let db = Database::new().expect("Failed to initialize database");

    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.show();
                let _ = w.set_focus();
            }
        }))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(db)
        .manage(AppState::default())
        .manage(TrayState::default())
        .setup(|app| {
            let handles = tray::setup_tray(app)?;
            let tray_state = app.state::<TrayState>();
            
            if let Ok(mut item) = tray_state.current_song_item.lock() {
                *item = Some(handles.current_song);
            }
            if let Ok(mut item) = tray_state.list_loop_item.lock() {
                *item = Some(handles.list_loop);
            }
            if let Ok(mut item) = tray_state.single_loop_item.lock() {
                *item = Some(handles.single_loop);
            }
            if let Ok(mut item) = tray_state.random_item.lock() {
                *item = Some(handles.random);
            }
            
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                let app = window.app_handle();
                if let Some(db) = app.try_state::<Database>() {
                    if let Ok(config) = db.get_config() {
                        if config.minimize_to_tray {
                            let _ = window.hide();
                            api.prevent_close();
                        }
                    }
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            // Player commands
            get_player_state,
            set_playback_mode,
            set_volume,
            set_position,
            set_playing,
            set_current_song,
            set_duration,
            get_queue,
            set_queue,
            get_queue_index,
            set_queue_index,
            increment_play_count,
            // Library commands
            create_library,
            get_libraries,
            delete_library,
            rename_library,
            add_music_to_library,
            remove_music_from_library,
            get_library_songs,
            scan_directory,
            add_music_by_path,
            delete_music,
            // Cache commands
            get_cache_info,
            set_cache_limit,
            clear_cache,
            ensure_cache_space,
            add_to_cache_pool,
            remove_from_cache_pool,
            increment_cache_play_count,
            // Search commands
            search_music,
            get_all_songs,
            query_online_music,
            download_music,
            // System commands
            get_app_config,
            save_app_config,
            minimize_to_tray,
            show_window,
            update_tray_menu,
            update_tray_playback_mode,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
