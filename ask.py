from rag_core import get_answer, load_knowledge_base


def main() -> None:
    try:
        load_knowledge_base()
    except Exception as exc:
        print(f"Failed to load FAISS index or model: {exc}")
        return

    print("Exam Prep Assistant - type your question (or 'quit' to exit)")

    while True:
        question = input("\n> ").strip()

        if question.lower() == "quit":
            print("Goodbye.")
            break

        if not question:
            print("Please enter a question.")
            continue

        try:
            answer = get_answer(question)
            print("\n" + answer)
        except Exception as exc:
            print(f"Error: {exc}")


if __name__ == "__main__":
    main()
