const form = document.querySelector("#note-form");
const textarea = document.querySelector("#note-content");
const saveButton = document.querySelector("#save-button");
const buttonLabel = saveButton.querySelector(".button-label");
const characterCount = document.querySelector("#character-count");
const message = document.querySelector("#message");
const notesList = document.querySelector("#notes-list");
const noteTotal = document.querySelector("#note-total");
const emptyState = document.querySelector("#empty-state");

function showMessage(text, type) {
  message.textContent = text;
  message.className = `message ${type}`;
  message.hidden = false;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function makeNoteCard(note) {
  const card = document.createElement("article");
  card.className = "note-card";

  const content = document.createElement("p");
  content.className = "note-content";
  content.textContent = note.content;

  const meta = document.createElement("div");
  meta.className = "note-meta";
  const date = document.createElement("time");
  date.dateTime = note.created_at;
  date.textContent = formatDate(note.created_at);
  const badge = document.createElement("span");
  badge.className = "note-badge";
  badge.textContent = "Saved note";

  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-button";
  deleteButton.type = "button";
  deleteButton.textContent = "Delete";
  deleteButton.setAttribute("aria-label", "Delete note");
  deleteButton.addEventListener("click", () => deleteNote(note, card, deleteButton));

  meta.append(date, badge, deleteButton);
  card.append(content, meta);
  return card;
}

async function deleteNote(note, card, button) {
  const confirmed = window.confirm("Delete this note? This action cannot be undone.");
  if (!confirmed) return;

  button.disabled = true;
  button.textContent = "Deleting…";
  message.hidden = true;
  try {
    const response = await fetch(`/api/notes/${encodeURIComponent(note.id)}`, {
      method: "DELETE",
      headers: { Accept: "application/json" },
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Your note could not be deleted.");

    card.remove();
    const remaining = notesList.children.length;
    noteTotal.textContent = String(remaining);
    emptyState.hidden = remaining > 0;
    notesList.hidden = remaining === 0;
    showMessage("Your note was deleted.", "success");
  } catch (error) {
    button.disabled = false;
    button.textContent = "Delete";
    showMessage(error.message || "Could not connect to the server. Please try again.", "error");
  }
}

function renderNotes(notes) {
  notesList.replaceChildren(...notes.map(makeNoteCard));
  noteTotal.textContent = String(notes.length);
  emptyState.hidden = notes.length > 0;
  notesList.hidden = notes.length === 0;
}

async function loadNotes() {
  notesList.setAttribute("aria-busy", "true");
  try {
    const response = await fetch("/api/notes", { headers: { Accept: "application/json" } });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Notes could not be loaded.");
    renderNotes(payload.notes);
  } catch (error) {
    notesList.hidden = true;
    emptyState.hidden = true;
    showMessage(error.message || "Could not connect to the server. Please refresh to try again.", "error");
  } finally {
    notesList.setAttribute("aria-busy", "false");
  }
}

textarea.addEventListener("input", () => {
  characterCount.textContent = `${textarea.value.length.toLocaleString()} / 10,000`;
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const content = textarea.value.trim();
  if (!content) {
    showMessage("Write a note before saving.", "error");
    textarea.focus();
    return;
  }

  saveButton.disabled = true;
  buttonLabel.textContent = "Saving…";
  message.hidden = true;
  try {
    const response = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ content }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Your note could not be saved.");

    textarea.value = "";
    characterCount.textContent = "0 / 10,000";
    showMessage("Your note is saved. It will be here when you return.", "success");
    await loadNotes();
    textarea.focus();
  } catch (error) {
    showMessage(error.message || "Could not connect to the server. Please try again.", "error");
  } finally {
    saveButton.disabled = false;
    buttonLabel.textContent = "Save note";
  }
});

loadNotes();
