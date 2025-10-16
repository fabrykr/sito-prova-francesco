// app.js
window.initUI = function initUI() {
  /* ----------------------------
   GALLERIA / CAROUSEL
---------------------------- */
const carousel = document.getElementById('carousel');
const slides = carousel ? carousel.querySelectorAll('.slide') : [];
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

let currentIndex = 0;

function updateSlide() {
  if (!slides.length || !carousel) return;
  const width = slides[0].clientWidth;
  carousel.style.transform = `translateX(-${currentIndex * width}px)`;
}

// Buttons
nextBtn?.addEventListener('click', () => {
  if (!slides.length) return;
  currentIndex = (currentIndex + 1) % slides.length;
  updateSlide();
});
prevBtn?.addEventListener('click', () => {
  if (!slides.length) return;
  currentIndex = (currentIndex - 1 + slides.length) % slides.length;
  updateSlide();
});

// Keyboard left/right for accessibility (inattivo se modale aperta)
function galleryKeyHandler(e) {
  if (isModalOpen()) return;
  if (!slides.length) return;
  if (e.key === 'ArrowRight') {
    currentIndex = (currentIndex + 1) % slides.length;
    updateSlide();
  } else if (e.key === 'ArrowLeft') {
    currentIndex = (currentIndex - 1 + slides.length) % slides.length;
    updateSlide();
  }
}
document.addEventListener('keydown', galleryKeyHandler);

// Recalculate on resize/load
window.addEventListener('resize', updateSlide);
window.addEventListener('load', updateSlide);

/* ----------------------------
   FOTO PROFILO: modale fullscreen
---------------------------- */
const foto = document.getElementById('fotoProfilo');
const overlay = document.getElementById('overlayFoto');
const closeOverlayBtn = document.getElementById('closeOverlay');
const main = document.getElementById('mainContent');
const header = document.querySelector('header');

let lastFocused = null;

function isModalOpen() {
  return overlay?.classList.contains('active');
}

function openModal() {
  if (!overlay) return;
  lastFocused = document.activeElement;
  overlay.classList.add('active');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  // Nascondi sfondo agli screen reader quando la modale è aperta (fallback legacy)
  main?.setAttribute('aria-hidden', 'true');
  header?.setAttribute('aria-hidden', 'true');
  // Focus management
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
  // Ripristina focus
  if (lastFocused && typeof lastFocused.focus === 'function') {
    lastFocused.focus();
  } else {
    foto?.focus();
  }
}

// Trap focus e ESC
function modalKeyHandler(e) {
  if (e.key === 'Escape') {
    closeModal();
    return;
  }
  if (e.key === 'Tab') {
    // Semplice trap: limita focus agli elementi focusabili della modale
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

// Apertura su click della foto
foto?.addEventListener('click', openModal);

// Chiusura cliccando lo sfondo
overlay?.addEventListener('click', (e) => {
  if (e.target === overlay) closeModal();
});

// Chiusura con pulsante "X"
closeOverlayBtn?.addEventListener('click', closeModal);

/* ----------------------------
   REVEAL ON SCROLL (senza animare ogni slide)
---------------------------- */

// Seleziona i target da rivelare (niente .slide qui)
const revealTargets = Array.from(document.querySelectorAll(
  'main > section, .contatti-box, .locali-layout > *, .mappa-locali, .galleria-pizze'
));

// Stato iniziale sui target
revealTargets.forEach(el => el.classList.add('reveal'));

// Utility: ricava l'altezza header dalla CSS var per compensare il fixed header
function getHeaderOffset() {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--altezza-header');
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? 0 : n;
}

// Prima slide: solo fade-in iniziale una-tantum
const firstSlide = document.querySelector('#carousel .slide');
firstSlide?.classList.add('reveal');

// Riduci animazioni: rendi tutto visibile e non osservare
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
if (prefersReduced.matches) {
  revealTargets.forEach(el => el.classList.add('in-view'));
  firstSlide?.classList.add('in-view');
} else {
  // Observer generale (sezioni/wrapper, non le slide)
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        obs.unobserve(entry.target); // una volta rivelato, smetti di osservare
      }
    });
  }, {
    root: null,
    // Compensa l'header fisso per evitare trigger anticipati dietro l'header
    rootMargin: `-${Math.max(0, getHeaderOffset() - 20)}px 0px -10% 0px`,
    threshold: 0.12
  });

  revealTargets.forEach(el => observer.observe(el));

  // Observer dedicato alla prima slide (una sola volta)
  if (firstSlide) {
    const firstSlideObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          entry.target.classList.remove('reveal'); // non ri-animare in seguito
          obs.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      rootMargin: `-${Math.max(0, getHeaderOffset() - 20)}px 0px -10% 0px`,
      threshold: 0.12
    });
    firstSlideObserver.observe(firstSlide);
  }
}
};
