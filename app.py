"""Phase 6: Streamlit UI for the Incident Debugging Assistant."""
import streamlit as st
from src.pipeline import answer

st.set_page_config(page_title="Incident Debugging Assistant", layout="wide")
st.title("Incident Debugging Assistant")
st.caption("Paste an error log → get likely root cause + fix from past incidents (fully local).")

with st.sidebar:
    st.header("Settings")
    top_k = st.slider("Top-K retrieved incidents", 1, 8, 3)
    st.divider()
    st.markdown(
        "**Local stack**\n\n"
        "- LLM: Ollama\n"
        "- Embeddings: SentenceTransformers\n"
        "- Vector DB: FAISS\n"
        "- Retrieval: hybrid (BM25 + semantic)"
    )

example = "2025-12-02 ERROR PaymentService NullPointerException at line 45"
query = st.text_area("Error log / stack trace", value=example, height=160)

if st.button("Diagnose", type="primary") and query.strip():
    with st.spinner("Searching past incidents and asking the local LLM..."):
        result = answer(query, top_k=top_k)

    col1, col2 = st.columns([2, 1])

    with col1:
        st.subheader("Suggested fix")
        st.markdown(result["answer"])

    with col2:
        st.metric("Confidence", f"{result['confidence']}%")
        st.subheader("Parsed fields")
        st.json(result["parsed"])

    st.divider()
    st.subheader("Retrieved incidents (ranked)")
    for inc, score in result["retrieved"]:
        with st.expander(f"[{inc['id']}] {inc['error']}  —  score {score:.3f}"):
            st.markdown(f"**Service:** {inc.get('service', '?')}  |  **Severity:** {inc.get('severity', '?')}  |  **When:** {inc.get('timestamp', '?')}")
            st.markdown(f"**Tags:** {', '.join(inc.get('tags', []))}")
            st.markdown(f"**Root cause:** {inc.get('root_cause', '')}")
            st.markdown(f"**Fix:** {inc.get('fix', '')}")
