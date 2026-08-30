"""Build a multi-book FAISS index for Nritya.ai.

Run this script after adding PDFs to books/:
    python app.py
"""

import json
import re
from datetime import datetime
from pathlib import Path

from PyPDF2 import PdfReader
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings

try:
    from langchain_text_splitters import RecursiveCharacterTextSplitter
except ImportError:
    from langchain.text_splitter import RecursiveCharacterTextSplitter


BASE_DIR = Path(__file__).resolve().parent
BOOK_DIR = BASE_DIR / "books"
INDEX_DIR = BASE_DIR / "faiss_index"
STATS_FILE = INDEX_DIR / "index_stats.json"

BOOK_SOURCES = [
    {"key": "theory", "label": "Theory Book", "filename": "theory.pdf"},
    {"key": "natyashastra", "label": "Natyashastra", "filename": "Natyashastra.pdf"},
    {"key": "abhinaya_darpana", "label": "Abhinaya Darpana", "filename": "Abhinaya Darpana.pdf"},
    {"key": "visharad_notes", "label": "Visharad Notes", "filename": "Visharad Notes.pdf"},
    {"key": "prarambhik_notes", "label": "Prarambhik Notes", "filename": "Prarambhik Notes.pdf"},
    {"key": "madhyama_notes", "label": "Madhyama Notes", "filename": "Madhyama Notes.pdf"},
]


def get_available_sources() -> list[dict]:
    sources = []
    for source in BOOK_SOURCES:
        path = BOOK_DIR / source["filename"]
        if path.exists():
            sources.append({**source, "path": path})
    return sources


def infer_chapter_name(text: str, fallback: str) -> str:
    """Best-effort chapter heading extraction from page text."""
    for line in text.splitlines()[:12]:
        cleaned = re.sub(r"\s+", " ", line).strip(" :-")
        if not cleaned:
            continue
        if re.search(r"\b(chapter|unit|lesson|adhyaya)\b", cleaned, re.I):
            return cleaned[:90]
        if cleaned.isupper() and 4 <= len(cleaned) <= 90:
            return cleaned.title()
    return fallback


def load_pdf_documents(source: dict, splitter: RecursiveCharacterTextSplitter) -> tuple[list[Document], int]:
    pdf_path = source["path"]
    reader = PdfReader(str(pdf_path))
    documents = []
    active_chapter = source["label"]

    print(f"Reading {pdf_path} ({len(reader.pages)} pages)")
    for page_index, page in enumerate(reader.pages, start=1):
        page_text = (page.extract_text() or "").strip()
        if not page_text:
            continue

        active_chapter = infer_chapter_name(page_text, active_chapter)
        chunks = splitter.split_text(page_text)

        for chunk_index, chunk in enumerate(chunks, start=1):
            documents.append(
                Document(
                    page_content=chunk,
                    metadata={
                        "book_key": source["key"],
                        "source_book": source["filename"],
                        "book_label": source["label"],
                        "chapter_name": active_chapter,
                        "page_number": page_index,
                        "chunk_number": chunk_index,
                    },
                )
            )

    return documents, len(reader.pages)


def write_stats(book_stats: list[dict], total_chunks: int) -> None:
    stats = {
        "books_indexed": len(book_stats),
        "total_pages_indexed": sum(book["pages"] for book in book_stats),
        "total_chunks_stored": total_chunks,
        "last_index_update": datetime.now().isoformat(timespec="seconds"),
        "books": book_stats,
    }
    INDEX_DIR.mkdir(exist_ok=True)
    STATS_FILE.write_text(json.dumps(stats, indent=2), encoding="utf-8")


def main() -> None:
    print("Starting multi-book index build...")
    sources = get_available_sources()
    if not sources:
        expected = ", ".join(source["filename"] for source in BOOK_SOURCES)
        raise FileNotFoundError(f"No supported PDFs found in books/. Expected one of: {expected}")

    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=80)
    documents = []
    book_stats = []

    for source in sources:
        source_documents, page_count = load_pdf_documents(source, splitter)
        documents.extend(source_documents)
        book_stats.append(
            {
                "key": source["key"],
                "label": source["label"],
                "filename": source["filename"],
                "pages": page_count,
                "chunks": len(source_documents),
            }
        )
        print(f"  Added {len(source_documents)} chunks from {source['filename']}")

    if not documents:
        raise ValueError("No text chunks were extracted from the available PDFs.")

    print('Embedding chunks using "sentence-transformers/all-MiniLM-L6-v2"...')
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    db = FAISS.from_documents(documents, embeddings)
    INDEX_DIR.mkdir(exist_ok=True)
    db.save_local(str(INDEX_DIR))
    write_stats(book_stats, len(documents))

    print(f"Saved FAISS index to {INDEX_DIR}")
    print(f"Books indexed: {len(book_stats)}")
    print(f"Total pages indexed: {sum(book['pages'] for book in book_stats)}")
    print(f"Total chunks stored: {len(documents)}")


if __name__ == "__main__":
    main()
