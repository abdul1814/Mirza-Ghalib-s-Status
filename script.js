const container = document.getElementById("statusContainer");
const searchInput = document.getElementById("searchInput");
const loadingDiv = document.getElementById("loading");

let allStatus = [];
let rankedStatus = [];
let images = [];

let batchSize = 6;
let currentIndex = 0;
let loading = false;

/* INIT */
async function init() {
  await loadAllStatus();
  await loadImages();
  renderBatch();
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

/* Scroll detection */
window.addEventListener("scroll", () => {
  if (loading) return;

  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
    renderBatch();
  }
});

/* Render Batch */
function renderBatch() {
  loading = true;
  loadingDiv.style.display = "block";

  setTimeout(() => {
    for (let i = 0; i < batchSize; i++) {
      const status = getNextStatus();
      const card = createCard(status);
      container.appendChild(card);
    }

    limitDOM();
    loadingDiv.style.display = "none";
    loading = false;
  }, 500);
}

/* Get Next Status */
function getNextStatus() {
  if (rankedStatus.length > 0 && currentIndex < rankedStatus.length) {
    return rankedStatus[currentIndex++];
  }

  if (currentIndex >= allStatus.length) {
    currentIndex = 0;
    shuffle(allStatus);
  }

  return allStatus[currentIndex++];
}

/* Create Card */
function createCard(status) {
  const card = document.createElement("div");
  card.className = "card";

  const bg = document.createElement("div");
  bg.className = "card-bg";
  bg.style.backgroundImage =
    `url(assets/images/${images[Math.floor(Math.random()*images.length)]})`;

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

/* Search */
searchInput.addEventListener("input", debounce(e => {
  const term = e.target.value.trim().toLowerCase();

  currentIndex = 0;
  container.innerHTML = "";

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

  renderBatch();
}, 350));

function highlightText(text) {
  const term = searchInput.value.trim();
  if (!term) return text;
  const regex = new RegExp(`(${term})`, "gi");
  return text.replace(regex, '<span class="highlight">$1</span>');
}

/* Utils */
function limitDOM() {
  const maxCards = 30;
  while (container.children.length > maxCards) {
    container.removeChild(container.firstChild);
  }
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
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
