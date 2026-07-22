import logging
import os
import httpx

ETHEREAL_API = "https://api.nodemailer.com/user"


def _print_email(to: str, subject: str, body: str):
    print()
    print("=" * 60)
    print("            📧 EMAIL NOTIFICATION")
    print("=" * 60)
    print(f"  To      : {to}")
    print(f"  Subject : {subject}")
    print("=" * 60)
    print(body)
    print("=" * 60)
    print()


async def send_email(to: str, subject: str, body: str):
    _print_email(to, subject, body)

    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")

    from email.message import EmailMessage
    import aiosmtplib

    msg = EmailMessage()
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)

    try:
        if smtp_host and smtp_user and smtp_pass:
            # Use Real SMTP Server
            msg["From"] = f"Kortex <{smtp_user}>"
            await aiosmtplib.send(
                msg,
                hostname=smtp_host,
                port=smtp_port,
                username=smtp_user,
                password=smtp_pass,
                start_tls=True if smtp_port == 587 else False,
                use_tls=True if smtp_port == 465 else False,
            )
            logging.info(f"Email successfully delivered to {to} via {smtp_host}")
        else:
            logging.warning("SMTP credentials not found in .env! Falling back to Ethereal fake SMTP. Real emails will NOT be delivered!")
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    ETHEREAL_API,
                    json={"requestor": "Kortex", "version": "1.0"},
                    timeout=10.0,
                )
                resp.raise_for_status()
                account = resp.json()

            msg["From"] = f"Kortex <{account['user']}>"
            await aiosmtplib.send(
                msg,
                hostname=account["smtp"]["host"],
                port=account["smtp"]["port"],
                username=account["user"],
                password=account["pass"],
                start_tls=True,
            )
            logging.info(f"Ethereal fake email successfully trapped. Login at ethereal.email with {account['user']}")
    except Exception as e:
        logging.error(f"Failed to send email: {e}")


async def send_welcome_email(to_email: str, name: str):
    subject = "Welcome to Kortex!"
    body = f"""Hi {name},

Congratulations! You have successfully created your account with Kortex.

You can now start chatting with AI models, save your conversations, and track your usage.

Get started by asking a question or picking a model from the dropdown.

Best,
The Kortex Team"""
    await send_email(to_email, subject, body)


async def send_otp_email(to_email: str, name: str, otp: str):
    subject = "Requesting for update a new password"
    body = f"""Dear {name},

We have received a request to update the password for your Kortex account.

Your One-Time Password (OTP) is: {otp}

This OTP is valid for 10 minutes. Please use it to reset your password.

If you did not request this password change, please ignore this email.

Best regards,
The Kortex Team"""
    await send_email(to_email, subject, body)
