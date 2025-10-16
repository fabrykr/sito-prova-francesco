// js/app.js
(() => {
  // Stato condiviso e flag per evitare listener doppi
  let currentIndex = 0; // indice slide attiva
  window.__uiGlobalsBound = window.__uiGlobalsBound || false; // evita duplicazioni globali
  window.__modalBound = window.__modalBound || false; // listener modale una sola volta

  // Helper: header offset dalla CSS var
  function getHeaderOffset() {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--altezza-header');
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? 0 : n;
  }

  // Verifica stato modale per disabilitare i tasti galleria
  function isOverlayOpen() {
    const overlay = document.getElementById('overlayFoto');
    return overlay?.classList.contains('active');
  }

  // Listener tastiera globali per la galleria (registrati una sola volta)
  function galleryKeyHandler(e) {
    if (isOverlayOpen()) return;
    const carousel = document.getElementById('carousel');
    const slides = carousel ? carousel.querySelectorAll('.slide') : [];
    if (!slides.length) return;
    if (e.key === 'ArrowRight') {
      currentIndex = (currentIndex + 1) % slides.length;
      window.updateSlide?.();
    } else if (e.key === 'ArrowLeft') {
      currentIndex = (currentIndex - 1 + slides.length) % slides.length;
      window.updateSlide?.();
    }
  }

  // Lega gli eventi globali solo una volta (tastiera, resize)
  function bindGlobalEventsOnce() {
    if (window.__uiGlobalsBound) return;
    document.addEventListener('keydown', galleryKeyHandler, { passive: true }); // non chiama preventDefault, quindi passive è sicuro [web:281]
    window.addEventListener('resize', () => window.updateSlide && requestAnimationFrame(window.updateSlide), { passive: true }); // rAF evita layout jank su resize [web:281]
    window.__uiGlobalsBound = true; // flag globale per non duplicare listener [web:281]
  }

  // Modale foto profilo: bind una sola volta (elementi statici fuori dal router)
  function bindModalOnce() {
    if (window.__modalBound) return;
    const foto = document.getElementById('fotoProfilo');
    const overlay = document.getElementById('overlayFoto');
    const closeOverlayBtn = document.getElementById('closeOverlay');
    const main = document.getElementById('content');
    const header = document.querySelector('header');
    let lastFocused = null;

    function modalKeyHandler(e) {
      if (e.key === 'Escape') {
        closeModal();
        return;
      }
      if (e.key === 'Tab') {
        const focusables = overlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const list = Array.from(focusables).filter(el => !el.hasAttribute('disabled'));
        if (!list.length) return;
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    function openModal() {
      if (!overlay) return;
      lastFocused = document.activeElement;
      overlay.classList.add('active');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      main?.setAttribute('aria-hidden', 'true');
      header?.setAttribute('aria-hidden', 'true');
      overlay.focus();
      closeOverlayBtn?.focus();
      document.addEventListener('keydown', modalKeyHandler); // aggiunta al volo in apertura [web:281]
    }

    function closeModal() {
      if (!overlay) return;
      overlay.classList.remove('active');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      main?.removeAttribute('aria-hidden');
      header?.removeAttribute('aria-hidden');
      document.removeEventListener('keydown', modalKeyHandler); // pulizia listener alla chiusura [web:283]
      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
      } else {
        foto?.focus();
      }
    }

    foto?.addEventListener('click', openModal); // click per aprire [web:281]
    overlay?.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); }); // chiusura cliccando lo sfondo [web:281]
    closeOverlayBtn?.addEventListener('click', closeModal); // pulsante “X” [web:281]

    // Esponi per funzioni esterne (galleryKeyHandler usa stato modale via DOM)
    window.__modalBound = true; // evita di ri‑legare a ogni route [web:281]
  }

  // Carosello: rilegatura per ogni pagina caricata nel #content
  function bindCarousel() {
    const carousel = document.getElementById('carousel');
    const slides = carousel ? carousel.querySelectorAll('.slide') : [];
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    function updateSlide() {
      if (!slides.length || !carousel) return;
      const width = slides[0].clientWidth;
      carousel.style.transform = `translateX(-${currentIndex * width}px)`;
    }
    window.updateSlide = updateSlide; // resa disponibile al resize globale [web:281]

    nextBtn?.addEventListener('click', () => {
      if (!slides.length) return;
      currentIndex = (currentIndex + 1) % slides.length;
      updateSlide();
    }); // click next [web:281]

    prevBtn?.addEventListener('click', () => {
      if (!slides.length) return;
      currentIndex = (currentIndex - 1 + slides.length) % slides.length;
      updateSlide();
    }); // click prev [web:281]

    currentIndex = 0; // reset a inizio pagina [web:51]
    requestAnimationFrame(updateSlide); // misura dopo reflow [web:51]
  }

  // Reveal on scroll: evita animare ogni slide, con cleanup tra route
  function setupReveal() {
    // Disconnetti eventuali observer precedenti (cleanup tra pagine) [web:286]
    window.__revealObserver?.disconnect();
    window.__firstSlideObserver?.disconnect();

    // Target da rivelare (no .slide, solo prima slide una tantum)
    const revealTargets = Array.from(document.querySelectorAll(
      'main > section, .contatti-box, .locali-layout > *, .mappa-locali, .galleria-pizze'
    ));
    revealTargets.forEach(el => el.classList.add('reveal')); // stato iniziale [web:51]

    const firstSlide = document.querySelector('#carousel .slide');
    firstSlide?.classList.add('reveal'); // prima slide: reveal iniziale [web:51]

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReduced.matches) {
      revealTargets.forEach(el => el.classList.add('in-view')); // mostra subito [web:51]
      firstSlide?.classList.add('in-view'); // mostra subito [web:51]
      return; // niente observer se riduce motion [web:51]
    }

    // Observer generale
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          obs.unobserve(entry.target); // smetti di osservare dopo il primo reveal [web:290]
        }
      });
    }, {
      root: null,
      rootMargin: `-${Math.max(0, getHeaderOffset() - 20)}px 0px -10% 0px`,
      threshold: 0.12
    });
    window.__revealObserver = observer; // conserva riferimento per disconnect [web:286]

    revealTargets.forEach(el => observer.observe(el)); // attiva osservazione [web:23]

    // Observer dedicato alla prima slide (una sola volta)
    if (firstSlide) {
      const firstSlideObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            entry.target.classList.remove('reveal'); // eviti ri‑animazioni [web:51]
            obs.unobserve(entry.target); // smetti dopo il primo ingresso [web:290]
          }
        });
      }, {
        root: null,
        rootMargin: `-${Math.max(0, getHeaderOffset() - 20)}px 0px -10% 0px`,
        threshold: 0.12
      });
      window.__firstSlideObserver = firstSlideObserver; // conserva per cleanup [web:286]
      firstSlideObserver.observe(firstSlide); // attiva [web:23]
    }
  }

  // API pubblica: chiamata dal router dopo ogni load della pagina
  window.initUI = function initUI() {
    bindGlobalEventsOnce(); // listener su document/window una volta sola [web:281]
    bindModalOnce(); // modale: listener una sola volta [web:281]
    bindCarousel(); // rilegatura elementi dinamici nel #content [web:51]
    setupReveal(); // osservatori aggiornati per i nuovi nodi [web:51]
  };
})();
