const container = document.getElementById("statusContainer");
const searchInput = document.getElementById("searchInput");

let allStatus = [];
let rankedStatus = [];
let images = [];

const CARD_HEIGHT = 260;
const BUFFER = 5;

let scrollIndex = 0;

/* INIT */
async function init() {
  await loadAllStatus();
  await loadImages();
  rankedStatus = [];
  createSpacer(100000); // virtually infinite height
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

/* Virtual Infinite Height */
function createSpacer(size) {
  container.innerHTML = "";
  const spacer = document.createElement("div");
  spacer.className = "spacer";
  spacer.style.height = size + "px";
  container.appendChild(spacer);
}

/* Get Status by Index (endless) */
function getStatusByIndex(i) {
  if (rankedStatus.length && i < rankedStatus.length) {
    return rankedStatus[i];
  }

  const randomIndex = Math.floor(Math.random() * allStatus.length);
  return allStatus[randomIndex];
}

/* Render */
function renderVisible() {
  const scrollTop = window.scrollY - 120;
  const viewportHeight = window.innerHeight;

  const start = Math.max(0, Math.floor(scrollTop / CARD_HEIGHT) - BUFFER);
  const end = Math.floor((scrollTop + viewportHeight) / CARD_HEIGHT) + BUFFER;

  document.querySelectorAll(".card").forEach(el => el.remove());

  for (let i = start; i <= end; i++) {
    const status = getStatusByIndex(i);
    const card = createCard(status, i);
    card.style.top = i * CARD_HEIGHT + "px";
    container.appendChild(card);
  }
}

window.addEventListener("scroll", renderVisible);

/* Create Card */
function createCard(status, index) {
  const card = document.createElement("div");
  card.className = "card";

  const bg = document.createElement("div");
  bg.className = "card-bg";
  bg.style.backgroundImage =
    `url(assets/images/${images[index % images.length]})`;

  const content = document.createElement("div");
  content.className = "card-content";

  const text = document.createElement("div");
  text.className = "card-text";
  text.innerHTML = highlightText(status.text);

  const buttons = document.createElement("div");
  buttons.className = "card-buttons";

  const copyBtn = document.createElement("button");
  copyBtn.innerHTML = "📋 Copy";
  copyBtn.onclick = () => copyText(status.text, copyBtn);

  const linkBtn = document.createElement("button");
  linkBtn.innerHTML = "🔗 Link Share";
  linkBtn.onclick = () => shareLink(status.id);

  const imgBtn = document.createElement("button");
  imgBtn.innerHTML = "🖼️ Share With Img";
  imgBtn.onclick = () => shareImage(card);

  buttons.append(copyBtn, linkBtn, imgBtn);

  content.append(text);
  card.append(bg, content, buttons);

  return card;
}

/* Search Ranking */
searchInput.addEventListener("input", debounce(e => {
  const term = e.target.value.trim().toLowerCase();

  if (!term) {
    rankedStatus = [];
  } else {
    rankedStatus = allStatus
      .map(s => ({
        ...s,
        score: (s.text.toLowerCase().match(new RegExp(term, "g")) || []).length
      }))
      .filter(s => s.score > 0)
      .sort((a,b) => b.score - a.score);
  }

  window.scrollTo(0,0);
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
  btn.innerHTML = "✅ Copied";
  setTimeout(() => btn.innerHTML = "📋 Copy", 1500);
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
