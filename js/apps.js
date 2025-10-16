(() => {
  let currentIndex = 0;
  window.__uiGlobalsBound = window.__uiGlobalsBound || false;
  window.__modalBound = window.__modalBound || false;

  // --- SELEZIONE DEGLI ELEMENTI DOM ---
  const menuBtn = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  const navOverlay = document.getElementById('navOverlay');
  const mainContent = document.getElementById('content');
  const footer = document.getElementById('footer');
  const fixedElements = document.querySelectorAll('header, .hamburger');

  // --- FUNZIONI PER IL MENÙ LATERALE E GESTIONE SCROLL ---

  function openMenu() {
    if (!sidebar || !navOverlay || !menuBtn) return;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.paddingRight = scrollbarWidth + 'px';
    if (mainContent) mainContent.style.paddingRight = scrollbarWidth + 'px';
    if (footer) footer.style.paddingRight = scrollbarWidth + 'px';

    fixedElements.forEach((el) => {
      const currentRight = window.getComputedStyle(el).right;
      el.style.right = `calc(${currentRight} + ${scrollbarWidth}px)`;
    });

    sidebar.classList.add('open');
    navOverlay.classList.add('active');
    navOverlay.removeAttribute('hidden');
    menuBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';

    if (window.innerWidth >= 1000 && mainContent) {
      mainContent.classList.add('content-shifted');
    }
  }

  function closeMenu() {
    if (!sidebar || !navOverlay || !menuBtn) return;
    document.body.style.paddingRight = '';
    if (mainContent) mainContent.style.paddingRight = '';
    if (footer) footer.style.paddingRight = '';

    fixedElements.forEach((el) => {
      el.style.right = '';
    });

    sidebar.classList.remove('open');
    navOverlay.classList.remove('active');
    navOverlay.setAttribute('hidden', '');
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';

    if (mainContent) {
      mainContent.classList.remove('content-shifted');
    }
  }

  // --- COLLEGAMENTO DEGLI EVENTI ---

  if (menuBtn && navOverlay) {
    menuBtn.addEventListener('click', () => {
      const isExpanded = menuBtn.getAttribute('aria-expanded') === 'true';
      isExpanded ? closeMenu() : openMenu();
    });

    navOverlay.addEventListener('click', closeMenu);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sidebar && sidebar.classList.contains('open')) {
        closeMenu();
      }
    });
  }

  window.closeMenu = closeMenu;

  // --- FUNZIONI ACCESSORIE (GALLERIA, MODALE, ETC.) ---

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

  function bindModalOnce() {
    if (window.__modalBound) return;
    const foto = document.getElementById('fotoProfilo');
    const overlay = document.getElementById('overlayFoto');
    const closeOverlayBtn = document.getElementById('closeOverlay');
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
      if (mainContent) mainContent.setAttribute('aria-hidden', 'true');
      if (header) header.setAttribute('aria-hidden', 'true');
      overlay.focus();
      closeOverlayBtn?.focus();
      document.addEventListener('keydown', modalKeyHandler);
    }

    function closeModal() {
      if (!overlay) return;
      overlay.classList.remove('active');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (mainContent) mainContent.removeAttribute('aria-hidden');
      if (header) header.removeAttribute('aria-hidden');
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

  function bindCarousel() {
    const carousel = document.getElementById('carousel');
    if (!carousel) return;
    const slides = carousel.querySelectorAll('.slide');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    function updateSlide() {
      if (!slides.length) return;
      const width = slides[0].clientWidth;
      carousel.style.transform = `translateX(-${currentIndex * width}px)`;
    }
    window.updateSlide = updateSlide;

    const newPrevBtn = prevBtn.cloneNode(true);
    prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
    
    const newNextBtn = nextBtn.cloneNode(true);
    nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);

    newNextBtn.addEventListener('click', () => {
      if (!slides.length) return;
      currentIndex = (currentIndex + 1) % slides.length;
      updateSlide();
    });

    newPrevBtn.addEventListener('click', () => {
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

  // --- FUNZIONE DI INIZIALIZZAZIONE GLOBALE ---
  window.initUI = function initUI() {
    if (typeof window.closeMenu === 'function') {
      window.closeMenu();
    }
    bindCarousel();
    setupReveal();
  };

  // Esecuzione delle funzioni di binding all'avvio dello script
  bindGlobalEventsOnce();
  bindModalOnce();

})();
