const content = document.getElementById("content");
const footerContainer = document.getElementById("footer");

// Funzione per caricare HTML esterno
async function loadHTML(url, target) {
  const res = await fetch(url);
  const html = await res.text();
  target.innerHTML = html;
}

// Load footer all’avvio
loadHTML("footer.html", footerContainer);

// Routing: #page/nome o #inizio
window.addEventListener("hashchange", router);
window.addEventListener("DOMContentLoaded", router);

async function router() {
  const hash = window.location.hash;

  if (hash.startsWith("#page/")) {
    const page = hash.replace("#page/", "");
    await loadHTML(`templates/${page}.html`, content);
  } else {
    // Torna alla panoramica (index)
    await loadHTML("templates/panoramica.html", content);
  }

  // Carica di nuovo footer identico
  loadHTML("footer.html", footerContainer);
}

// Sidebar toggle per mobile
document.getElementById("toggleSidebar")?.addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
});

