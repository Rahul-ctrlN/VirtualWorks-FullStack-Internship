"""Flask API and frontend server for the User Profile Card Generator."""

import os
from pathlib import Path
from urllib.parse import urlparse

from flask import Flask, jsonify, request, send_from_directory

PROJECT_DIR = Path(__file__).resolve().parents[1]
FRONTEND_DIR = PROJECT_DIR / "frontend"


def create_app(test_config=None):
    app = Flask(__name__)
    app.config.from_mapping(MAX_CONTENT_LENGTH=32 * 1024)
    if test_config:
        app.config.update(test_config)

    @app.get("/")
    def index():
        return send_from_directory(FRONTEND_DIR, "index.html")

    @app.get("/<path:filename>")
    def frontend_asset(filename):
        return send_from_directory(FRONTEND_DIR, filename)

    @app.post("/api/profile")
    def create_profile():
        if not request.is_json:
            return jsonify({"error": "Send profile details as JSON."}), 415

        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            return jsonify({"error": "The request body must be a JSON object."}), 400

        name = payload.get("name")
        bio = payload.get("bio")
        image_url = payload.get("image_url")

        errors = {}
        if not isinstance(name, str) or not name.strip():
            errors["name"] = "Enter a name."
        elif len(name.strip()) > 80:
            errors["name"] = "Name must be 80 characters or fewer."

        if not isinstance(bio, str) or not bio.strip():
            errors["bio"] = "Enter a short bio."
        elif len(bio.strip()) > 280:
            errors["bio"] = "Bio must be 280 characters or fewer."

        if not isinstance(image_url, str) or not image_url.strip():
            errors["image_url"] = "Enter an image URL."
        else:
            parsed_url = urlparse(image_url.strip())
            if parsed_url.scheme not in ("http", "https") or not parsed_url.netloc:
                errors["image_url"] = "Use a valid HTTP or HTTPS image URL."
            elif len(image_url.strip()) > 2_048:
                errors["image_url"] = "Image URL must be 2,048 characters or fewer."

        if errors:
            return jsonify({"error": "Please check the highlighted profile details.", "fields": errors}), 400

        clean_name = name.strip()
        initials = "".join(part[0] for part in clean_name.split()[:2]).upper()
        profile = {
            "name": clean_name,
            "bio": bio.strip(),
            "image_url": image_url.strip(),
            "initials": initials,
        }
        return jsonify({"profile": profile}), 201

    @app.errorhandler(413)
    def request_too_large(_error):
        return jsonify({"error": "The submitted profile is too large."}), 413

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.environ.get("PORT", "5000")), debug=False)
