from collections import defaultdict

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: dict[str, list[WebSocket]] = defaultdict(list)

    async def connect(self, tracking_code: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections[tracking_code].append(websocket)

    def disconnect(self, tracking_code: str, websocket: WebSocket) -> None:
        connections = self.active_connections.get(tracking_code, [])
        if websocket in connections:
            connections.remove(websocket)
        if not connections and tracking_code in self.active_connections:
            del self.active_connections[tracking_code]

    async def broadcast(self, tracking_code: str, message: dict) -> None:
        dead: list[WebSocket] = []
        for connection in self.active_connections.get(tracking_code, []):
            try:
                await connection.send_json(message)
            except Exception:
                dead.append(connection)
        for connection in dead:
            self.disconnect(tracking_code, connection)


manager = ConnectionManager()
