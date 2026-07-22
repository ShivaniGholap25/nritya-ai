# Bharatanatyam Exam Assistant - Web Frontend

This project now includes a modern web frontend in addition to the Streamlit interface.

**Note:** This project runs completely offline after initial setup. See `OFFLINE_SETUP.md` for details.

## Running the Web Frontend

### Option 1: FastAPI Web Frontend (HTML/CSS/JS)

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Start the FastAPI server:
```bash
python api.py
```

3. Open your browser and navigate to:
```
http://localhost:8000
```

The web interface will be available with a modern, responsive design.

### Option 2: Streamlit Frontend

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run Streamlit:
```bash
streamlit run frontend.py
```

3. The Streamlit interface will open automatically in your browser.

## Features

- **Modern UI**: Beautiful gradient design with smooth animations
- **Responsive**: Works on desktop and mobile devices
- **Real-time Answers**: Get instant, exam-oriented answers to your questions
- **Bullet Points**: Answers formatted in clear, point-wise format
- **Error Handling**: User-friendly error messages

## API Endpoints

- `GET /` - Main web interface
- `POST /api/ask` - Submit a question and get an answer
- `GET /api/health` - Health check endpoint

## Project Structure

```
bharatnatyam_llm/
├── api.py              # FastAPI backend server
├── frontend.py         # Streamlit frontend
├── static/
│   ├── index.html     # Main HTML page
│   ├── style.css      # Styling
│   └── script.js      # JavaScript functionality
├── app.py             # PDF processing and FAISS index creation
├── ask.py             # Command-line interface
└── requirements.txt   # Python dependencies
```
