import io
import base64
import qrcode
from qrcode.image.pil import PilImage
from backend.app.config import settings

def generate_report_qr_bytes(report_id: str, base_url: str = "") -> bytes:
    """
    Generates a high-contrast PNG QR code directing to the stable report URL.
    """
    url_base = (base_url or settings.PUBLIC_BASE_URL).rstrip("/")
    target_url = f"{url_base}/#report-{report_id}"

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=3,
    )
    qr.add_data(target_url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="#1b5e20", back_color="#ffffff")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

def generate_report_qr_data_url(report_id: str, base_url: str = "") -> str:
    """
    Returns base64 data URL string for inline HTML rendering.
    """
    qr_bytes = generate_report_qr_bytes(report_id, base_url)
    encoded = base64.b64encode(qr_bytes).decode("ascii")
    return f"data:image/png;base64,{encoded}"
