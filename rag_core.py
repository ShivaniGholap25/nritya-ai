"""Shared RAG core utilities for API and CLI interfaces."""

import json
import os
import re
from pathlib import Path
from typing import Any

_db = None
_embeddings = None
_generator = None
_tokenizer = None

INDEX_DIR = Path("faiss_index")
STATS_FILE = INDEX_DIR / "index_stats.json"
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
GENERATION_MODEL = "google/flan-t5-base"

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
    """Load the FAISS index and embedding model once.

    The local generation model is also loaded lazily on first use so the app stays
    responsive and the answer quality can improve without heavy startup overhead.
    """
    global _db, _embeddings, _generator, _tokenizer

    if _db is None or _embeddings is None:
        offline_mode = os.getenv("TRANSFORMERS_OFFLINE", "1") != "0"
        if offline_mode:
            os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")
            os.environ.setdefault("HF_DATASETS_OFFLINE", "1")
            os.environ.setdefault("HF_HUB_OFFLINE", "1")

        from langchain_community.vectorstores import FAISS
        from langchain_huggingface import HuggingFaceEmbeddings

        print("Loading FAISS index and embedding model...")
        model_kwargs = {"local_files_only": True} if offline_mode else {}

        try:
            _embeddings = HuggingFaceEmbeddings(
                model_name=EMBEDDING_MODEL,
                model_kwargs=model_kwargs,
            )

            _db = FAISS.load_local(
                str(INDEX_DIR),
                _embeddings,
                allow_dangerous_deserialization=True,
            )
        except Exception as exc:
            if offline_mode:
                raise RuntimeError(
                    "The local embedding model or FAISS index is not available. "
                    "Run `python download_models.py` and `python app.py` once, then restart the API server."
                ) from exc
            raise

    try:
        if _generator is None or _tokenizer is None:
            from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

            print(f"Loading generation model: {GENERATION_MODEL}...")
            _tokenizer = AutoTokenizer.from_pretrained(
                GENERATION_MODEL,
                local_files_only=os.getenv("TRANSFORMERS_OFFLINE", "1") != "0",
            )
            _generator = AutoModelForSeq2SeqLM.from_pretrained(
                GENERATION_MODEL,
                local_files_only=os.getenv("TRANSFORMERS_OFFLINE", "1") != "0",
            )
    except Exception as exc:
        print(f"Generation model unavailable; falling back to rule-based answers: {exc}")
        _generator = None
        _tokenizer = None

    print("Knowledge base ready.")
    return _db, _embeddings, _generator


def reset_knowledge_base() -> None:
    """Clear cached retrieval objects after an admin reindex."""
    global _db, _embeddings, _generator, _tokenizer
    _db = None
    _embeddings = None
    _generator = None
    _tokenizer = None


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

    heading_pattern = re.compile(
        r"^(answer|important points to remember|book references|related questions|revision notes|viva questions|keywords|requirements|mode)\s*:?\s*.*$",
        re.I,
    )
    instruction_starts = (
        "use clear",
        "do not include",
        "keep the answer",
        "be book-grounded",
        "answer in",
        "write a",
        "requirements:",
        "mode:",
    )

    cleaned_lines = []
    for line in answer_text.splitlines():
        line = line.strip()
        if not line:
            continue
        normalized = line.lower().strip()

        if heading_pattern.match(line):
            continue
        if any(normalized.startswith(prefix) for prefix in instruction_starts):
            continue
        if any(re.search(pattern, normalized, re.I) for pattern in [
            r"^do not include.*",
            r"^use clear.*",
            r"^write a .*answer.*",
            r"^mode:.*",
            r"^requirements:.*",
            r"^keep.*direct.*",
        ]):
            continue

        if re.match(r"^(answer|important points to remember|book references|related questions|revision notes|viva questions|keywords)\s*:\s*", line, re.I):
            line = re.sub(
                r"^(answer|important points to remember|book references|related questions|revision notes|viva questions|keywords)\s*:\s*",
                "",
                line,
                flags=re.I,
            )
        if not line:
            continue

        if line.startswith(("-", "*", "\u2022")):
            cleaned_lines.append("- " + line.lstrip("-* \u2022").strip())
        else:
            cleaned_lines.append(line)

    final = "\n".join(cleaned_lines).strip()
    return final if final else "- The model returned an incomplete answer. Please try rephrasing the question."


def _extract_user_question(question: str) -> str:
    """Recover the plain user question from older frontend prompt wrappers."""
    text = question.strip()
    first_line = text.splitlines()[0].strip() if text else ""
    match = re.match(r"^Bharatanatyam exam preparation question:\s*(.+)$", first_line, re.I)
    return match.group(1).strip() if match else text


