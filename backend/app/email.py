import resend

from app.config import settings


def send_verification_email(to_email: str, code: str) -> bool:
    if not settings.resend_api_key:
        return False
    try:
        resend.api_key = settings.resend_api_key
        resend.Emails.send(
            {
                "from": settings.email_from,
                "to": to_email,
                "subject": "Mã xác minh đăng ký - Phone Store",
                "html": f"""
                    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px;">
                        <h2 style="color: #dc2626; margin-bottom: 24px;">Xác minh email của bạn</h2>
                        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                            Cảm ơn bạn đã đăng ký tại Phone Store. Vui lòng nhập mã xác minh bên dưới để hoàn tất đăng ký:
                        </p>
                        <div style="background: #f3f4f6; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111827;">{code}</span>
                        </div>
                        <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                            Mã có hiệu lực trong <strong>10 phút</strong>. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.
                        </p>
                    </div>
                """,
            }
        )
        return True
    except Exception:
        return False


def send_order_notification(to_email: str, order_id: int, tracking_code: str, customer_name: str, address: str, phone: str, items_summary: str) -> bool:
    if not settings.resend_api_key:
        return False
    try:
        resend.api_key = settings.resend_api_key
        resend.Emails.send(
            {
                "from": settings.email_from,
                "to": to_email,
                "subject": f"[Phone Store] Đơn hàng mới - #{order_id} ({tracking_code})",
                "html": f"""
                    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px;">
                        <h2 style="color: #111827; margin-bottom: 8px;">Đơn hàng mới</h2>
                        <p style="color: #6b7280; font-size: 14px; margin-bottom: 24px;">Order #{order_id} &bull; {tracking_code}</p>

                        <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                            <h3 style="color: #374151; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px;">Thông tin khách hàng</h3>
                            <p style="color: #111827; margin: 4px 0;"><strong>{customer_name}</strong></p>
                            <p style="color: #6b7280; margin: 4px 0;">{phone}</p>
                            <p style="color: #6b7280; margin: 4px 0;">{address}</p>
                        </div>

                        <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                            <h3 style="color: #374151; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px;">Sản phẩm đã đặt</h3>
                            {items_summary}
                        </div>
                    </div>
                """,
            }
        )
        return True
    except Exception:
        return False


def send_order_notification_to_admins(admins: list[str], order_id: int, tracking_code: str, customer_name: str, address: str, phone: str, items_summary: str) -> None:
    for admin_email in admins:
        send_order_notification(admin_email, order_id, tracking_code, customer_name, address, phone, items_summary)
