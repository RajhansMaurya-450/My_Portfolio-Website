'use strict';

/* ============================================================
   UTILITIES
============================================================ */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ============================================================
   THEME TOGGLE – dark / light with localStorage persistence
============================================================ */
const themeToggle = $('#themeToggle');
const themeIcon = $('#themeIcon');
const body = document.body;

function applyTheme(theme) {
  body.setAttribute('data-theme', theme);
  localStorage.setItem('portfolio-theme', theme);

  if (theme === 'light') {
    themeIcon.className = 'fas fa-sun';
  } else {
    themeIcon.className = 'fas fa-moon';
  }
}

// Load saved preference (default: dark)
applyTheme(localStorage.getItem('portfolio-theme') || 'dark');

themeToggle.addEventListener('click', () => {
  const current = body.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

/* ============================================================
   NAVBAR – scroll shrink + active link highlight
============================================================ */
const navbar = $('#navbar');
const bttBtn = $('#backToTop');

function onScroll() {
  const y = window.scrollY;
  navbar.classList.toggle('scrolled', y > 60);
  bttBtn.classList.toggle('visible', y > 500);
  highlightNav();
}

window.addEventListener('scroll', onScroll, { passive: true });

/* ============================================================
   ACTIVE NAV LINK
============================================================ */
function highlightNav() {
  const sections = $$('section[id]');
  const links = $$('.nav-links a');
  let current = '';

  sections.forEach(s => {
    if (window.scrollY >= s.offsetTop - 130) current = s.id;
  });

  links.forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === '#' + current);
  });
}

/* ============================================================
   HAMBURGER MENU
============================================================ */
const hamburger = $('#hamburger');
const navLinks = $('#navLinks');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  navLinks.classList.toggle('open');
  document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
});

$$('.nav-links a').forEach(a => {
  a.addEventListener('click', () => {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
    document.body.style.overflow = '';
  });
});

/* ============================================================
   TYPEWRITER EFFECT
============================================================ */
const typeEl = $('#typewriter');
const words = [
  'Scalable Web Apps.',
  'MERN Stack Projects.',
  'Clean RESTful APIs.',
  'Responsive UIs.',
  'Real-World Solutions.'
];
let wIdx = 0, cIdx = 0, deleting = false;

function typeWriter() {
  const word = words[wIdx];
  typeEl.textContent = deleting
    ? word.slice(0, --cIdx)
    : word.slice(0, ++cIdx);

  let delay = deleting ? 55 : 95;

  if (!deleting && cIdx === word.length) {
    delay = 1800; deleting = true;
  } else if (deleting && cIdx === 0) {
    deleting = false;
    wIdx = (wIdx + 1) % words.length;
    delay = 350;
  }
  setTimeout(typeWriter, delay);
}
typeWriter();

/* ============================================================
   SCROLL REVEAL (IntersectionObserver)
============================================================ */
const revealTargets = $$(
  '.skill-card, .project-card, .timeline-item, ' +
  '.contact-item, .about-grid, .stat, .social-btn'
);

revealTargets.forEach(el => el.classList.add('reveal'));

const revealObs = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (!entry.isIntersecting) return;
    // stagger siblings
    const siblings = $$('.reveal', entry.target.parentElement);
    const idx = siblings.indexOf(entry.target);
    entry.target.style.transitionDelay = Math.min(idx * 80, 400) + 'ms';
    entry.target.classList.add('visible');
    revealObs.unobserve(entry.target);
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

revealTargets.forEach(el => revealObs.observe(el));

/* ============================================================
   SKILL TAG HOVER – ripple glow
============================================================ */
$$('.skill-tags span').forEach(tag => {
  tag.addEventListener('mouseenter', () => {
    tag.style.boxShadow = '0 0 12px rgba(167,139,250,0.35)';
  });
  tag.addEventListener('mouseleave', () => {
    tag.style.boxShadow = '';
  });
});

/* ============================================================
   PROJECT CARD – tilt effect on mouse move
============================================================ */
$$('.project-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -10;
    card.style.transform = `translateY(-6px) rotateX(${y}deg) rotateY(${x}deg)`;
    card.style.transition = 'transform 0.1s ease';
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
    card.style.transition = 'all 0.3s ease';
  });
});

/* ============================================================
   ANIMATED COUNTER (stats section)
============================================================ */
function animateCounter(el, target, suffix = '') {
  let start = 0;
  const duration = 1400;
  const step = (timestamp) => {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const value = isNaN(parseInt(target))
      ? target
      : Math.floor(eased * parseInt(target));
    el.textContent = isNaN(parseInt(target)) ? target : value + suffix;
    if (progress < 1 && !isNaN(parseInt(target))) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

const statsObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const nums = $$('.stat-num', entry.target);
    nums.forEach(n => {
      const raw = n.textContent.trim();
      const hasPlusSuffix = raw.endsWith('+');
      const val = hasPlusSuffix ? raw.slice(0, -1) : raw;
      animateCounter(n, val, hasPlusSuffix ? '+' : '');
    });
    statsObs.unobserve(entry.target);
  });
}, { threshold: 0.5 });