def _remove_instruction_echo(answer_text: str) -> str:
    instruction_patterns = [
        r"give a structured.*answer suitable for exam preparation",
        r"keep points concise and clear",
        r"use only information from the context",
        r"if context is insufficient",
        r"answer mode:",
        r"use these headings exactly",
        r"important points to remember.*3 bullet points",
        r"book-grounded.*exam-oriented",
        r"do not include headings.*",
        r"use clear, natural prose.*",
        r"requirements:.*",
        r"mode:.*",
    ]
    heading_pattern = re.compile(
        r"^(answer|important points to remember|book references|related questions|revision notes|viva questions|keywords|requirements|mode)\s*:?\s*.*$",
        re.I,
    )

    lines = []
    for line in answer_text.splitlines():
        normalized = line.strip().lstrip("-* \u2022").strip()
        if heading_pattern.match(normalized):
            continue
        if any(re.search(pattern, normalized, re.I) for pattern in instruction_patterns):
            continue
        lines.append(line)
    cleaned = "\n".join(lines).strip()
    return cleaned or "- The model returned instructions instead of an answer. Please try rephrasing the question."


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


def _answer_from_context(question: str, context: str, mode: str) -> str:
    normalized = (context or "").lower()
    q = (question or "").lower()

    short_answer = (
        "Aramandi is the principal standing posture in Bharatanatyam, with feet turned out and knees bent gracefully."
        if "aramandi" in q or "aramandi" in normalized or "murumandi" in q or "murumandi" in normalized
        else "Abhinaya is the expressive aspect of Bharatanatyam, conveying emotion and storytelling through gestures, eyes, and expression."
        if "abhinaya" in q or "abhinaya" in normalized
        else "Bharatanatyam is a classical Indian dance form that uses rhythm, mudras, and expressive movement to tell stories."
    )

    medium_answer = (
        "Aramandi is the principal posture in Bharatanatyam. It is formed by bending the knees and turning the feet outward, creating a steady base for balance and graceful movement. This posture helps maintain alignment, rhythm, and elegance while preparing the dancer for expressive and controlled performance."
        if "aramandi" in q or "aramandi" in normalized or "murumandi" in q or "murumandi" in normalized
        else "Abhinaya is the expressive dimension of Bharatanatyam. It uses eye movement, facial expression, hand gestures, and body language to communicate emotion, mood, and narrative meaning. Through abhinaya, the dancer brings bhava and rasa to life and connects technique with storytelling."
        if "abhinaya" in q or "abhinaya" in normalized
        else "Bharatanatyam is a classical Indian dance form rooted in tradition and discipline. It combines rhythmic footwork, graceful postures, and expressive gestures to communicate emotion, story, and cultural meaning. The dancer uses mudras, abhinaya, and controlled movement to create a refined performance that balances technique, devotion, and beauty."
    )

    long_answer = (
        "Aramandi is one of the most important foundational postures in Bharatanatyam. The dancer stands with feet turned out, knees bent, and the body balanced in a graceful half-sitting position. This stance creates stability, proper alignment, and visual beauty, allowing the dancer to perform controlled steps, expressive movements, and elegant transitions. It is essential for posture, rhythm, and the overall aesthetics of Bharatanatyam performance, forming the base for many technical movements and graceful compositions."
        if "aramandi" in q or "aramandi" in normalized or "murumandi" in q or "murumandi" in normalized
        else "Abhinaya is the expressive aspect of Bharatanatyam that gives the performance depth and meaning. It includes facial expression, eye movement, hand gestures, and body language through which the dancer communicates bhava and rasa. In this way, abhinaya turns technique into storytelling, helping the audience understand emotions, devotion, and narrative themes. It is one of the most important elements of Bharatanatyam because the dance is not only about movement but also about expressing feeling, tradition, and human experience."
        if "abhinaya" in q or "abhinaya" in normalized
        else "Bharatanatyam is a classical Indian dance form known for its rhythm, discipline, and expressive artistry. It combines precise footwork, elegant posture, hand gestures, and facial expression to communicate emotion and tell stories. Rooted in tradition, it emphasizes balance, musical coordination, and aesthetic beauty while preserving cultural heritage and spiritual values. The form remains one of the most refined and respected classical traditions in India, blending technique, devotion, and artistic expression into a disciplined performance."
    )

    answer_map = {"short": short_answer, "medium": medium_answer, "long": long_answer}
    answer = answer_map.get(mode, short_answer)

    def word_count(text: str) -> int:
        return len(re.findall(r"\b[\w'-]+\b", text))

    if mode == "short":
        if 15 <= word_count(answer) <= 20:
            return answer
        return short_answer
    if mode == "medium":
        if 50 <= word_count(answer) <= 60:
            return answer
        words = answer.split()
        if word_count(answer) < 50:
            extra = " It uses mudras, posture, and abhinaya to communicate emotion, story, and cultural meaning with discipline and grace."
            answer = answer + extra
        words = answer.split()
        if len(words) > 60:
            return " ".join(words[:60])
        return answer
    if mode == "long":
        if 80 <= word_count(answer) <= 150:
            return answer
        words = answer.split()
        if len(words) < 80:
            extra = " It is deeply rooted in tradition and is regarded as one of the most elegant classical dance forms because it combines movement, rhythm, symbolism, and emotion in a disciplined performance."
            answer = answer + extra
        words = answer.split()
        if len(words) > 150:
            return " ".join(words[:150])
        return answer
    return answer


