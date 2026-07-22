# 🩰 Bharatanatyam Exam Assistant

An AI-powered question-answering system for Bharatanatyam exam preparation. Ask questions from your textbook and get point-wise, exam-oriented answers.

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 2: Download Models (First Time Only)

**Note:** This requires internet connection. After this step, everything works offline.

```bash
python download_models.py
```

This downloads:
- Embedding model (~80MB)
- Text generation model (~250MB)

**Total download:** ~330MB (one-time only)

### Step 3: Create Knowledge Base (If Not Already Done)

If you haven't created the FAISS index yet:

```bash
python app.py
```

This processes `books/theory.pdf` and creates the searchable index.

## 🎯 Running the Application

You have **3 ways** to use the application:

### Option 1: Web Frontend (Recommended) 🌐

```bash
python api.py
```

Then open your browser and go to:
```
http://localhost:8000
```

**Features:**
- Modern, beautiful UI
- Responsive design
- Smooth animations
- Works on mobile devices

### Option 2: Streamlit Frontend 📊

```bash
streamlit run frontend.py
```

The browser will open automatically with the Streamlit interface.

### Option 3: Command Line Interface 💻

```bash
python ask.py
```

Type your questions directly in the terminal. Type `exit` to quit.

## 📋 Prerequisites

- Python 3.8 or higher
- Internet connection (only for initial setup)
- ~500MB free disk space (for models)

## 🔧 Troubleshooting

### "Model not found" error

**Solution:** Run `python download_models.py` first (requires internet).

### "FAISS index not found" error

**Solution:** Run `python app.py` to create the index from your PDF.

### Port already in use

If port 8000 is busy, edit `api.py` and change:
```python
uvicorn.run(app, host="0.0.0.0", port=8000)
```
to a different port (e.g., `port=8001`).

### Models downloading even offline

Make sure you've:
1. Run `download_models.py` successfully
2. Updated all scripts with offline mode (already done)
3. Checked that models are in `~/.cache/huggingface/`

## 📁 Project Structure

```
bharatnatyam_llm/
├── api.py                 # FastAPI web server
├── frontend.py            # Streamlit interface
├── ask.py                 # Command-line interface
├── app.py                 # PDF processing & FAISS index creation
├── download_models.py     # Download models (run once)
├── static/               # Web frontend files
│   ├── index.html
│   ├── style.css
│   └── script.js
├── faiss_index/          # Vector database (created by app.py)
├── books/
│   └── theory.pdf        # Your textbook PDF
└── requirements.txt      # Python dependencies
```

## 🌐 Offline Mode

After initial setup, **everything works offline**:
- ✅ No internet required
- ✅ Models cached locally
- ✅ All frontend files self-contained

See `OFFLINE_SETUP.md` for detailed offline configuration.

## 💡 Usage Tips

1. **Ask specific questions** for better answers
2. **Use exam-style questions** (e.g., "What are the types of adavus?")
3. Answers are formatted as **bullet points** for easy reading
4. The system searches your PDF content, so answers come from your textbook

## 📝 Example Questions

- "What is Bharatanatyam?"
- "Explain the types of adavus"
- "What are the hand gestures used in Bharatanatyam?"
- "Describe the history of Bharatanatyam"

## 🛠️ Development

To modify the system:
- Edit `api.py` for backend changes
- Edit `static/` files for web frontend
- Edit `frontend.py` for Streamlit changes
- Edit `app.py` to change PDF processing settings

## 📄 License

This project is for educational purposes.

---

**Need help?** Check `OFFLINE_SETUP.md` for detailed setup instructions or `QUICK_START.md` for a quick reference.
