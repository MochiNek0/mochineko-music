use tauri::State;
use crate::db::Database;
use crate::models::AppConfig;
use crate::TrayState;

#[tauri::command(rename_all = "snake_case")]
pub fn get_app_config(db: State<Database>) -> Result<AppConfig, String> {
    db.get_config().map_err(|e| e.to_string())
}

#[tauri::command(rename_all = "snake_case")]
pub fn save_app_config(config: AppConfig, db: State<Database>) -> Result<(), String> {
    db.save_config(&config).map_err(|e| e.to_string())
}

#[tauri::command(rename_all = "snake_case")]
pub fn minimize_to_tray(window: tauri::Window) -> Result<(), String> {
    window.hide().map_err(|e| e.to_string())
}

#[tauri::command(rename_all = "snake_case")]
pub fn show_window(window: tauri::Window) -> Result<(), String> {
    window.show().map_err(|e| e.to_string())?;
    window.set_focus().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub fn update_tray_menu(tray_state: State<TrayState>, title: String) -> Result<(), String> {
    if let Ok(item_lock) = tray_state.current_song_item.lock() {
        if let Some(menu_item) = &*item_lock {
            let _ = menu_item.set_text(title);
        }
    }
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub fn update_tray_playback_mode(tray_state: State<TrayState>, mode: String) -> Result<(), String> {
    if let Ok(list_lock) = tray_state.list_loop_item.lock() {
        if let Some(item) = &*list_lock {
            let _ = item.set_checked(mode == "ListLoop");
        }
    }
    if let Ok(single_lock) = tray_state.single_loop_item.lock() {
        if let Some(item) = &*single_lock {
            let _ = item.set_checked(mode == "SingleLoop");
        }
    }
    if let Ok(random_lock) = tray_state.random_item.lock() {
        if let Some(item) = &*random_lock {
            let _ = item.set_checked(mode == "Random");
        }
    }
    Ok(())
}