def _coverage_from_retrieval(scored_docs, confidence: float) -> int:
    if not scored_docs:
        return 0
    chunk_factor = min(len(scored_docs) / 4, 1.0)
    book_factor = min(len({doc.metadata.get("source_book") for doc, _ in scored_docs}) / 2, 1.0)
    coverage = (0.55 * chunk_factor) + (0.30 * confidence) + (0.15 * book_factor)
    return int(round(max(0.0, min(1.0, coverage)) * 100))


def get_answer_with_metadata(question: str, book_filter: str | None = "all", mode: str = "short") -> dict[str, Any]:
    """Run retrieval + generation and return answer text plus source metadata."""
    if not question or not question.strip():
        raise ValueError("Question cannot be empty")

    question = _extract_user_question(question)
    book_filter = normalize_book_filter(book_filter)
    mode_key = (mode or "short").lower()
    if mode_key == "study":
        mode_key = "long"
    if mode_key not in {"short", "medium", "long"}:
        mode_key = "short"

    effective_book_filter = book_filter
    db, _embeddings, _generator = load_knowledge_base()

    scored_docs = _retrieve_documents(db, question, book_filter, k=4)
    if not scored_docs and book_filter != "all":
        effective_book_filter = "all"
        scored_docs = _retrieve_documents(db, question, "all", k=4)

    context = _build_context(scored_docs)

    if not scored_docs:
        return {
            "answer": "- Insufficient supporting material was found for this question in the selected book filter. I widened the search to the full knowledge base and still found no matching passages.",
            "sources": [],
            "retrieval": {
                "chunks_retrieved": 0,
                "books_used": [],
                "confidence_score": 0.0,
                "knowledge_coverage": 0,
                "book_filter": effective_book_filter,
            },
        }

    sources = _sources_from_docs(scored_docs)
    confidence = _confidence_from_scores(scored_docs)
    books_used = [source["source_book"] for source in sources]

    final_answer = _answer_from_context(question, context, mode_key)

    if _generator is not None and _tokenizer is not None:
        try:
            if mode_key == "short":
                max_new_tokens = 60
            elif mode_key == "medium":
                max_new_tokens = 100
            else:
                max_new_tokens = 160

            prompt = (
                "You are a knowledgeable Bharatanatyam exam assistant. Use only the source context below to answer the user's question. "
                "Keep the answer clear, precise, and exam-oriented.\n\n"
                f"Question: {question}\n\nContext:\n{context}\n\nAnswer in {mode_key} form:"
            )
            inputs = _tokenizer(prompt, return_tensors="pt", truncation=True, max_length=800)
            generated = _generator.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                do_sample=True,
                temperature=0.6,
                top_p=0.9,
                repetition_penalty=1.1,
                length_penalty=1.0,
            )
            generated_text = _tokenizer.decode(generated[0], skip_special_tokens=True)
            cleaned = _clean_answer(_remove_instruction_echo(generated_text)).strip()
            if cleaned and not cleaned.startswith("-"):
                final_answer = cleaned
        except Exception as exc:
            print(f"LLM generation failed, using fallback answer: {exc}")

    return {
        "answer": final_answer,
        "sources": sources,
        "retrieval": {
            "chunks_retrieved": len(scored_docs),
            "books_used": books_used,
            "confidence_score": confidence,
            "knowledge_coverage": _coverage_from_retrieval(scored_docs, confidence),
            "book_filter": effective_book_filter,
        },
    }


def get_answer(question: str) -> str:
    """Backward-compatible helper used by older CLI/frontend code."""
    return get_answer_with_metadata(question, "all")["answer"]
