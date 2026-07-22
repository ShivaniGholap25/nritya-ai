"""Standalone setup validator for local RAG project.

Run:
    python test_setup.py
"""

from pathlib import Path

from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer


def main() -> None:
    failures = []
    index_dir = Path("faiss_index")

    print("=" * 64)
    print("Setup Validation")
    print("=" * 64)

    print("\n1) Checking faiss_index folder")
    if not index_dir.exists() or not index_dir.is_dir():
        print("   FAIL: faiss_index/ folder does not exist")
        failures.append("faiss_index folder missing")
    else:
        files = [p for p in index_dir.iterdir() if p.is_file()]
        if not files:
            print("   FAIL: faiss_index/ exists but is empty")
            failures.append("faiss_index folder empty")
        else:
            print(f"   PASS: faiss_index/ found with {len(files)} file(s)")

    print("\n2) Loading FAISS index")
    try:
        emb_for_index = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
        _db = FAISS.load_local(
            "faiss_index",
            emb_for_index,
            allow_dangerous_deserialization=True,
        )
        print("   PASS: FAISS index loaded")
    except Exception as exc:
        print(f"   FAIL: Could not load FAISS index ({exc})")
        failures.append("FAISS index load failed")

    print("\n3) Loading embedding model")
    try:
        embedding_model = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
        sample = embedding_model.embed_query("test")
        print(f"   PASS: Embedding model loaded (dim={len(sample)})")
    except Exception as exc:
        print(f"   FAIL: Embedding model failed ({exc})")
        failures.append("embedding model load failed")

    print("\n4) Loading flan-t5 model")
    try:
        tokenizer = AutoTokenizer.from_pretrained("google/flan-t5-base")
        model = AutoModelForSeq2SeqLM.from_pretrained("google/flan-t5-base")

        tokens = tokenizer("test", return_tensors="pt")
        output_ids = model.generate(**tokens, max_new_tokens=8)
        generated = tokenizer.decode(output_ids[0], skip_special_tokens=True)
        if generated.strip():
            print("   PASS: flan-t5 loaded and generated output")
        else:
            print("   FAIL: flan-t5 generated empty output")
            failures.append("flan-t5 inference produced empty output")
    except Exception as exc:
        print(f"   FAIL: flan-t5 load failed ({exc})")
        failures.append("flan-t5 load failed")

    print("\n" + "=" * 64)
    if not failures:
        print("Setup OK")
    else:
        print("Setup failed:")
        for failure in failures:
            print(f"- {failure}")
    print("=" * 64)


if __name__ == "__main__":
    main()
