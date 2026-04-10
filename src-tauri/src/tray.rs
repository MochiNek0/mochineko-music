use tauri::{
    menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, Runtime,
};

pub struct TrayMenuHandles<R: Runtime> {
    pub current_song: MenuItem<R>,
    pub list_loop: CheckMenuItem<R>,
    pub single_loop: CheckMenuItem<R>,
    pub random: CheckMenuItem<R>,
}

pub fn setup_tray<R: Runtime>(app: &tauri::App<R>) -> Result<TrayMenuHandles<R>, Box<dyn std::error::Error>> {
    let current_song = MenuItem::with_id(app, "current_song", "未在播放", false, None::<&str>)?;
    let sep0 = PredefinedMenuItem::separator(app)?;
    let play_pause = MenuItem::with_id(app, "play_pause", "播放/暂停", true, None::<&str>)?;
    let prev = MenuItem::with_id(app, "prev", "上一首", true, None::<&str>)?;
    let next = MenuItem::with_id(app, "next", "下一首", true, None::<&str>)?;
    let sep1 = PredefinedMenuItem::separator(app)?;
    let list_loop = CheckMenuItem::with_id(app, "list_loop", "列表循环", true, true, None::<&str>)?;
    let single_loop = CheckMenuItem::with_id(app, "single_loop", "单曲循环", true, false, None::<&str>)?;
    let random = CheckMenuItem::with_id(app, "random", "随机播放", true, false, None::<&str>)?;
    let sep2 = PredefinedMenuItem::separator(app)?;
    let show = MenuItem::with_id(app, "show", "显示主界面", true, None::<&str>)?;
    let sep3 = PredefinedMenuItem::separator(app)?;
    let quit = MenuItem::with_id(app, "quit", "退出应用", true, None::<&str>)?;

    let menu = Menu::with_items(
        app,
        &[
            &current_song,
            &sep0,
            &play_pause,
            &prev,
            &next,
            &sep1,
            &list_loop,
            &single_loop,
            &random,
            &sep2,
            &show,
            &sep3,
            &quit,
        ],
    )?;

    let _tray = TrayIconBuilder::with_id("main-tray")
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .tooltip("糯糯喵音")
        .on_menu_event(|app, event| match event.id.as_ref() {
            "play_pause" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.emit("tray-play-pause", ());
                }
            }
            "prev" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.emit("tray-prev", ());
                }
            }
            "next" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.emit("tray-next", ());
                }
            }
            "list_loop" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.emit("tray-mode", "ListLoop");
                }
            }
            "single_loop" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.emit("tray-mode", "SingleLoop");
                }
            }
            "random" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.emit("tray-mode", "Random");
                }
            }
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)?;

    Ok(TrayMenuHandles {
        current_song,
        list_loop,
        single_loop,
        random,
    })
}
