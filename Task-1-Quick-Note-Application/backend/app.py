"""Flask API and static frontend for the Quick Note Application."""

import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory

PROJECT_DIR = Path(__file__).resolve().parents[1]
FRONTEND_DIR = PROJECT_DIR / "frontend"
DEFAULT_DATABASE = Path(__file__).resolve().parent / "database.db"


def create_app(test_config=None):
    app = Flask(__name__)
    app.config.from_mapping(
        DATABASE=os.environ.get("QUICK_NOTES_DATABASE", str(DEFAULT_DATABASE)),
        MAX_CONTENT_LENGTH=64 * 1024,
        MAX_NOTE_LENGTH=10_000,
    )
    if test_config:
        app.config.update(test_config)

    @contextmanager
    def get_db():
        connection = sqlite3.connect(app.config["DATABASE"])
        connection.row_factory = sqlite3.Row
        try:
            yield connection
        except Exception:
            connection.rollback()
            raise
        else:
            connection.commit()
        finally:
            connection.close()

    def initialize_database():
        database_path = Path(app.config["DATABASE"])
        database_path.parent.mkdir(parents=True, exist_ok=True)
        with get_db() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS notes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    content TEXT NOT NULL,
                    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
                )
                """
            )

    initialize_database()

    @app.get("/")
    def index():
        return send_from_directory(FRONTEND_DIR, "index.html")

    @app.get("/<path:filename>")
    def frontend_asset(filename):
        return send_from_directory(FRONTEND_DIR, filename)

    @app.get("/api/notes")
    def list_notes():
        try:
            with get_db() as connection:
                rows = connection.execute(
                    "SELECT id, content, created_at FROM notes ORDER BY id DESC"
                ).fetchall()
            return jsonify({"notes": [dict(row) for row in rows]})
        except sqlite3.Error:
            app.logger.exception("Unable to retrieve notes")
            return jsonify({"error": "Notes could not be loaded. Please try again."}), 500

    @app.post("/api/notes")
    def create_note():
        if not request.is_json:
            return jsonify({"error": "Send the note as JSON."}), 415

        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            return jsonify({"error": "The request body must be a JSON object."}), 400

        content = payload.get("content")
        if not isinstance(content, str) or not content.strip():
            return jsonify({"error": "Write a note before saving."}), 400
        content = content.strip()
        if len(content) > app.config["MAX_NOTE_LENGTH"]:
            return jsonify(
                {"error": f"Notes must be {app.config['MAX_NOTE_LENGTH']:,} characters or fewer."}
            ), 400

        try:
            with get_db() as connection:
                cursor = connection.execute(
                    "INSERT INTO notes (content) VALUES (?)", (content,)
                )
                row = connection.execute(
                    "SELECT id, content, created_at FROM notes WHERE id = ?",
                    (cursor.lastrowid,),
                ).fetchone()
            return jsonify({"note": dict(row)}), 201
        except sqlite3.Error:
            app.logger.exception("Unable to save note")
            return jsonify({"error": "Your note could not be saved. Please try again."}), 500

    @app.errorhandler(413)
    def request_too_large(_error):
        return jsonify({"error": "The request is too large."}), 413

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.environ.get("PORT", "5000")), debug=False)
