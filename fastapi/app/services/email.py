from __future__ import annotations

import logging
import smtplib
from email.mime.text import MIMEText
from functools import lru_cache
from pathlib import Path
from string import Template
from typing import Mapping

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    def __init__(
        self,
        *,
        template_dir: Path | None = None,
        smtp_backend: type[smtplib.SMTP] = smtplib.SMTP,
        settings_obj=None,
    ) -> None:
        self._settings = settings_obj or settings
        self._smtp_backend = smtp_backend
        self._template_dir = (
            template_dir or Path(__file__).resolve().parents[1] / "templates" / "email"
        )
        self._template_dir.mkdir(parents=True, exist_ok=True)

    def send_verification_email(self, recipient: str, token: str) -> None:
        link = f"{self._settings.app_url.rstrip('/')}/verify-email?token={token}"
        body = self._render("verify_email.html", {"verification_link": link})
        self._dispatch("Verify your account", recipient, body)

    def send_password_reset_email(self, recipient: str, token: str) -> None:
        link = f"{self._settings.app_url.rstrip('/')}/reset-password?token={token}"
        body = self._render("password_reset.html", {"reset_link": link})
        self._dispatch("Reset your password", recipient, body)

    def _dispatch(self, subject: str, recipient: str, body: str) -> None:
        username = self._settings.smtp_username
        password = self._settings.smtp_password
        if not username or not password:
            logger.info("Skipping email send; SMTP credentials are not configured.")
            logger.debug(
                "Email subject=%s recipient=%s body=%s", subject, recipient, body
            )
            return

        message = MIMEText(body, "html")
        message["Subject"] = subject
        message["From"] = self._settings.from_email or username
        message["To"] = recipient

        try:
            with self._smtp_backend(
                self._settings.smtp_server, self._settings.smtp_port
            ) as server:
                server.starttls()
                server.login(username, password)
                server.sendmail(message["From"], [recipient], message.as_string())
        except Exception as exc:  # noqa: BLE001
            logger.exception("Email delivery failed: %s", exc)

    def _render(self, template_name: str, context: Mapping[str, str]) -> str:
        template_path = self._template_dir / template_name
        if not template_path.exists():
            raise FileNotFoundError(
                f"Template '{template_name}' not found in {self._template_dir}"
            )
        template = Template(template_path.read_text(encoding="utf-8"))
        return template.substitute(context)


@lru_cache(maxsize=1)
def get_email_service() -> EmailService:
    return EmailService()