const statsEl = $('.about-stats');
if (statsEl) statsObs.observe(statsEl);

/* ============================================================
   CONTACT FORM – submit handler with loading state
============================================================ */
const contactForm = $('#contactForm');
const formSuccess = $('#formSuccess');

if (contactForm) {
  contactForm.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = contactForm.querySelector('button[type="submit"]');
    const originalHTML = btn.innerHTML;

    // Loading state
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Sending…';

    // Simulate async send (replace with real fetch call)
    await new Promise(res => setTimeout(res, 1400));

    btn.innerHTML = '<i class="fas fa-check"></i> Sent!';
    formSuccess.classList.add('show');
    contactForm.reset();

    setTimeout(() => {
      btn.innerHTML = originalHTML;
      btn.disabled = false;
      formSuccess.classList.remove('show');
    }, 4500);
  });
}

/* ============================================================
   SMOOTH SCROLL OFFSET (fixed navbar clearance)
============================================================ */
$$('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.getElementById(anchor.getAttribute('href').slice(1));
    if (!target) return;
    e.preventDefault();
    const navH = navbar.offsetHeight + 12;
    window.scrollTo({ top: target.offsetTop - navH, behavior: 'smooth' });
  });
});

/* ============================================================
   CURSOR GLOW (desktop only)
============================================================ */
if (window.matchMedia('(pointer: fine)').matches) {
  const glow = document.createElement('div');
  glow.id = 'cursorGlow';
  Object.assign(glow.style, {
    position: 'fixed', pointerEvents: 'none',
    width: '340px', height: '340px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(109,40,217,0.07) 0%, transparent 70%)',
    transform: 'translate(-50%,-50%)',
    zIndex: '0', transition: 'left 0.12s ease, top 0.12s ease',
    top: '-200px', left: '-200px'
  });
  document.body.appendChild(glow);

  document.addEventListener('mousemove', e => {
    glow.style.left = e.clientX + 'px';
    glow.style.top = e.clientY + 'px';
  });
}

/* ============================================================
   INIT
============================================================ */
onScroll();

/* ============================================================
   PROJECTS CAROUSEL
============================================================ */
(function () {
  const carousel  = $('#projectsCarousel');
  const prevBtn   = $('#carouselPrev');
  const nextBtn   = $('#carouselNext');
  const dotsWrap  = $('#carouselDots');
  if (!carousel) return;

  const cards = $$('.project-card', carousel);
  const GAP   = 22;

  // Width of one scroll step (card + gap)
  const cardW = () => cards[0] ? cards[0].offsetWidth + GAP : 362;

  // How many unique scroll positions exist
  function totalPages() {
    const maxScroll = carousel.scrollWidth - carousel.clientWidth;
    return Math.round(maxScroll / cardW()) + 1;
  }

  // Current page index (0-based)
  function currentPage() {
    return Math.round(carousel.scrollLeft / cardW());
  }

  // Build dots based on scroll pages (not card count)
  function buildDots() {
    dotsWrap.innerHTML = '';
    const pages = totalPages();
    for (let i = 0; i < pages; i++) {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      dot.addEventListener('click', () => {
        carousel.scrollTo({ left: i * cardW(), behavior: 'smooth' });
      });
      dotsWrap.appendChild(dot);
    }
  }

  // Update dot highlights
  function updateDots() {
    const idx  = currentPage();
    const dots = $$('.carousel-dot', dotsWrap);
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));
  }

  // Hide/show arrows based on scroll position
  function updateArrows() {
    const maxScroll = carousel.scrollWidth - carousel.clientWidth;
    const atStart   = carousel.scrollLeft <= 2;
    const atEnd     = carousel.scrollLeft >= maxScroll - 2;

    prevBtn.style.opacity       = atStart ? '0' : '1';
    prevBtn.style.pointerEvents = atStart ? 'none' : 'all';

    nextBtn.style.opacity       = atEnd ? '0' : '1';
    nextBtn.style.pointerEvents = atEnd ? 'none' : 'all';
  }

  function onScroll() {
    updateDots();
    updateArrows();
  }

  prevBtn.addEventListener('click', () => {
    carousel.scrollBy({ left: -cardW(), behavior: 'smooth' });
  });

  nextBtn.addEventListener('click', () => {
    carousel.scrollBy({ left: cardW(), behavior: 'smooth' });
  });

  carousel.addEventListener('scroll', onScroll, { passive: true });

  // Initialise after layout paint so measurements are accurate
  requestAnimationFrame(() => requestAnimationFrame(() => {
    buildDots();
    updateArrows();
  }));
})();
