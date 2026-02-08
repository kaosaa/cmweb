// 桌面端入口：调用 lib.rs 中的 run() 启动 Tauri 应用

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    cm_lib::run();
}
