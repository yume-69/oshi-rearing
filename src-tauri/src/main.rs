// Windows のリリースビルドで黒いコンソール窓を出さない
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager,
};

/// クリック透過中かどうか
static CLICK_THROUGH: AtomicBool = AtomicBool::new(false);

/// セーブファイルの場所（%APPDATA%\dev.example.mypet\pet.json）
fn state_path(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("pet.json"))
}

#[tauri::command]
fn load_state(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let path = state_path(&app)?;
    if !path.exists() {
        return Ok(None);
    }
    std::fs::read_to_string(path)
        .map(Some)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn save_state(app: tauri::AppHandle, data: String) -> Result<(), String> {
    let path = state_path(&app)?;
    std::fs::write(path, data).map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![load_state, save_state])
        .setup(|app| {
            // ── タスクトレイのメニュー ──
            let toggle = MenuItem::with_id(app, "toggle", "クリックを透過する", true, None::<&str>)?;
            let front = MenuItem::with_id(app, "front", "最前面に戻す", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "終了", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&toggle, &front, &quit])?;

            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("MyPet")
                // ビルドが通らない場合は .menu_on_left_click(true) に置き換える
                .show_menu_on_left_click(true)
                .menu(&menu)
                .on_menu_event(|app, event| {
                    let win = app.get_webview_window("main");
                    match event.id.as_ref() {
                        "quit" => app.exit(0),
                        "toggle" => {
                            if let Some(w) = win {
                                let next = !CLICK_THROUGH.load(Ordering::Relaxed);
                                let _ = w.set_ignore_cursor_events(next);
                                CLICK_THROUGH.store(next, Ordering::Relaxed);
                            }
                        }
                        "front" => {
                            if let Some(w) = win {
                                let _ = w.set_always_on_top(true);
                                let _ = w.show();
                            }
                        }
                        _ => {}
                    }
                })
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Tauri アプリの起動に失敗しました");
}
