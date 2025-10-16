(() => {
  let currentIndex = 0;
  window.__uiGlobalsBound = window.__uiGlobalsBound || false;
  window.__modalBound = window.__modalBound || false;

  function getHeaderOffset() {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--altezza-header');
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? 0 : n;
  }

  function isOverlayOpen() {
    const overlay = document.getElementById('overlayFoto');
    return overlay?.classList.contains('active');
  }

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

  function bindGlobalEventsOnce() {
    if (window.__uiGlobalsBound) return;
    document.addEventListener('keydown', galleryKeyHandler, { passive: true });
    window.addEventListener('resize', () => {
      if (window.updateSlide) requestAnimationFrame(window.updateSlide);
    }, { passive: true });
    window.__uiGlobalsBound = true;
  }

  // Sidebar toggle accessibile
const menuBtn = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const navOverlay = document.getElementById('navOverlay');

// Seleziona TUTTI gli elementi posizionati in modo fisso
const fixedElements = document.querySelectorAll('header, .hamburger');
const mainContent = document.getElementById('content');

function openMenu() {
  // Calcola la larghezza della scrollbar
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

  // Applica la compensazione a tutti gli elementi che ne hanno bisogno
  document.body.style.paddingRight = scrollbarWidth + 'px';
  fixedElements.forEach((el) => {
    // Invece di 'paddingRight', modifichiamo direttamente 'right' per gli elementi posizionati
    // Se un elemento ha un 'right' definito (es. '12px'), lo aggiorniamo
    const currentRight = window.getComputedStyle(el).right;
    el.style.right = `calc(${currentRight} + ${scrollbarWidth}px)`;
  });
  
  // Apri il menu e blocca lo scroll
  sidebar.classList.add('open');
  navOverlay.classList.add('active');
  navOverlay.removeAttribute('hidden');
  menuBtn.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';

  // Sposta il contenuto principale su desktop
  if (window.innerWidth >= 1000) {
    mainContent.classList.add('content-shifted');
  }
}

function closeMenu() {
  // Rimuovi la compensazione (ripristina gli stili originali)
  document.body.style.paddingRight = '';
  fixedElements.forEach((el) => {
    el.style.right = ''; // Rimuovendo lo stile inline, torna al valore del CSS
  });

  // Chiudi il menu e ripristina lo scroll
  sidebar.classList.remove('open');
  navOverlay.classList.remove('active');
  navOverlay.setAttribute('hidden', '');
  menuBtn.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';

  // Rimuovi lo spostamento del contenuto principale
  mainContent.classList.remove('content-shifted');
}


// Aggiungi gli event listener UNA SOLA VOLTA
if (menuBtn && navOverlay) {
  menuBtn.addEventListener('click', () => {
    const expanded = menuBtn.getAttribute('aria-expanded') === 'true';
    expanded ? closeMenu() : openMenu();
  });

  navOverlay.addEventListener('click', closeMenu);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) {
      closeMenu();
    }
  });
}

window.closeMenu = closeMenu; // Esponi globalmente se necessario

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
      document.addEventListener('keydown', modalKeyHandler);
    }

    function closeModal() {
      if (!overlay) return;
      overlay.classList.remove('active');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      main?.removeAttribute('aria-hidden');
      header?.removeAttribute('aria-hidden');
      document.removeEventListener('keydown', modalKeyHandler);
      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
      } else {
        foto?.focus();
      }
    }

    foto?.addEventListener('click', openModal);
    overlay?.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    closeOverlayBtn?.addEventListener('click', closeModal);

    window.__modalBound = true;
  }

  bindGlobalEventsOnce();
  bindModalOnce();

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
    window.updateSlide = updateSlide;

    // Rimuove vecchi listener se presenti
    prevBtn?.replaceWith(prevBtn.cloneNode(true));
    nextBtn?.replaceWith(nextBtn.cloneNode(true));
    const prevBtnNew = document.getElementById('prevBtn');
    const nextBtnNew = document.getElementById('nextBtn');

    nextBtnNew?.addEventListener('click', () => {
      if (!slides.length) return;
      currentIndex = (currentIndex + 1) % slides.length;
      updateSlide();
    });

    prevBtnNew?.addEventListener('click', () => {
      if (!slides.length) return;
      currentIndex = (currentIndex - 1 + slides.length) % slides.length;
      updateSlide();
    });

    currentIndex = 0;
    requestAnimationFrame(updateSlide);
  }

  function setupReveal() {
    window.__revealObserver?.disconnect();
    window.__firstSlideObserver?.disconnect();

    const revealTargets = Array.from(document.querySelectorAll(
  'main > section, .contatti-box, .locali-layout > *, .mappa-locali, .galleria-pizze'
));

// Aggiungi .reveal a .mappa-locali se manca
document.querySelectorAll('.mappa-locali').forEach(el => {
  if (!el.classList.contains('reveal')) el.classList.add('reveal');
});


    revealTargets.forEach(el => {
      el.classList.add('reveal');
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) {
        el.classList.add('in-view');
      }
    });

    const firstSlide = document.querySelector('#carousel .slide');
    if (firstSlide) {
      firstSlide.classList.add('reveal');
      const r = firstSlide.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) {
        firstSlide.classList.add('in-view');
      }
    }

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReduced.matches) {
      revealTargets.forEach(el => el.classList.add('in-view'));
      firstSlide?.classList.add('in-view');
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          obs.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      rootMargin: `-${Math.max(0, getHeaderOffset() - 20)}px 0px -10% 0px`,
      threshold: 0.01
    });

    window.__revealObserver = observer;

    revealTargets.forEach(el => {
      if (!el.classList.contains('in-view')) {
        observer.observe(el);
      }
    });

    if (firstSlide && !firstSlide.classList.contains('in-view')) {
      const firstSlideObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            entry.target.classList.remove('reveal');
            obs.unobserve(entry.target);
          }
        });
      }, {
        root: null,
        rootMargin: `-${Math.max(0, getHeaderOffset() - 20)}px 0px -10% 0px`,
        threshold: 0.01
      });
      window.__firstSlideObserver = firstSlideObserver;
      firstSlideObserver.observe(firstSlide);
    }
  }

  window.initUI = function initUI() {
    window.closeMenu();
    bindCarousel();
    setupReveal();
  };
})();
