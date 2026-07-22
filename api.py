import secrets
from pathlib import Path

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from auth_core import authenticate_user, find_recovery_account, register_user
from admin_core import (
    CATEGORIES,
    create_backup,
    delete_book,
    get_admin_stats,
    get_analytics_dashboard,
    get_registry,
    restore_backup,
    rebuild_faiss_index,
    record_question,
    register_upload,
    update_book_category,
)
from rag_core import get_answer_with_metadata, get_book_options, get_index_stats, load_knowledge_base, reset_knowledge_base

# Set offline mode for HuggingFace (optional - comment out if you want to download models on first run)
# os.environ["TRANSFORMERS_OFFLINE"] = "1"
# os.environ["HF_DATASETS_OFFLINE"] = "1"

app = FastAPI(title="Nritya.ai API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QuestionRequest(BaseModel):
    question: str
    book_filter: str = "all"

class AnswerResponse(BaseModel):
    answer: str
    sources: list[dict] = []
    retrieval: dict = {}

class LoginRequest(BaseModel):
    username: str
    password: str

class StudentProfileRequest(BaseModel):
    exam_level: str = ""
    exam_board: str = ""
    expected_exam_date: str = ""
    years_training: str = ""

class RegistrationRequest(BaseModel):
    full_name: str
    email: str
    username: str
    password: str
    confirm_password: str
    role: str
    student_profile: StudentProfileRequest | None = None

class ForgotPasswordRequest(BaseModel):
    identifier: str

class CategoryRequest(BaseModel):
    category: str

ACTIVE_TOKENS: dict[str, dict] = {}
ROLE_LEVELS = {"student": 1, "teacher": 2, "admin": 3}


def require_role(min_role: str):
    def dependency(authorization: str = Header(default="")):
        if not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Authentication required")
        token = authorization.removeprefix("Bearer ").strip()
        session = ACTIVE_TOKENS.get(token)
        if not session:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        if ROLE_LEVELS[session["role"]] < ROLE_LEVELS[min_role]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return session
    return dependency

@app.on_event("startup")
async def startup_event():
    """Keep startup lightweight; RAG models load on the first question."""
    return None

@app.post("/ask", response_model=AnswerResponse)
async def ask_question(request: QuestionRequest):
    """Handle question and return answer"""
    if not request.question or not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    
    try:
        result = get_answer_with_metadata(request.question, request.book_filter)
        record_question(request.question, result.get("retrieval", {}))
        return AnswerResponse(**result)
    
    except Exception as e:
        import traceback
        error_detail = f"{str(e)}\n\nTraceback:\n{traceback.format_exc()}"
        print(f"Error in ask_question: {error_detail}")
        raise HTTPException(status_code=500, detail=f"Error processing question: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}

@app.get("/stats")
async def stats():
    """Index statistics for the knowledge dashboard."""
    return get_index_stats()

@app.get("/books")
async def books():
    """Book filter options used by the frontend."""
    return {"books": get_book_options()}

@app.post("/admin/login")
async def admin_login(request: LoginRequest):
    user = authenticate_user(request.username, request.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = secrets.token_urlsafe(24)
    ACTIVE_TOKENS[token] = {
        "username": user["username"],
        "role": user["role"],
        "full_name": user.get("full_name", ""),
    }
    return {
        "token": token,
        "role": user["role"],
        "username": user["username"],
        "full_name": user.get("full_name", ""),
        "student_profile": user.get("student_profile", {}),
    }

@app.post("/admin/register")
async def admin_register(request: RegistrationRequest):
    if request.password != request.confirm_password:
        raise HTTPException(status_code=400, detail="Password and confirm password must match.")
    try:
        student_profile = {}
        if request.student_profile:
            student_profile = (
                request.student_profile.model_dump()
                if hasattr(request.student_profile, "model_dump")
                else request.student_profile.dict()
            )
        user = register_user(
            {
                "full_name": request.full_name,
                "email": request.email,
                "username": request.username,
                "password": request.password,
                "role": request.role,
                "student_profile": student_profile,
            }
        )
        return {"status": "registered", "user": user}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

@app.post("/admin/forgot-password")
async def admin_forgot_password(request: ForgotPasswordRequest):
    account = find_recovery_account(request.identifier)
    if not account:
        raise HTTPException(status_code=404, detail="No account found for that username or email.")
    return {
        "status": "recovery_started",
        "message": "Password recovery is available in offline demo mode. Ask an administrator to reset this account.",
        "account": {
            "username": account["username"],
            "email": account["email"],
            "role": account["role"],
        },
    }

@app.get("/admin/summary")
async def admin_summary(_session=Depends(require_role("teacher"))):
    return get_admin_stats()

@app.get("/admin/books")
async def admin_books(_session=Depends(require_role("teacher"))):
    return {"books": get_registry(), "categories": CATEGORIES}

@app.post("/admin/upload")
async def admin_upload(
    file: UploadFile = File(...),
    category: str = Form("General Theory"),
    _session=Depends(require_role("teacher")),
):
    try:
        content = await file.read()
        book = register_upload(file.filename or "upload.pdf", content, category)
        stats = rebuild_faiss_index()
        reset_knowledge_base()
        return {"book": book, "stats": stats}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

@app.post("/admin/books/{book_id}/category")
async def admin_update_category(book_id: str, request: CategoryRequest, _session=Depends(require_role("admin"))):
    try:
        return update_book_category(book_id, request.category)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

@app.post("/admin/books/{book_id}/reindex")
async def admin_reindex_book(book_id: str, _session=Depends(require_role("admin"))):
    # Rebuilds the whole local FAISS index so vector ids and metadata remain consistent.
    if not any(item["id"] == book_id for item in get_registry()):
        raise HTTPException(status_code=404, detail="Book not found")
    try:
        stats = rebuild_faiss_index()
        reset_knowledge_base()
        return stats
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

@app.get("/admin/books/{book_id}/view")
async def admin_view_book(book_id: str, _session=Depends(require_role("teacher"))):
    book = next((item for item in get_registry() if item["id"] == book_id), None)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    path = Path("books") / book["filename"]
    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path=path, filename=book["filename"])

@app.delete("/admin/books/{book_id}")
async def admin_delete_book(book_id: str, _session=Depends(require_role("admin"))):
    try:
        delete_book(book_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    try:
        stats = rebuild_faiss_index()
        reset_knowledge_base()
    except Exception:
        stats = get_index_stats()
    return {"status": "deleted", "stats": stats}

@app.get("/admin/analytics")
async def admin_analytics(_session=Depends(require_role("teacher"))):
    return get_analytics_dashboard()

@app.post("/admin/reindex")
async def admin_reindex(_session=Depends(require_role("admin"))):
    try:
        stats = rebuild_faiss_index()
        reset_knowledge_base()
        return stats
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

@app.post("/admin/backup")
async def admin_backup(_session=Depends(require_role("admin"))):
    archive = create_backup()
    return {"backup": archive.name, "path": str(archive)}

@app.get("/admin/export")
async def admin_export(_session=Depends(require_role("admin"))):
    archive = create_backup()
    return FileResponse(path=archive, filename=archive.name, media_type="application/zip")

@app.post("/admin/import")
async def admin_import(file: UploadFile = File(...), _session=Depends(require_role("admin"))):
    try:
        result = restore_backup(file.filename or "backup.zip", await file.read())
        reset_knowledge_base()
        return result
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

@app.get("/admin")
async def admin_page():
    return FileResponse("static/admin.html")

# Mount static files at root so static/index.html is served at '/'.
app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    import uvicorn

    # Explicit host/port so we can print a clear startup message
    host = "0.0.0.0"
    port = 8000

    print(f"Starting Nritya.ai API — open http://{host}:{port}/ in your browser")
    uvicorn.run(app, host=host, port=port)
