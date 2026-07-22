use std::convert::Infallible;
use std::net::SocketAddr;
use std::sync::Arc;

use bytes::Bytes;
use futures_util::{SinkExt, StreamExt};
use http_body_util::{BodyExt, Full};
use hyper::body::Incoming;
use hyper::server::conn::http1;
use hyper::service::service_fn;
use hyper::{Method, Request, Response, StatusCode};
use hyper_util::rt::TokioIo;
use tokio::net::TcpListener;
use tokio::net::TcpStream;
use tokio_rustls::rustls::{ClientConfig, RootCertStore};
use tokio_rustls::TlsConnector;
use tokio_tungstenite::client_async;
use tokio_tungstenite::MaybeTlsStream;

const PROXY_HOST: &str = "127.0.0.1";
pub const PROXY_HTTP_PORT: u16 = 9876;
pub const PROXY_WS_PORT: u16 = 9877;
const UPSTREAM_HOST: &str = "du-an-poly-production.up.railway.app";
const UPSTREAM_HTTP: &str = "https://du-an-poly-production.up.railway.app";
const UPSTREAM_WS: &str = "wss://du-an-poly-production.up.railway.app";

// Body type alias matching what `hyper::client::conn::http1::send_request`
// expects. We map collected bytes into a Full<Bytes>.
type RespBody = http_body_util::combinators::BoxBody<Bytes, hyper::Error>;

fn full<T: Into<Bytes>>(chunk: T) -> RespBody {
    Full::<Bytes>::new(chunk.into())
        .map_err(|never| match never {})
        .boxed()
}

