const coffeeGrid = document.querySelector("#coffee-grid");
const loadingState = document.querySelector("#loading-state");
const errorState = document.querySelector("#error-state");
const errorMessage = document.querySelector("#error-message");
const emptyState = document.querySelector("#empty-state");
const collectionCount = document.querySelector("#collection-count");
const retryButton = document.querySelector("#retry-button");

function makeElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function makeCoffeeCard(coffee, position) {
  const card = makeElement("article", "coffee-card");
  const imageArea = makeElement("div", "coffee-image-wrap");
  const imageFallback = makeElement("div", "coffee-image-fallback");
  imageFallback.hidden = true;
  imageFallback.setAttribute("aria-hidden", "true");
  const fallbackCup = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  fallbackCup.setAttribute("viewBox", "0 0 64 64");
  fallbackCup.setAttribute("fill", "none");
  fallbackCup.innerHTML = '<path d="M14 23h31v17a12 12 0 0 1-12 12h-7a12 12 0 0 1-12-12V23Z" stroke="currentColor" stroke-width="2"/><path d="M45 27h4a7 7 0 0 1 0 14h-5M10 55h43M20 13c-2 3 2 4 0 7m10-8c-2 3 2 4 0 7m10-8c-2 3 2 4 0 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
  imageFallback.append(fallbackCup);

  const image = makeElement("img", "coffee-image");
  image.src = coffee.image_url;
  image.alt = `${coffee.name}, a freshly prepared coffee`;
  image.loading = "lazy";
  image.decoding = "async";
  image.addEventListener("error", () => {
    image.hidden = true;
    imageFallback.hidden = false;
    imageArea.classList.add("has-fallback");
  }, { once: true });

  const photoShade = makeElement("span", "photo-shade");
  photoShade.setAttribute("aria-hidden", "true");
  const imageLabel = makeElement("span", "image-label", `NO. ${String(position).padStart(2, "0")} · THE DAILY POUR`);
  imageArea.append(image, imageFallback, photoShade, imageLabel);

  const cardBody = makeElement("div", "coffee-card-body");
  const heading = makeElement("h3", "coffee-name", coffee.name);
  const description = makeElement("p", "coffee-description", coffee.description);
  const cardMeta = makeElement("div", "coffee-card-meta");
  const voteLabel = makeElement("span", "vote-label", "COMMUNITY FAVORITE");
  const voteTotal = makeElement("span", "vote-total");
  voteTotal.setAttribute("aria-label", `${coffee.vote_count} votes`);
  voteTotal.dataset.voteCount = String(coffee.vote_count);
  const countNumber = makeElement("strong", "vote-number", String(coffee.vote_count));
  const countWord = makeElement("span", "vote-word", "votes");
  voteTotal.append(countNumber, countWord);
  cardMeta.append(voteLabel, voteTotal);

  const voteButton = makeElement("button", "vote-button");
  voteButton.type = "button";
  voteButton.setAttribute("aria-label", `Vote for ${coffee.name}`);
  const buttonText = makeElement("span", "vote-button-label", "Vote for this coffee");
  const arrow = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  arrow.setAttribute("viewBox", "0 0 20 20");
  arrow.setAttribute("fill", "none");
  arrow.setAttribute("aria-hidden", "true");
  arrow.innerHTML = '<path d="M4 10h12m-5-5 5 5-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>';
  voteButton.append(buttonText, arrow);

  const voteFeedback = makeElement("p", "vote-feedback");
  voteFeedback.setAttribute("role", "status");
  voteFeedback.setAttribute("aria-live", "polite");
  voteFeedback.hidden = true;
  voteButton.addEventListener("click", () => submitVote(coffee.id, voteButton, buttonText, voteTotal, countNumber, voteFeedback));

  cardBody.append(heading, description, cardMeta, voteButton, voteFeedback);
  card.append(imageArea, cardBody);
  return card;
}

async function loadCoffees() {
  loadingState.hidden = false;
  errorState.hidden = true;
  emptyState.hidden = true;
  collectionCount.hidden = true;
  coffeeGrid.replaceChildren();
  coffeeGrid.setAttribute("aria-busy", "true");

  try {
    const response = await fetch("/api/coffees", { headers: { Accept: "application/json" } });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "The coffee collection could not be loaded.");
    if (!payload || !Array.isArray(payload.coffees)) throw new Error("The server returned an unexpected coffee list.");

    loadingState.hidden = true;
    if (payload.coffees.length === 0) {
      emptyState.hidden = false;
      return;
    }
    collectionCount.textContent = `${String(payload.coffees.length).padStart(2, "0")} COFFEES`;
    collectionCount.hidden = false;
    payload.coffees.forEach((coffee, index) => coffeeGrid.append(makeCoffeeCard(coffee, index + 1)));
  } catch (error) {
    loadingState.hidden = true;
    errorMessage.textContent = error.message || "We couldn’t load the collection. Please try again.";
    errorState.hidden = false;
  } finally {
    coffeeGrid.setAttribute("aria-busy", "false");
  }
}

async function submitVote(coffeeId, button, buttonText, voteTotal, countNumber, feedback) {
  if (button.disabled) return;
  feedback.hidden = true;
  feedback.classList.remove("vote-error");
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  buttonText.textContent = "Adding your vote…";

  try {
    const response = await fetch(`/api/coffees/${encodeURIComponent(coffeeId)}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({}),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Your vote couldn’t be saved. Please try again.");
    if (payload.id !== coffeeId || !Number.isInteger(payload.vote_count) || payload.vote_count < 1) {
      throw new Error("The server returned an invalid vote count. Please refresh and try again.");
    }

    countNumber.textContent = String(payload.vote_count);
    voteTotal.dataset.voteCount = String(payload.vote_count);
    voteTotal.setAttribute("aria-label", `${payload.vote_count} votes`);
    feedback.textContent = `Your vote for ${button.getAttribute("aria-label").replace("Vote for ", "")} is in. Thank you!`;
    feedback.hidden = false;
    button.classList.add("vote-saved");
  } catch (error) {
    feedback.textContent = error.message || "We couldn’t reach the coffeehouse. Please try again.";
    feedback.classList.add("vote-error");
    feedback.hidden = false;
  } finally {
    button.disabled = false;
    button.removeAttribute("aria-busy");
    buttonText.textContent = "Vote for this coffee";
    window.setTimeout(() => {
      button.classList.remove("vote-saved");
      feedback.classList.remove("vote-error");
    }, 1800);
  }
}

retryButton.addEventListener("click", loadCoffees);
loadCoffees();
