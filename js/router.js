// js/router.js
const content = document.getElementById('content');
const footerContainer = document.getElementById('footer');

// Salva la panoramica già renderizzata in index.html
const initialPanoramica = content.innerHTML;

const VALID_PAGES = new Set(['storia','locali','riconoscimenti','galleria','progetti']);

let currentController = null;
async function loadHTML(url, target) {
  try {
    currentController?.abort();
    currentController = new AbortController();
    const res = await fetch(url, { signal: currentController.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} su ${url}`);
    const html = await res.text();
    target.innerHTML = html;
  } catch (err) {
    if (err.name === 'AbortError') return;
    target.innerHTML = '<section><h2>Ops…</h2><p>Contenuto non disponibile al momento.</p></section>';
  }
}

async function router() {
  const rawHash = window.location.hash || '';
  const isPage = rawHash.startsWith('#page/');
  const slug = isPage ? rawHash.slice(6) : '';

  if (isPage && VALID_PAGES.has(slug)) {
    await loadHTML(`templates/${slug}.html`, content);
    window.initUI?.();
  } else {
    // Ripristina la panoramica senza fetch esterno
    content.innerHTML = initialPanoramica;
    window.initUI?.();
  }

  await loadHTML('footer.html', footerContainer);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);
document.getElementById('toggleSidebar')?.addEventListener('click', () => {
  document.getElementById('sidebar')?.classList.toggle('open');
});
