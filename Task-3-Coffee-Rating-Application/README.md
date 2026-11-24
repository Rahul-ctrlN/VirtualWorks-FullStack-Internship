# Task 3 — Coffee Rating Application

A warm, coffeehouse-inspired collection where visitors can explore six coffee drinks and vote for their favorite. Flask serves the responsive HTML, CSS, and JavaScript frontend and provides a JSON API. SQLite is the source of truth for coffee details and persistent vote totals.

## Features

- Curated collection: Caramel Latte, Cappuccino, Spanish Latte, Mocha, Cold Brew, and Vanilla Latte.
- Responsive coffee cards with large coffee photography, graceful image fallbacks, and accessible vote controls.
- Votes are sent to Flask with HTTP `POST`, written to SQLite, and returned to the page without a reload.
- Vote totals load from SQLite on every page visit and persist across refreshes and server restarts.
- SQLite database, schema, and initial coffee rows are created automatically on first launch. Existing votes are never reset during startup.
- Loading, empty, retry, success, network error, and database error feedback.
- Input and coffee-ID validation, parameterized SQL, and clear HTTP error responses.

## Technologies

- Frontend: HTML5, CSS3, JavaScript
- Backend: Python 3 and Flask
- Database: SQLite
- Typography: Pirata One for headings; DM Sans for interface text

## Folder structure

```text
Task-3-Coffee-Rating-Application/
├── .gitignore
├── README.md
├── requirements.txt
├── backend/
│   └── app.py
└── frontend/
    ├── index.html
    ├── script.js
    └── style.css
```

The SQLite file is generated at `backend/database.db` on first run and is intentionally ignored by Git so each installation gets its own persistent local vote data.

## Installation and run

From a terminal, enter the Task 3 folder:

```bash
cd Task-3-Coffee-Rating-Application
python -m venv .venv
```

Activate the virtual environment:

**Windows PowerShell**

```powershell
.\.venv\Scripts\Activate.ps1
```

**macOS / Linux**

```bash
source .venv/bin/activate
```

Install dependencies and start Flask:

```bash
python -m pip install -r requirements.txt
python backend/app.py
```

Open [http://127.0.0.1:5000](http://127.0.0.1:5000). The database and initial collection are prepared automatically. To use another local database file, set `COFFEE_DATABASE_PATH` before starting the app.

## API

### `GET /api/coffees`

Returns all coffee records ordered by ID, including current SQLite vote totals.

### `POST /api/coffees/<id>/vote`

Send an empty JSON object (`{}`) to add one vote. The response includes the coffee ID and its updated database vote count. Unknown IDs return `404`; non-JSON requests return `415`; database failures return `500` with a user-safe error message.

## How the frontend, backend, and database communicate

The Flask server serves the frontend and API from the same origin. On page load, JavaScript calls `GET /api/coffees`; Flask reads the rows and vote counts from SQLite and returns JSON for the cards. When a visitor votes, JavaScript sends `POST /api/coffees/<id>/vote`. Flask updates only that row using a parameterized SQL query and returns the new vote count. JavaScript displays that returned value immediately. Reloading the page requests the database values again, so totals persist without browser-side or hardcoded vote data.
