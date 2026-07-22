# Offline Setup Guide

This project is configured to run **completely offline** after initial setup.

## Initial Setup (Requires Internet - Run Once)

### Step 1: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 2: Download Models

Run this script **once** when you have internet connection:

```bash
python download_models.py
```

This will download:
- `sentence-transformers/all-MiniLM-L6-v2` (embedding model)
- `google/flan-t5-base` (text generation model)

**Note:** The models will be cached in your HuggingFace cache directory (usually `~/.cache/huggingface/` or `C:\Users\<username>\.cache\huggingface\` on Windows).

### Step 3: Create FAISS Index (if not already done)

```bash
python app.py
```

This processes the PDF and creates the FAISS index.

## Running Offline

After completing the initial setup, you can **disconnect from the internet** and run:

### Option 1: Web Frontend (FastAPI)
```bash
python api.py
```
Then open `http://localhost:8000` in your browser.

### Option 2: Streamlit Frontend
```bash
streamlit run frontend.py
```

### Option 3: Command-Line Interface
```bash
python ask.py
```

## Offline Configuration

All scripts are configured with:
- `TRANSFORMERS_OFFLINE=1` - Prevents HuggingFace from accessing the internet
- `local_files_only=True` - Forces models to load from local cache only
- `HF_DATASETS_OFFLINE=1` - Prevents dataset downloads

## Troubleshooting

### Error: "Model not found" or "local_files_only=True but model not found"

**Solution:** Run `python download_models.py` with internet connection first.

### Error: "FAISS index not found"

**Solution:** Run `python app.py` to create the FAISS index from your PDF.

### Models are downloading even in offline mode

**Solution:** Check that:
1. Environment variables are set correctly
2. Models were downloaded successfully (check `~/.cache/huggingface/`)
3. You're using the updated scripts with `local_files_only=True`

## Model Cache Location

Models are stored in:
- **Linux/Mac:** `~/.cache/huggingface/`
- **Windows:** `C:\Users\<username>\.cache\huggingface\`

You can copy this entire directory to another machine for offline use.

## File Structure

```
bharatnatyam_llm/
├── api.py                 # FastAPI backend (offline mode)
├── frontend.py            # Streamlit frontend (offline mode)
├── ask.py                 # CLI interface (offline mode)
├── app.py                 # PDF processing
├── download_models.py     # Initial model download script
├── static/               # Web frontend files
│   ├── index.html
│   ├── style.css
│   └── script.js
├── faiss_index/          # FAISS vector database
└── books/
    └── theory.pdf        # Source PDF
```

## Verification

To verify offline mode is working:

1. Disconnect from the internet
2. Run any of the frontend scripts
3. Check that models load without network requests
4. Ask a question and verify it works

If everything works, you're successfully running offline! 🎉
