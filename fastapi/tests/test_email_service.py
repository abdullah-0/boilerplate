from __future__ import annotations

from dataclasses import replace

from core.config import settings
from services.email import EmailService


class RecordingSMTP:
    created = False

    def __init__(self, host: str, port: int) -> None:
        RecordingSMTP.created = True

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        pass

    def starttls(self) -> None:
        pass

    def login(self, username: str, password: str) -> None:
        pass

    def sendmail(self, sender: str, recipients: list[str], message: str) -> None:
        pass


def test_skip_email_when_credentials_missing() -> None:
    RecordingSMTP.created = False
    service = EmailService(smtp_backend=RecordingSMTP)

    service.send_verification_email("user@example.com", "token123")

    assert RecordingSMTP.created is False


class CapturingSMTP:
    last_instance: "CapturingSMTP | None" = None

    def __init__(self, host: str, port: int) -> None:
        self.host = host
        self.port = port
        self.credentials: tuple[str, str] | None = None
        self.messages: list[tuple[str, list[str], str]] = []
        CapturingSMTP.last_instance = self

    def __enter__(self) -> "CapturingSMTP":
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        pass

    def starttls(self) -> None:
        pass

    def login(self, username: str, password: str) -> None:
        self.credentials = (username, password)

    def sendmail(self, sender: str, recipients: list[str], message: str) -> None:
        self.messages.append((sender, recipients, message))


def test_send_email_with_credentials() -> None:
    custom_settings = replace(
        settings,
        smtp_username="mailer@example.com",
        smtp_password="supersecret",
        from_email="Boilerplate <mailer@example.com>",
    )
    service = EmailService(smtp_backend=CapturingSMTP, settings_obj=custom_settings)

    service.send_password_reset_email("user@example.com", "resettoken")

    smtp_client = CapturingSMTP.last_instance
    assert smtp_client is not None
    assert smtp_client.credentials == ("mailer@example.com", "supersecret")
    assert smtp_client.messages, "Expected at least one email to be captured"
    sender, recipients, message = smtp_client.messages[0]
    assert sender == "Boilerplate <mailer@example.com>"
    assert recipients == ["user@example.com"]
    assert "/reset-password?token=resettoken" in message
