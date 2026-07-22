"""Shared RAG core utilities for API and CLI interfaces."""

import json
from pathlib import Path
from typing import Any

_db = None
_embeddings = None
_generator = None

INDEX_DIR = Path("faiss_index")
STATS_FILE = INDEX_DIR / "index_stats.json"

BOOK_OPTIONS = [
    {"key": "all", "label": "All Books"},
    {"key": "theory", "label": "Theory Book"},
    {"key": "natyashastra", "label": "Natyashastra"},
    {"key": "abhinaya_darpana", "label": "Abhinaya Darpana"},
    {"key": "visharad_notes", "label": "Visharad Notes"},
    {"key": "prarambhik_notes", "label": "Prarambhik Notes"},
    {"key": "madhyama_notes", "label": "Madhyama Notes"},
]


def get_book_options() -> list[dict[str, str]]:
    """Return static and admin-managed book filters."""
    options = list(BOOK_OPTIONS)
    seen = {option["key"] for option in options}

    if STATS_FILE.exists():
        try:
            stats = json.loads(STATS_FILE.read_text(encoding="utf-8"))
            for book in stats.get("books", []):
                key = book.get("key")
                label = book.get("label") or book.get("filename") or key
                if key and key not in seen:
                    options.append({"key": key, "label": label})
                    seen.add(key)
        except json.JSONDecodeError:
            pass

    return options


def load_knowledge_base():
    """Load FAISS index, embedding model, and text generation model once."""
    global _db, _embeddings, _generator

    if _db is None or _embeddings is None or _generator is None:
        from langchain_community.vectorstores import FAISS
        from langchain_huggingface import HuggingFaceEmbeddings
        from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

        print("Loading FAISS index and models...")

        _embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )

        _db = FAISS.load_local(
            str(INDEX_DIR),
            _embeddings,
            allow_dangerous_deserialization=True,
        )

        tokenizer = AutoTokenizer.from_pretrained("google/flan-t5-base")
        model = AutoModelForSeq2SeqLM.from_pretrained("google/flan-t5-base")
        _generator = (tokenizer, model)

        print("Knowledge base ready.")

    return _db, _embeddings, _generator


def reset_knowledge_base() -> None:
    """Clear cached retrieval objects after an admin reindex."""
    global _db, _embeddings, _generator
    _db = None
    _embeddings = None
    _generator = None


