"""Standalone RAG pipeline smoke test.

Run:
    python test_model.py
"""

from rag_core import get_answer, load_knowledge_base


TEST_QUESTIONS = [
    "What is Adavu?",
    "Explain Natya Shastra",
    "What are the basic Bharatanatyam postures?",
]


def main() -> None:
    failures = []

    print("=" * 64)
    print("Model Pipeline Test")
    print("=" * 64)

    print("\n1) Loading full RAG pipeline")
    try:
        load_knowledge_base()
        print("   PASS: Index and models loaded")
    except Exception as exc:
        print(f"   FAIL: Pipeline load failed ({exc})")
        print("\nAll tests failed because pipeline could not initialize.")
        return

    print("\n2) Running test questions")
    for i, question in enumerate(TEST_QUESTIONS, start=1):
        print(f"\nTest {i}")
        print(f"Question: {question}")
        try:
            answer = get_answer(question)
            print("Answer:")
            print(answer)

            if not answer or len(answer.strip()) < 20:
                failures.append(f"Test {i}: answer too short or empty")
        except Exception as exc:
            print(f"Error: {exc}")
            failures.append(f"Test {i}: exception during get_answer")

    print("\n" + "=" * 64)
    if not failures:
        print("All tests passed")
    else:
        print("Tests failed:")
        for failure in failures:
            print(f"- {failure}")
    print("=" * 64)


if __name__ == "__main__":
    main()
