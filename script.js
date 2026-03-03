const container = document.getElementById("statusContainer");
const loading = document.getElementById("loading");
const searchInput = document.getElementById("searchInput");

let allStatus = [];
let filteredStatus = [];
let images = [];
let batchSize = 6;
let currentIndex = 0;
let searchTerm = "";
let loadingData = false;

/* Fetch Data */
async function init() {
  const statusRes = await fetch("data/status.json");
  const imageRes = await fetch("assets/images/images.json");

  allStatus = await statusRes.json();
  images = await imageRes.json();
  filteredStatus = [...allStatus];

  handleSharedLink();
  renderBatch();
}

function handleSharedLink() {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get("id"));
  if (id) {
    const index = allStatus.findIndex(s => s.id === id);
    if (index !== -1) {
      const item = allStatus.splice(index, 1)[0];
      allStatus.unshift(item);
      filteredStatus = [...allStatus];
    }
  }
}

function renderBatch() {
  if (loadingData) return;
  loadingData = true;
  loading.style.display = "block";

  setTimeout(() => {
    for (let i = 0; i < batchSize; i++) {
      if (currentIndex >= filteredStatus.length) {
        currentIndex = 0;
        shuffleArray(filteredStatus);
      }

      const status = filteredStatus[currentIndex];
      container.appendChild(createCard(status, currentIndex));
      currentIndex++;
    }

    optimizeDOM();
    loading.style.display = "none";
    loadingData = false;
  }, 300);
}

function createCard(status, index) {
  const card = document.createElement("div");
  card.className = "card";
  card.style.background = `url(assets/images/${images[index % images.length]}) center/cover`;

  const overlay = document.createElement("div");
  overlay.className = "overlay";

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
  linkBtn.textContent = "Link Share";
  linkBtn.onclick = () => shareLink(status.id);

  const imgBtn = document.createElement("button");
  imgBtn.textContent = "Share with Img";
  imgBtn.onclick = () => shareImage(card);

  buttons.append(copyBtn, linkBtn, imgBtn);
  content.append(text, buttons);
  card.append(overlay, content);

  return card;
}

/* Copy */
function copyText(text, btn) {
  navigator.clipboard.writeText(text);
  btn.textContent = "Copied";
  setTimeout(() => btn.textContent = "Copy", 1500);
}

/* Share Link */
function shareLink(id) {
  const url = `${window.location.origin}${window.location.pathname}?id=${id}`;
  if (navigator.share) {
    navigator.share({ url });
  } else {
    alert(url);
  }
}

/* Share Image */
async function shareImage(card) {
  const clone = card.cloneNode(true);
  clone.querySelector(".card-buttons").remove();
  document.body.appendChild(clone);
  const canvas = await html2canvas(clone);
  document.body.removeChild(clone);

  canvas.toBlob(async blob => {
    const file = new File([blob], "status.png", { type: "image/png" });
    if (navigator.share) {
      await navigator.share({ files: [file] });
    }
  });
}

/* Highlight */
function highlightText(text) {
  if (!searchTerm) return text;
  const regex = new RegExp(`(${searchTerm})`, "gi");
  return text.replace(regex, '<span class="highlight">$1</span>');
}

/* Search with Ranking */
searchInput.addEventListener("input", debounce(e => {
  searchTerm = e.target.value.trim();
  if (!searchTerm) {
    filteredStatus = [...allStatus];
  } else {
    filteredStatus = allStatus
      .map(s => ({
        ...s,
        score: (s.text.match(new RegExp(searchTerm, "gi")) || []).length
      }))
      .filter(s => s.score > 0)
      .sort((a,b) => b.score - a.score);
  }

  container.innerHTML = "";
  currentIndex = 0;
  renderBatch();
}, 350));

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/* Infinite Scroll */
window.addEventListener("scroll", () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
    renderBatch();
  }
});

/* Optimize DOM */
function optimizeDOM() {
  const maxCards = 20;
  while (container.children.length > maxCards) {
    container.removeChild(container.firstChild);
  }
}

/* Shuffle */
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

init();