def get_index_stats() -> dict[str, Any]:
    """Return index statistics for the UI dashboard."""
    if STATS_FILE.exists():
        try:
            return json.loads(STATS_FILE.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            pass

    return {
        "books_indexed": 1,
        "total_pages_indexed": 0,
        "total_chunks_stored": 0,
        "last_index_update": "Unknown",
        "books": [],
    }


def normalize_book_filter(book_filter: str | None) -> str:
    requested = (book_filter or "all").strip()
    valid_keys = {option["key"] for option in get_book_options()}
    return requested if requested in valid_keys else "all"


def _metadata_filter(book_filter: str):
    if book_filter == "all":
        return None
    return {"book_key": book_filter}


def _retrieve_documents(db, question: str, book_filter: str, k: int = 4):
    filter_value = _metadata_filter(book_filter)
    fetch_k = 24 if book_filter == "all" else 36

    try:
        return db.similarity_search_with_score(
            question,
            k=k,
            filter=filter_value,
            fetch_k=fetch_k,
        )
    except TypeError:
        results = db.similarity_search_with_score(question, k=fetch_k)
        if book_filter != "all":
            results = [
                item for item in results
                if item[0].metadata.get("book_key") == book_filter
            ]
        return results[:k]


def _clean_answer(answer_text: str) -> str:
    if not answer_text:
        return "- Unable to generate an answer from the retrieved context."

    cleaned_lines = []
    for line in answer_text.splitlines():
        line = line.strip()
        if not line:
            continue
        if line.startswith(("-", "*", "\u2022")):
            cleaned_lines.append("- " + line.lstrip("-* \u2022").strip())
        else:
            cleaned_lines.append("- " + line)

    return "\n".join(cleaned_lines) if cleaned_lines else answer_text


def _build_context(scored_docs) -> str:
    context_blocks = []
    for doc, _score in scored_docs:
        metadata = doc.metadata or {}
        source = metadata.get("source_book", "Unknown source")
        page = metadata.get("page_number", "Unknown page")
        chapter = metadata.get("chapter_name", "Retrieved context")
        context_blocks.append(
            f"[Source: {source}; Page: {page}; Chapter: {chapter}]\n{doc.page_content}"
        )
    return "\n\n".join(context_blocks)


def _confidence_from_scores(scored_docs) -> float:
    if not scored_docs:
        return 0.0
    distances = [max(float(score), 0.0) for _doc, score in scored_docs]
    average_distance = sum(distances) / len(distances)
    return round(max(0.0, min(1.0, 1.0 / (1.0 + average_distance))), 2)


def _sources_from_docs(scored_docs) -> list[dict[str, Any]]:
    sources = {}
    for doc, _score in scored_docs:
        metadata = doc.metadata or {}
        book_name = metadata.get("source_book", "Unknown source")
        entry = sources.setdefault(
            book_name,
            {
                "source_book": book_name,
                "book_label": metadata.get("book_label", book_name),
                "chapters": set(),
                "pages": set(),
            },
        )
        chapter = metadata.get("chapter_name")
        page = metadata.get("page_number")
        if chapter:
            entry["chapters"].add(str(chapter))
        if page:
            entry["pages"].add(int(page) if str(page).isdigit() else str(page))

    normalized = []
    for entry in sources.values():
        normalized.append(
            {
                "source_book": entry["source_book"],
                "book_label": entry["book_label"],
                "chapters": sorted(entry["chapters"]),
                "pages": sorted(entry["pages"]),
            }
        )
    return normalized


def _coverage_from_retrieval(scored_docs, confidence: float) -> int:
    if not scored_docs:
        return 0
    chunk_factor = min(len(scored_docs) / 4, 1.0)
    book_factor = min(len({doc.metadata.get("source_book") for doc, _ in scored_docs}) / 2, 1.0)
    coverage = (0.55 * chunk_factor) + (0.30 * confidence) + (0.15 * book_factor)
    return int(round(max(0.0, min(1.0, coverage)) * 100))


def get_answer_with_metadata(question: str, book_filter: str | None = "all") -> dict[str, Any]:
    """Run retrieval + generation and return answer text plus source metadata."""
    if not question or not question.strip():
        raise ValueError("Question cannot be empty")

    book_filter = normalize_book_filter(book_filter)
    db, _embeddings, generator = load_knowledge_base()

    scored_docs = _retrieve_documents(db, question, book_filter, k=4)
    context = _build_context(scored_docs)

    if not scored_docs:
        return {
            "answer": "- Insufficient supporting material was found for this question in the selected book filter.",
            "sources": [],
            "retrieval": {
                "chunks_retrieved": 0,
                "books_used": [],
                "confidence_score": 0.0,
                "knowledge_coverage": 0,
                "book_filter": book_filter,
            },
        }

    prompt = f"""
Based on the following context, answer in bullet points:

{context}

Question: {question}

Instructions:
- Give a structured, point-wise answer suitable for exam preparation.
- Keep points concise and clear.
- Use only information from the context.
- If context is insufficient, say so briefly in one bullet.
"""

    tokenizer, model = generator
    inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=1024)
    output_ids = model.generate(**inputs, max_new_tokens=220)
    answer_text = tokenizer.decode(output_ids[0], skip_special_tokens=True).strip()

    sources = _sources_from_docs(scored_docs)
    confidence = _confidence_from_scores(scored_docs)
    books_used = [source["source_book"] for source in sources]

    return {
        "answer": _clean_answer(answer_text),
        "sources": sources,
        "retrieval": {
            "chunks_retrieved": len(scored_docs),
            "books_used": books_used,
            "confidence_score": confidence,
            "knowledge_coverage": _coverage_from_retrieval(scored_docs, confidence),
            "book_filter": book_filter,
        },
    }


def get_answer(question: str) -> str:
    """Backward-compatible helper used by older CLI/frontend code."""
    return get_answer_with_metadata(question, "all")["answer"]
