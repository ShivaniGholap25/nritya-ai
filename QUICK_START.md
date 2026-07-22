# Quick Start Guide

## First Time Setup (Requires Internet)

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Download models (one-time, ~300MB download)
python download_models.py

# 3. Create FAISS index from PDF
python app.py
```

## Running the Application (Offline)

After setup, disconnect from internet and run:

**Web Frontend:**
```bash
python api.py
# Open http://localhost:8000
```

**Streamlit Frontend:**
```bash
streamlit run frontend.py
```

**Command Line:**
```bash
python ask.py
```

## Important Notes

- ✅ All models are cached locally after first download
- ✅ No internet required after initial setup
- ✅ All frontend files are self-contained (no CDN dependencies)
- ✅ Works completely offline

For detailed offline setup instructions, see `OFFLINE_SETUP.md`
