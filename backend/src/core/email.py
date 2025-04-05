from typing import Any

from fastapi import BackgroundTasks

# from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from pydantic import EmailStr

from .config import config


def send_email(
    background_tasks: BackgroundTasks,
    email_to: EmailStr,
    subject: str = "",
    template_name: str = "",
    template_body: dict[str, Any] = {},  # noqa: B006
) -> None:
    if not config.EMAIL_ENABLED:
        return

    # conf = ConnectionConfig(
    #     MAIL_USERNAME=cast(str, settings.EMAIL_USER),
    #     MAIL_PASSWORD=cast(str, settings.EMAIL_PASSWORD),
    #     MAIL_FROM=cast(str, settings.EMAILS_FROM_EMAIL),
    #     MAIL_FROM_NAME=cast(str, settings.EMAILS_FROM_NAME),
    #     MAIL_PORT=cast(int, settings.EMAIL_PORT),
    #     MAIL_SERVER=cast(str, settings.EMAIL_HOST),
    #     MAIL_STARTTLS=cast(bool, settings.EMAIL_TLS),
    #     MAIL_SSL_TLS=False,
    #     USE_CREDENTIALS=True,
    #     TEMPLATE_FOLDER=Path(settings.EMAIL_TEMPLATES_DIR),
    # )

    # message = MessageSchema(
    #     subject=subject, recipients=[email_to], template_body=template_body, subtype=MessageType.html
    # )

    # fm = FastMail(conf)
    # background_tasks.add_task(fm.send_message, message, template_name=template_name)


def send_new_account_email(
    background_tasks: BackgroundTasks, email_to: str, username: str
) -> None:
    project_name = config.PROJECT_NAME
    subject = f"{project_name} - New account for user {username}"
    link = config.BACKEND_BASE_URL
    send_email(
        background_tasks,
        email_to=email_to,
        subject=subject,
        template_name="new_account.html",
        template_body={
            "project_name": project_name,
            "username": username,
            "email": email_to,
            "link": link,
        },
    )


def send_reset_password_email(
    background_tasks: BackgroundTasks, email_to: str, token: str
) -> None:
    project_name = config.PROJECT_NAME
    subject = f"{project_name} - Password recovery for user {email_to}"
    server_host = config.STAKE_FRONT_BASE_URL
    link = f"{server_host}/reset-password?token={token}"
    send_email(
        background_tasks,
        email_to=email_to,
        subject=subject,
        template_name="reset_password.html",
        template_body={
            "project_name": project_name,
            "email": email_to,
            "valid_minutes": config.EMAIL_RESET_TOKEN_EXPIRE_MINUTES,
            "link": link,
        },
    )
