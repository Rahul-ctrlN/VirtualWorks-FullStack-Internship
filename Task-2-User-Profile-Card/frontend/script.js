const form = document.querySelector("#profile-form");
const nameInput = document.querySelector("#name");
const bioInput = document.querySelector("#bio");
const imageInput = document.querySelector("#image-url");
const bioCount = document.querySelector("#bio-count");
const submitButton = document.querySelector("#submit-button");
const submitLabel = submitButton.querySelector(".submit-label");
const formMessage = document.querySelector("#form-message");
const profileCard = document.querySelector("#profile-card");
const previewEmpty = document.querySelector("#preview-empty");
const profileImage = document.querySelector("#profile-image");
const profileFallback = document.querySelector("#profile-fallback");

const fieldErrors = {
  name: document.querySelector("#name-error"),
  bio: document.querySelector("#bio-error"),
  image_url: document.querySelector("#image-url-error"),
};

function clearErrors() {
  Object.values(fieldErrors).forEach((element) => {
    element.textContent = "";
    element.hidden = true;
  });
  [nameInput, bioInput, imageInput].forEach((input) => input.removeAttribute("aria-invalid"));
}

function showErrors(fields = {}) {
  clearErrors();
  Object.entries(fields).forEach(([field, text]) => {
    const errorElement = fieldErrors[field];
    const input = { name: nameInput, bio: bioInput, image_url: imageInput }[field];
    if (!errorElement || !input) return;
    errorElement.textContent = text;
    errorElement.hidden = false;
    input.setAttribute("aria-invalid", "true");
  });
}

function showMessage(text, type) {
  formMessage.textContent = text;
  formMessage.className = `form-message ${type}`;
  formMessage.hidden = false;
}

function initialsFor(name) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function displayProfile(profile) {
  document.querySelector("#profile-name").textContent = profile.name;
  document.querySelector("#profile-bio").textContent = profile.bio;
  document.querySelector("#profile-initials").textContent = profile.initials || initialsFor(profile.name);

  profileImage.onload = () => {
    profileImage.hidden = false;
    profileFallback.hidden = true;
  };
  profileImage.onerror = () => {
    profileImage.hidden = true;
    profileFallback.hidden = false;
  };
  profileImage.src = profile.image_url;
  profileCard.hidden = false;
  profileCard.classList.remove("card-enter");
  requestAnimationFrame(() => profileCard.classList.add("card-enter"));
  previewEmpty.hidden = true;
}

bioInput.addEventListener("input", () => {
  bioCount.textContent = `${bioInput.value.length} / 280`;
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearErrors();
  formMessage.hidden = true;

  const profileInput = {
    name: nameInput.value.trim(),
    bio: bioInput.value.trim(),
    image_url: imageInput.value.trim(),
  };
  const clientErrors = {};
  if (!profileInput.name) clientErrors.name = "Enter a name.";
  if (!profileInput.bio) clientErrors.bio = "Enter a short bio.";
  if (!profileInput.image_url) clientErrors.image_url = "Enter an image URL.";
  if (Object.keys(clientErrors).length) {
    showErrors(clientErrors);
    showMessage("Please complete each field before generating your card.", "error");
    return;
  }

  submitButton.disabled = true;
  submitButton.setAttribute("aria-busy", "true");
  submitLabel.textContent = "Creating your card…";
  try {
    const response = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(profileInput),
    });
    const payload = await response.json();
    if (!response.ok) {
      showErrors(payload.fields || {});
      throw new Error(payload.error || "Your profile could not be generated.");
    }

    displayProfile(payload.profile);
    showMessage("Your profile card is ready.", "success");
  } catch (error) {
    showMessage(error.message || "Could not connect to the server. Please try again.", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.removeAttribute("aria-busy");
    submitLabel.textContent = "Generate my profile";
  }
});
