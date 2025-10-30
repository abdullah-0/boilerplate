from __future__ import annotations

from typing import Any, Mapping

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


class NotificationManager:
    """Dispatches websocket notifications to connected clients."""

    _broadcast_group = "broadcast"

    def __init__(self) -> None:
        self._layer = None

    def _group_name(self, user_id: int) -> str:
        return f"user_{user_id}"

    def _get_layer(self):
        if self._layer is None:
            self._layer = get_channel_layer()
        return self._layer

    def send_user_notification(self, *, user_id: int, payload: Mapping[str, Any]) -> None:
        """Send a notification to a single user if a channel layer is configured."""
        channel_layer = self._get_layer()
        if channel_layer is None:
            return
        async_to_sync(channel_layer.group_send)(
            self._group_name(user_id=user_id),
            {"type": "user.notification", "payload": dict(payload)},
        )

    def broadcast(self, payload: Mapping[str, Any]) -> None:
        """Send a notification to all connected clients."""
        channel_layer = self._get_layer()
        if channel_layer is None:
            return
        async_to_sync(channel_layer.group_send)(
            self._broadcast_group,
            {"type": "user.notification", "payload": dict(payload)},
        )


notifier = NotificationManager()
