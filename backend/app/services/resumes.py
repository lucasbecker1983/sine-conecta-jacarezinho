import re
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile
from PyPDF2 import PdfReader

from app.core.config import get_settings


def safe_filename(filename: str) -> str:
    stem = Path(filename).stem[:80]
    cleaned = re.sub(r"[^A-Za-z0-9_.-]+", "-", stem).strip("-") or "curriculo"
    return f"{cleaned}-{uuid.uuid4().hex}.pdf"


async def save_pdf_resume(file: UploadFile, tenant_slug: str) -> tuple[str, Path, int]:
    settings = get_settings()
    if file.content_type not in {"application/pdf", "application/x-pdf"} or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Somente arquivos PDF sao permitidos")
    upload_root = settings.upload_dir / "resumes" / tenant_slug
    upload_root.mkdir(parents=True, exist_ok=True)
    stored = safe_filename(file.filename)
    path = upload_root / stored
    max_size = settings.max_resume_size_mb * 1024 * 1024
    size = 0
    with path.open("wb") as out:
        while chunk := await file.read(1024 * 1024):
            size += len(chunk)
            if size > max_size:
                path.unlink(missing_ok=True)
                raise HTTPException(status_code=413, detail="Curriculo excede o tamanho permitido")
            out.write(chunk)
    return stored, path, size


def extract_pdf_text(path: Path) -> str:
    reader = PdfReader(str(path))
    return "\n".join(page.extract_text() or "" for page in reader.pages).strip()
