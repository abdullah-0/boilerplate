from __future__ import annotations

import json
from typing import Any
from urllib.parse import parse_qs

from channels.generic.websocket import AsyncJsonWebsocketConsumer
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken


class NotificationConsumer(AsyncJsonWebsocketConsumer):
    """Accepts websocket connections authenticated via JWT access tokens."""

    user_id: int | None = None

    @staticmethod
    def _parse_token(scope) -> str | None:
        query_string = scope.get("query_string", b"")
        if not query_string:
            return None
        params = parse_qs(query_string.decode("utf-8"))
        tokens = params.get("token")
        return tokens[0] if tokens else None

    async def connect(self) -> None:
        token = self._parse_token(self.scope)
        if not token:
            await self.close(code=4401)
            return

        try:
            access = AccessToken(token)
        except (TokenError, InvalidToken):
            await self.close(code=4401)
            return

        user_id_raw = access.get("user_id")
        if user_id_raw is None:
            await self.close(code=4401)
            return

        self.user_id = int(user_id_raw)
        await self.accept()

        if self.channel_layer is None:
            return

        await self.channel_layer.group_add(self._user_group_name, self.channel_name)
        await self.channel_layer.group_add("broadcast", self.channel_name)

    async def disconnect(self, code: int) -> None:
        if self.channel_layer is None or self.user_id is None:
            return
        await self.channel_layer.group_discard(self._user_group_name, self.channel_name)
        await self.channel_layer.group_discard("broadcast", self.channel_name)

    async def receive_json(self, content: Any, **kwargs: Any) -> None:  # noqa: ARG002
        # Accept heartbeats without action.
        event = content if isinstance(content, dict) else {}
        if event.get("type") == "ping":
            await self.send_json({"type": "pong"})

    @property
    def _user_group_name(self) -> str:
        assert self.user_id is not None
        return f"user_{self.user_id}"

    async def user_notification(self, event: dict[str, Any]) -> None:
        payload = event.get("payload", {})
        await self.send(text_data=json.dumps(payload))
