from __future__ import annotations

import asyncio
import json
from collections import defaultdict
from typing import Any, DefaultDict, Set

from fastapi import WebSocket
from starlette.websockets import WebSocketDisconnect


class NotificationManager:
    """Manages websocket connections for in-app notifications."""

    def __init__(self) -> None:
        self._connections: DefaultDict[int, Set[WebSocket]] = defaultdict(set)
        self._loop: asyncio.AbstractEventLoop | None = None

    async def connect(self, user_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        if self._loop is None:
            self._loop = asyncio.get_running_loop()
        self._connections[user_id].add(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket) -> None:
        connections = self._connections.get(user_id)
        if not connections:
            return
        connections.discard(websocket)
        if not connections:
            self._connections.pop(user_id, None)

    def send_user_notification(self, *, user_id: int, payload: dict[str, Any]) -> None:
        if self._loop is None:
            return
        asyncio.run_coroutine_threadsafe(
            self._send_user_notification(user_id=user_id, payload=payload), self._loop
        )

    async def _send_user_notification(
        self, *, user_id: int, payload: dict[str, Any]
    ) -> None:
        if not self._connections.get(user_id):
            return

        message = json.dumps(payload)
        # Copy to avoid mutation while iterating.
        sockets = list(self._connections[user_id])
        for websocket in sockets:
            try:
                await websocket.send_text(message)
            except WebSocketDisconnect:
                self.disconnect(user_id, websocket)
            except RuntimeError:
                # Websocket is likely closed; remove it.
                self.disconnect(user_id, websocket)

    def broadcast(self, payload: dict[str, Any]) -> None:
        if self._loop is None:
            return
        asyncio.run_coroutine_threadsafe(self._broadcast(payload), self._loop)

    async def _broadcast(self, payload: dict[str, Any]) -> None:
        message = json.dumps(payload)
        for user_id, sockets in list(self._connections.items()):
            for websocket in list(sockets):
                try:
                    await websocket.send_text(message)
                except WebSocketDisconnect:
                    self.disconnect(user_id, websocket)
                except RuntimeError:
                    self.disconnect(user_id, websocket)
