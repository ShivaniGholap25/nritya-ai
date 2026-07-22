import streamlit as st
import requests

st.set_page_config(page_title="Exam Prep Assistant", layout="centered")

st.title("Exam Prep Assistant")

question = st.text_input("Enter your question")

if st.button("Ask"):
    if not question.strip():
        st.error("Please enter a question.")
    else:
        try:
            with st.spinner("Thinking..."):
                response = requests.post(
                    "http://127.0.0.1:8000/ask",
                    json={"question": question.strip()},
                    timeout=60,
                )
                response.raise_for_status()

            data = response.json()
            answer = data.get("answer", "No answer returned.")
            st.markdown(answer.replace("\n", "  \n"))
        except requests.RequestException:
            st.error("Could not connect to the API. Please make sure api.py is running.")
        except Exception:
            st.error("Something went wrong while fetching the answer.")
