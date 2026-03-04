const container = document.getElementById("statusContainer");
const searchInput = document.getElementById("searchInput");

let allStatus = [];
let filteredStatus = [];
let images = [];

const CARD_HEIGHT = 260;
const BUFFER = 5;

let visibleStart = 0;
let visibleEnd = 0;

/* INIT */
async function init() {
  await loadAllStatus();
  await loadImages();
  filteredStatus = [...allStatus];
  createSpacer();
  renderVisible();
}

async function loadAllStatus() {
  const pagesRes = await fetch("data/pages.json");
  const pages = await pagesRes.json();

  let combined = [];

  for (const page of pages) {
    const res = await fetch(`data/${page}`);
    const data = await res.json();
    combined = combined.concat(data);
  }

  allStatus = combined;
}

async function loadImages() {
  const res = await fetch("assets/images/images.json");
  images = await res.json();
}

/* Spacer for full height */
function createSpacer() {
  container.innerHTML = "";
  const spacer = document.createElement("div");
  spacer.className = "spacer";
  spacer.style.height = filteredStatus.length * CARD_HEIGHT + "px";
  container.appendChild(spacer);
}

/* Virtual Render */
function renderVisible() {
  const scrollTop = window.scrollY - 120;
  const viewportHeight = window.innerHeight;

  visibleStart = Math.max(0, Math.floor(scrollTop / CARD_HEIGHT) - BUFFER);
  visibleEnd = Math.min(
    filteredStatus.length,
    Math.ceil((scrollTop + viewportHeight) / CARD_HEIGHT) + BUFFER
  );

  document.querySelectorAll(".card").forEach(el => el.remove());

  for (let i = visibleStart; i < visibleEnd; i++) {
    const card = createCard(filteredStatus[i], i);
    card.style.top = i * CARD_HEIGHT + "px";
    container.appendChild(card);
  }
}

/* Create Card */
function createCard(status, index) {
  const card = document.createElement("div");
  card.className = "card";

  const bg = document.createElement("div");
  bg.className = "card-bg";
  bg.style.backgroundImage = `url(assets/images/${images[index % images.length]})`;

  const content = document.createElement("div");
  content.className = "card-content";

  const text = document.createElement("div");
  text.className = "card-text";
  text.innerHTML = highlightText(status.text);

  const buttons = document.createElement("div");
  buttons.className = "card-buttons";

  const copyBtn = document.createElement("button");
  copyBtn.textContent = "Copy";
  copyBtn.onclick = () => copyText(status.text, copyBtn);

  const linkBtn = document.createElement("button");
  linkBtn.textContent = "Link";
  linkBtn.onclick = () => shareLink(status.id);

  const imgBtn = document.createElement("button");
  imgBtn.textContent = "Image";
  imgBtn.onclick = () => shareImage(card);

  buttons.append(copyBtn, linkBtn, imgBtn);

  content.append(text);
  card.append(bg, content, buttons);

  return card;
}

/* Scroll */
window.addEventListener("scroll", renderVisible);

/* Search */
searchInput.addEventListener("input", debounce(e => {
  const term = e.target.value.trim();

  if (!term) {
    filteredStatus = [...allStatus];
  } else {
    const result = allStatus.filter(s =>
      s.text.toLowerCase().includes(term.toLowerCase())
    );
    filteredStatus = result.length ? result : [...allStatus];
  }

  createSpacer();
  renderVisible();
}, 350));

function highlightText(text) {
  const term = searchInput.value.trim();
  if (!term) return text;
  const regex = new RegExp(`(${term})`, "gi");
  return text.replace(regex, '<span class="highlight">$1</span>');
}

/* Utils */
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function copyText(text, btn) {
  navigator.clipboard.writeText(text);
  btn.textContent = "Copied";
  setTimeout(() => btn.textContent = "Copy", 1500);
}

function shareLink(id) {
  const url = `${window.location.origin}${window.location.pathname}?id=${id}`;
  if (navigator.share) navigator.share({ url });
  else alert(url);
}

async function shareImage(card) {
  const clone = card.cloneNode(true);
  clone.querySelector(".card-buttons").remove();
  document.body.appendChild(clone);
  const canvas = await html2canvas(clone);
  document.body.removeChild(clone);

  canvas.toBlob(async blob => {
    const file = new File([blob], "status.png", { type: "image/png" });
    if (navigator.share) await navigator.share({ files: [file] });
  });
}

init();
