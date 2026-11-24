"""Flask API and frontend server for the Coffee Rating Application."""

import logging
import os
import sqlite3
from contextlib import closing
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory

PROJECT_DIR = Path(__file__).resolve().parents[1]
FRONTEND_DIR = PROJECT_DIR / "frontend"
DATABASE_PATH = Path(__file__).resolve().parent / "database.db"

INITIAL_COFFEES = [
    {
        "name": "Caramel Latte",
        "description": "Silky espresso, steamed milk, and a ribbon of buttery caramel.",
        "image_url": "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=1000&h=700&fit=crop&auto=format&q=85",
    },
    {
        "name": "Cappuccino",
        "description": "A beautifully balanced pour with rich espresso and cloud-soft foam.",
        "image_url": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=1000&h=700&fit=crop&auto=format&q=85",
    },
    {
        "name": "Spanish Latte",
        "description": "Bold coffee softened with sweet milk for a mellow, generous finish.",
        "image_url": "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=1000&h=700&fit=crop&auto=format&q=85",
    },
    {
        "name": "Mocha",
        "description": "Dark chocolate meets espresso in a smooth, indulgent classic.",
        "image_url": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1000&h=700&fit=crop&auto=format&q=85",
    },
    {
        "name": "Cold Brew",
        "description": "Slow-steeped for hours: mellow, refreshing, and quietly complex.",
        "image_url": "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=1000&h=700&fit=crop&auto=format&q=85",
    },
    {
        "name": "Vanilla Latte",
        "description": "A soft note of vanilla folded into espresso and velvety milk.",
        "image_url": "https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=1000&h=700&fit=crop&auto=format&q=85",
    },
]


def connect_database(database_path):
    """Return a row-aware SQLite connection with a short lock timeout."""
    connection = sqlite3.connect(database_path, timeout=5)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database(database_path):
    """Create the schema and seed the collection once, without resetting votes."""
    database_path = Path(database_path)
    database_path.parent.mkdir(parents=True, exist_ok=True)
    connection = connect_database(database_path)
    try:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS coffees (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                description TEXT NOT NULL,
                image_url TEXT NOT NULL,
                vote_count INTEGER NOT NULL DEFAULT 0 CHECK (vote_count >= 0)
            )
            """
        )
        existing = connection.execute("SELECT COUNT(*) FROM coffees").fetchone()[0]
        if existing == 0:
            connection.executemany(
                "INSERT INTO coffees (name, description, image_url, vote_count) VALUES (?, ?, ?, 0)",
                [(item["name"], item["description"], item["image_url"]) for item in INITIAL_COFFEES],
            )
        connection.commit()
    except sqlite3.Error:
        connection.rollback()
        raise
    finally:
        connection.close()


def create_app(test_config=None):
    app = Flask(__name__)
    app.config.from_mapping(
        DATABASE=os.environ.get("COFFEE_DATABASE_PATH", str(DATABASE_PATH)),
        MAX_CONTENT_LENGTH=8 * 1024,
    )
    if test_config:
        app.config.update(test_config)

    try:
        initialize_database(app.config["DATABASE"])
    except sqlite3.Error:
        # Keep the frontend available so it can display its API error state.
        app.logger.exception("Could not initialize the coffee database")

    @app.get("/")
    def index():
        return send_from_directory(FRONTEND_DIR, "index.html")

    @app.get("/favicon.ico")
    def favicon():
        return "", 204

    @app.get("/<path:filename>")
    def frontend_asset(filename):
        return send_from_directory(FRONTEND_DIR, filename)

    @app.get("/api/coffees")
    def list_coffees():
        try:
            with closing(connect_database(app.config["DATABASE"])) as connection:
                rows = connection.execute(
                    "SELECT id, name, description, image_url, vote_count FROM coffees ORDER BY id"
                ).fetchall()
            return jsonify({"coffees": [dict(row) for row in rows]}), 200
        except sqlite3.Error:
            app.logger.exception("Could not retrieve the coffee collection")
            return jsonify({"error": "The coffee collection is unavailable. Please try again."}), 500

    @app.post("/api/coffees/<int:coffee_id>/vote")
    def vote_for_coffee(coffee_id):
        if not request.is_json:
            return jsonify({"error": "Send the vote request as JSON."}), 415
        payload = request.get_json(silent=True)
        if payload not in ({}, None):
            return jsonify({"error": "This vote endpoint does not accept profile data."}), 400

        try:
            with closing(connect_database(app.config["DATABASE"])) as connection:
                connection.execute("BEGIN IMMEDIATE")
                update = connection.execute(
                    "UPDATE coffees SET vote_count = vote_count + 1 WHERE id = ?",
                    (coffee_id,),
                )
                if update.rowcount != 1:
                    connection.rollback()
                    return jsonify({"error": "That coffee could not be found."}), 404
                row = connection.execute(
                    "SELECT id, vote_count FROM coffees WHERE id = ?", (coffee_id,)
                ).fetchone()
                connection.commit()
            return jsonify({"id": row["id"], "vote_count": row["vote_count"]}), 200
        except sqlite3.Error:
            app.logger.exception("Could not record vote for coffee %s", coffee_id)
            return jsonify({"error": "Your vote could not be saved. Please try again."}), 500

    @app.errorhandler(413)
    def request_too_large(_error):
        return jsonify({"error": "The vote request is too large."}), 413

    @app.errorhandler(500)
    def internal_error(_error):
        return jsonify({"error": "Something went wrong. Please try again."}), 500

    return app


app = create_app()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    app.run(host="127.0.0.1", port=int(os.environ.get("PORT", "5000")), debug=False)
