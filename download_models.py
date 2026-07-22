"""Pre-download all required Hugging Face models for fully offline execution.

Run this once while online:
    python download_models.py
"""

import sys

from sentence_transformers import SentenceTransformer
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer


EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
GENERATION_MODEL = "google/flan-t5-base"


def download_embedding_model() -> SentenceTransformer:
    print("[1/4] Downloading embedding model:", EMBEDDING_MODEL)
    print("      This may take a few minutes...")

    model = SentenceTransformer(EMBEDDING_MODEL)

    print("      Running embedding test inference...")
    test_embeddings = model.encode(
        ["Bharatanatyam test sentence"],
        show_progress_bar=True,
        convert_to_numpy=True,
    )
    print(f"      Embedding test passed. Vector shape: {test_embeddings.shape}")
    return model


def download_generation_model() -> tuple[AutoTokenizer, AutoModelForSeq2SeqLM]:
    print("[2/4] Downloading generation model:", GENERATION_MODEL)
    print("      Downloading tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(GENERATION_MODEL)

    print("      Downloading seq2seq model weights...")
    model = AutoModelForSeq2SeqLM.from_pretrained(GENERATION_MODEL)

    print("      Running generation test inference...")
    prompt = "Explain adavu in one short bullet point."
    inputs = tokenizer(prompt, return_tensors="pt")
    output_ids = model.generate(**inputs, max_new_tokens=24)
    output_text = tokenizer.decode(output_ids[0], skip_special_tokens=True).strip()

    if not output_text:
        raise RuntimeError("Generation test returned empty output")

    print(f"      Generation test passed. Sample output: {output_text}")
    return tokenizer, model


def print_offline_instructions() -> None:
    print("[3/4] Offline setup instructions")
    print("      Set these environment variables before running the app:")
    print("      TRANSFORMERS_OFFLINE=1")
    print("      HF_DATASETS_OFFLINE=1")
    print("")
    print("      PowerShell example:")
    print("      $env:TRANSFORMERS_OFFLINE='1'")
    print("      $env:HF_DATASETS_OFFLINE='1'")


def main() -> None:
    print("=" * 68)
    print("Preparing models for offline deployment")
    print("=" * 68)

    try:
        download_embedding_model()
        download_generation_model()
        print_offline_instructions()

        print("[4/4] Done")
        print("      All required models downloaded and verified successfully.")
        print("      You can now move this environment to an offline machine.")
    except Exception as exc:
        print("\nModel download failed:", exc)
        print("Ensure internet access and try again.")
        sys.exit(1)


if __name__ == "__main__":
    main()