fn cors_response(status: StatusCode, body: &'static str) -> Response<RespBody> {
    Response::builder()
        .status(status)
        .header("Access-Control-Allow-Origin", "*")
        .header(
            "Access-Control-Allow-Methods",
            "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        )
        .header(
            "Access-Control-Allow-Headers",
            "Authorization, Content-Type, Accept",
        )
        .header("Access-Control-Max-Age", "86400")
        .header("Content-Type", "text/plain; charset=utf-8")
        .body(full(body))
        .unwrap()
}

fn build_upstream_uri(req: &Request<Incoming>) -> http::Uri {
    let path_and_query = req
        .uri()
        .path_and_query()
        .map(|p| p.as_str().to_string())
        .unwrap_or_else(|| "/".to_string());
    format!("{}{}", UPSTREAM_HTTP, path_and_query)
        .parse()
        .expect("invalid upstream uri")
}

fn tls_config() -> Arc<ClientConfig> {
    let mut root_store = RootCertStore::empty();
    root_store.extend(webpki_roots::TLS_SERVER_ROOTS.iter().cloned());
    Arc::new(
        ClientConfig::builder()
            .with_root_certificates(root_store)
            .with_no_client_auth(),
    )
}

async fn handle_http_request(
    mut req: Request<Incoming>,
    tls: Arc<ClientConfig>,
) -> Result<Response<RespBody>, Infallible> {
    if req.method() == Method::OPTIONS {
        return Ok(cors_response(StatusCode::NO_CONTENT, ""));
    }

    let method = req.method().clone();
    let uri = build_upstream_uri(&req);

    let mut upstream_req = Request::builder().method(method).uri(uri);
    {
        let headers = upstream_req.headers_mut().unwrap();
        for (name, value) in req.headers().iter() {
            if name.as_str().eq_ignore_ascii_case("host")
                || name.as_str().eq_ignore_ascii_case("connection")
                || name.as_str().eq_ignore_ascii_case("content-length")
            {
                continue;
            }
            headers.append(name, value.clone());
        }
        headers.insert("host", UPSTREAM_HOST.parse().unwrap());
    }
    let body = req
        .body_mut()
        .collect()
        .await
        .unwrap_or_default()
        .to_bytes();
    let upstream_req = upstream_req.body(full(body)).unwrap();

    let tcp = match TcpStream::connect((UPSTREAM_HOST, 443)).await {
        Ok(t) => t,
        Err(e) => {
            eprintln!("[proxy] HTTP connect error: {}", e);
            return Ok(Response::builder()
                .status(StatusCode::BAD_GATEWAY)
                .header("Access-Control-Allow-Origin", "*")
                .body(full(format!("upstream connect error: {}", e)))
                .unwrap());
        }
    };
    let server_name = UPSTREAM_HOST.to_string();
    let connector = TlsConnector::from(tls.clone());
    let tls_stream = match connector.connect(server_name.try_into().unwrap(), tcp).await {
        Ok(s) => s,
        Err(e) => {
            eprintln!("[proxy] HTTP TLS error: {}", e);
            return Ok(Response::builder()
                .status(StatusCode::BAD_GATEWAY)
                .header("Access-Control-Allow-Origin", "*")
                .body(full(format!("upstream TLS error: {}", e)))
                .unwrap());
        }
    };
    let io = TokioIo::new(tls_stream);
    let (mut sender, conn) = match hyper::client::conn::http1::handshake(io).await {
        Ok(v) => v,
        Err(e) => {
            eprintln!("[proxy] HTTP handshake error: {}", e);
            return Ok(Response::builder()
                .status(StatusCode::BAD_GATEWAY)
                .header("Access-Control-Allow-Origin", "*")
                .body(full(format!("upstream handshake error: {}", e)))
                .unwrap());
        }
    };
    tokio::spawn(async move {
        if let Err(e) = conn.await {
            eprintln!("[proxy] upstream conn error: {}", e);
        }
    });

    let resp = match sender.send_request(upstream_req).await {
        Ok(r) => r,
        Err(e) => {
            eprintln!("[proxy] send error: {}", e);
            return Ok(Response::builder()
                .status(StatusCode::BAD_GATEWAY)
                .header("Access-Control-Allow-Origin", "*")
                .body(full(format!("upstream send error: {}", e)))
                .unwrap());
        }
    };
    let (parts, body) = resp.into_parts();
    let collected = body.collect().await.unwrap_or_default().to_bytes();
    let mut response = Response::builder().status(parts.status);
    for (name, value) in parts.headers.iter() {
        if name.as_str().eq_ignore_ascii_case("transfer-encoding")
            || name.as_str().eq_ignore_ascii_case("content-length")
            || name.as_str().eq_ignore_ascii_case("connection")
        {
            continue;
        }
        response = response.header(name, value);
    }
    response = response.header("Access-Control-Allow-Origin", "*");
    Ok(response.body(full(collected)).unwrap())
}

async fn handle_raw_ws_client(client: TcpStream, tls: Arc<ClientConfig>) {
    // `tokio_tungstenite::accept_async` requires a stream that implements
    // `tokio::io::{AsyncRead, AsyncWrite}` + Unpin, so we pass the raw
    // `TcpStream` directly (not wrapped in `TokioIo`, whose traits are the
    // hyper-`rt` variants and don't satisfy tungstenite's bounds).
    let peer = client
        .peer_addr()
        .ok()
        .map(|a| a.to_string())
        .unwrap_or_else(|| "?".into());

    // We use `accept_hdr_async` so we can peek at the inbound request headers
    // — needed to forward `Authorization` and the original path to the
    // upstream WS server.
    let captured: Arc<std::sync::Mutex<Option<(String, Option<String>, Option<String>)>>> =
        Arc::new(std::sync::Mutex::new(None));
    let captured_for_cb = captured.clone();
    let cb = move |req: &hyper::Request<()>,
                   response: hyper::Response<()>| {
        let path = req
            .uri()
            .path_and_query()
            .map(|p| p.as_str().to_string())
            .unwrap_or_else(|| "/ws/chat".to_string());
        let auth = req
            .headers()
            .get("Authorization")
            .and_then(|v| v.to_str().ok())
            .map(|s| s.to_string());
        let origin = req
            .headers()
            .get("Origin")
            .and_then(|v| v.to_str().ok())
            .map(|s| s.to_string());
        *captured_for_cb.lock().unwrap() = Some((path, auth, origin));
        Ok::<_, tungstenite::handshake::server::ErrorResponse>(response)
    };
    let client_ws = match tokio_tungstenite::accept_hdr_async(client, cb).await {
        Ok(v) => v,
        Err(e) => {
            eprintln!("[proxy-ws] client accept error ({}): {}", peer, e);
            return;
        }
    };
    eprintln!("[proxy-ws] client handshake OK from {}", peer);

    let (original_path, original_auth, original_origin) = {
        let g = captured.lock().unwrap();
        g.clone()
            .unwrap_or_else(|| ("/ws/chat".to_string(), None, None))
    };
    let upstream_uri = format!("{}{}", UPSTREAM_WS, original_path);

    let tcp = match TcpStream::connect((UPSTREAM_HOST, 443)).await {
        Ok(t) => t,
        Err(e) => {
            eprintln!("[proxy-ws] upstream connect: {}", e);
            return;
        }
    };
    let server_name = UPSTREAM_HOST.to_string();
    let connector = TlsConnector::from(tls);
    let tls_stream = match connector.connect(server_name.try_into().unwrap(), tcp).await {
        Ok(s) => s,
        Err(e) => {
            eprintln!("[proxy-ws] upstream TLS: {}", e);
            return;
        }
    };
    let maybe_tls = MaybeTlsStream::Rustls(tls_stream);

    let mut req_builder = Request::builder()
        .method("GET")
        .uri(&upstream_uri)
        .header("Host", UPSTREAM_HOST);
    // NOTE: do NOT set Upgrade / Connection / Sec-WebSocket-Key /
    // Sec-WebSocket-Version manually. `client_async` below builds the
    // 101 Switching-Protocols request itself and overrides these headers;
    // setting a hardcoded Sec-WebSocket-Key used to silently mis-handshake
    // against the upstream's hash check, which is why messages never
    // reached the agent. Just forward Authorization and Origin and let
    // tungstenite handle the rest.
    if let Some(t) = original_auth {
        req_builder = req_builder.header("Authorization", t);
    }
    if let Some(o) = original_origin {
        req_builder = req_builder.header("Origin", o);
    }
    let req = req_builder.body(()).unwrap();

    let (upstream_ws, _resp) = match client_async(req, maybe_tls).await {
        Ok(v) => v,
        Err(e) => {
            eprintln!("[proxy-ws] upstream handshake: {}", e);
            return;
        }
    };
    eprintln!("[proxy-ws] upstream handshake OK");

    // Bidirectional relay. The `c2u` leg reads from the browser-typed
    // `WebSocket` and forwards every frame to the upstream. The `u2c` leg
    // reads from the upstream `WebSocket` and forwards every frame to the
    // browser. Both legs use tungstenite's `Message` so framing is handled by
    // the library — no manual byte splicing.
    //
    // Split both streams so each async task owns a single half; otherwise the
    // compiler refuses two simultaneous mutable borrows of the same
    // `WebSocketStream`.
    let (mut c_write, mut c_read) = client_ws.split();
    let (mut u_write, mut u_read) = upstream_ws.split();

    let c2u = async {
        while let Some(msg) = c_read.next().await {
            match msg {
                Ok(m) => {
                    if u_write.send(m).await.is_err() {
                        break;
                    }
                }
                Err(_) => break,
            }
        }
    };

    let u2c = async {
        while let Some(msg) = u_read.next().await {
            match msg {
                Ok(m) => {
                    if c_write.send(m).await.is_err() {
                        break;
                    }
                }
                Err(_) => break,
            }
        }
    };

    tokio::select! {
        _ = c2u => {},
        _ = u2c => {},
    }
    eprintln!("[proxy-ws] relay ended");
}

pub async fn start_async() {
    let tls = tls_config();

    let http_addr: SocketAddr = format!("{}:{}", PROXY_HOST, PROXY_HTTP_PORT)
        .parse()
        .unwrap();
    let http_listener = match TcpListener::bind(http_addr).await {
        Ok(l) => l,
        Err(e) => {
            eprintln!("[proxy] failed to bind {}: {}", http_addr, e);
            return;
        }
    };
    eprintln!("[proxy] HTTP listening on http://{}", http_addr);

    let ws_addr: SocketAddr = format!("{}:{}", PROXY_HOST, PROXY_WS_PORT)
        .parse()
        .unwrap();
    let ws_listener = match TcpListener::bind(ws_addr).await {
        Ok(l) => l,
        Err(e) => {
            eprintln!("[proxy] failed to bind {}: {}", ws_addr, e);
            return;
        }
    };
    eprintln!("[proxy] WS listening on http://{}", ws_addr);

    loop {
        tokio::select! {
            res = http_listener.accept() => {
                match res {
                    Ok((stream, _)) => {
                        let tls = tls.clone();
                        tokio::spawn(async move {
                            let io = TokioIo::new(stream);
                            let svc = service_fn(move |req| {
                                let tls = tls.clone();
                                async move { handle_http_request(req, tls).await }
                            });
                            if let Err(e) = http1::Builder::new().serve_connection(io, svc).await {
                                eprintln!("[proxy] connection error: {}", e);
                            }
                        });
                    }
                    Err(e) => eprintln!("[proxy] accept error: {}", e),
                }
            }
            res = ws_listener.accept() => {
                match res {
                    Ok((stream, _)) => {
                        let tls = tls.clone();
                        tokio::spawn(async move {
                            handle_raw_ws_client(stream, tls).await;
                        });
                    }
                    Err(e) => eprintln!("[proxy-ws] accept error: {}", e),
                }
            }
        }
    }
}
