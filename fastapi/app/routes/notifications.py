from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, WebSocket
from starlette.websockets import WebSocketDisconnect

from app.notifications import notifier
from app.services import UserService, get_user_service

router = APIRouter()


@router.websocket("/ws/notifications")
async def notifications_socket(
    websocket: WebSocket,
    token: str,
    user_service: UserService = Depends(get_user_service),
) -> None:
    try:
        payload = user_service.decode_access_token(token)
        user_id = int(payload["sub"])
    except (ValueError, KeyError, HTTPException):
        await websocket.close(code=1008)
        return

    await notifier.connect(user_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        notifier.disconnect(user_id, websocket)
