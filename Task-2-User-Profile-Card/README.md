# User Profile Card Generator

Create a polished, responsive portfolio identity card from a name, short bio, and profile image URL. The frontend submits the details to Flask, and renders the profile data returned by the API. Nothing is stored on the server.

## Features

- Responsive profile form and premium card preview.
- Profile data is validated by the Flask JSON API before display.
- The generated name, bio, and image URL come from the actual POST response.
- Loading, field validation, success, and connection error feedback.
- A monogram avatar appears if the submitted image cannot load.
- The card entrance animation and visual layout adapt to desktop and mobile screens.

## Technologies

- HTML5, CSS3, JavaScript
- Python and Flask

## Folder structure

```text
Task-2-User-Profile-Card/
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

## API

### `POST /api/profile`

Accepts a JSON object with all three fields:

```json
{
  "name": "Maya Chen",
  "bio": "Product designer making thoughtful digital experiences.",
  "image_url": "https://example.com/maya.jpg"
}
```

Successful response (`201 Created`):

```json
{
  "profile": {
    "name": "Maya Chen",
    "bio": "Product designer making thoughtful digital experiences.",
    "image_url": "https://example.com/maya.jpg",
    "initials": "MC"
  }
}
```

The API trims the text, checks required fields and limits, and accepts only HTTP or HTTPS image URLs. Invalid data returns `400` with a field-error map; non-JSON requests return `415`.

## Run locally

Install Python 3.9 or newer, then open a terminal in this project folder and run:

```bash
python -m venv .venv
```

Activate the environment:

**Windows PowerShell**

```powershell
.\.venv\Scripts\Activate.ps1
```

**macOS / Linux**

```bash
source .venv/bin/activate
```

Install Flask and start the server:

```bash
python -m pip install -r requirements.txt
python backend/app.py
```

Open [http://127.0.0.1:5000](http://127.0.0.1:5000) in a browser.

## How the frontend and backend communicate

The same Flask server serves the frontend and API, so browser requests stay same-origin. On submission, JavaScript sends the form values as JSON to `POST /api/profile`. Flask validates and formats the profile and returns JSON. The page reads the response and builds the card from `profile.name`, `profile.bio`, and `profile.image_url`. If that image cannot be loaded, the card shows initials derived from the returned name.
