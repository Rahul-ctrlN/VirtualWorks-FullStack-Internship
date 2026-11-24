# Quick Note Application

A responsive single-page notebook for capturing and revisiting notes. The browser sends notes to a Python Flask backend, which stores them in SQLite and returns them to the same page. Notes persist across refreshes because they are loaded from the database on each visit.

## Features

- Write notes in a focused, responsive single-page interface.
- Save notes through an HTTP `POST` request to the Flask API.
- Store notes in a local SQLite database, created automatically on startup.
- Retrieve saved notes through an HTTP `GET` request and display them as cards.
- Keep notes available after refreshing or reopening the page.
- Reject empty notes and notes longer than 10,000 characters.
- Show loading, success, and error feedback.
- Render note text safely as text content rather than executable HTML.

## Technologies

- Frontend: HTML, CSS, JavaScript
- Backend: Python, Flask
- Database: SQLite

## Folder structure

```text
Task-1-Quick-Note-Application/
├── .gitignore
├── README.md
├── requirements.txt
├── frontend/
│   ├── index.html
│   ├── script.js
│   └── style.css
└── backend/
    ├── app.py
    └── database.db    # created automatically; kept out of Git
```

## Installation

1. Install Python 3.9 or newer.
2. Open a terminal in `Task-1-Quick-Note-Application`.
3. Create and activate a virtual environment:

   **Windows PowerShell**

   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

   **macOS / Linux**

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

4. Install the dependency:

   ```bash
   python -m pip install -r requirements.txt
   ```

## Run the application

From the `Task-1-Quick-Note-Application` directory, start Flask:

```bash
python backend/app.py
```

Open [http://127.0.0.1:5000](http://127.0.0.1:5000) in a browser. The database and `notes` table are created automatically in `backend/database.db` when the server starts. Keep the server running while using the app.

## How the parts communicate

1. Flask serves `frontend/index.html`, `style.css`, and `script.js` from the same origin as the API.
2. On page load, JavaScript sends `GET /api/notes`. Flask reads notes from SQLite and returns JSON; JavaScript renders each result as a note card.
3. When the user saves a note, JavaScript sends `POST /api/notes` with a JSON body such as `{"content":"An idea to remember"}`.
4. Flask validates the content and inserts it into SQLite using a parameterized SQL statement, then returns the saved note as JSON.
5. The page refreshes its list from the API after a successful save. Future page loads retrieve the same notes from the database.

The local database is excluded from Git so personal note contents are not committed.
