/// Tauri 应用入口模块
///
/// 初始化 Tauri 运行时，注册所需插件（自动更新、Shell、Process），
/// 然后启动主窗口。

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
