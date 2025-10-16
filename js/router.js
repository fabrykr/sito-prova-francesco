// js/router.js

const content = document.getElementById('content');
const footerContainer = document.getElementById('footer');

const VALID_PAGES = new Set(['storia', 'locali', 'riconoscimenti', 'galleria', 'progetti']); // slugs permessi

// Carica HTML esterno con gestione errori e abort recente
let currentController = null;
async function loadHTML(url, target) {
  try {
    // aborta eventuale richiesta precedente se ancora in corso
    currentController?.abort();
    currentController = new AbortController();

    const res = await fetch(url, { signal: currentController.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} su ${url}`);
    const html = await res.text();
    target.innerHTML = html;
  } catch (err) {
    if (err.name === 'AbortError') return; // navigazione veloce: ignora
    target.innerHTML = '<section><h2>Ops…</h2><p>Contenuto non disponibile al momento.</p></section>';
    // console.error(err); // opzionale: log
  }
}

// Router principale: panoramica o pagina di approfondimento
async function router() {
  const rawHash = window.location.hash || '';
  const isPage = rawHash.startsWith('#page/');
  const slug = isPage ? rawHash.replace('#page/', '') : '';

  if (isPage && VALID_PAGES.has(slug)) {
    await loadHTML(`templates/${slug}.html`, content);
    window.initUI?.(); // ricollega componenti dinamici
    // vai all’inizio contenuto
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    // panoramica (template estratto dalla pagina principale)
    await loadHTML('templates/panoramica.html', content);
    window.initUI?.();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // (Ri)carica footer comune
  await loadHTML('footer.html', footerContainer);
}

// Bind eventi di navigazione (una sola volta)
window.addEventListener('hashchange', router); // SPA hash routing [web:294]
window.addEventListener('DOMContentLoaded', router); // primo render quando il DOM è pronto [web:45]

// Toggle sidebar per mobile
document.getElementById('toggleSidebar')?.addEventListener('click', () => {
  document.getElementById('sidebar')?.classList.toggle('open');
});
