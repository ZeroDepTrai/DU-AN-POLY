pub mod proxy;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // rustls 0.23 requires us to pick a default crypto provider explicitly
    // when both ring and aws-lc-rs are pulled in transitively.
    let _ = rustls::crypto::ring::default_provider().install_default();

    // Start the local proxy on a dedicated thread BEFORE Tauri takes over.
    // The webview hits http://127.0.0.1:9876 for HTTP and ws://127.0.0.1:9877
    // for WebSocket; the proxy forwards both to Railway.
    std::thread::Builder::new()
        .name("cellzone-proxy".to_string())
        .spawn(|| {
            let rt = tokio::runtime::Builder::new_multi_thread()
                .enable_all()
                .build()
                .expect("proxy runtime");
            rt.block_on(async {
                proxy::start_async().await;
            });
        })
        .expect("failed to spawn proxy thread");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_title("CellZone - Quan ly cua hang dien thoai");
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
