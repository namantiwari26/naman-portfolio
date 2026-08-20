// Smooth Scroll Canvas Frame Sequence & Interaction Engine
const TOTAL_FRAMES = 300;
const canvas = document.getElementById('frame-canvas');
const ctx = canvas.getContext('2d', { alpha: false });
const loader = document.getElementById('loader');
const loaderBar = document.getElementById('loader-bar');
const header = document.getElementById('navbar');

const frames = [];
let loadedCount = 0;
let currentFrame = 0;
let targetFrame = 0;
let lastRenderedFrame = -1;
let isFirstFrameReady = false;

// Apply centralized portfolio links from config.js
function applyPortfolioLinks() {
  if (typeof portfolioLinks === 'undefined') return;

  // Bind project GitHub links
  document.querySelectorAll('[data-link]').forEach((el) => {
    const key = el.getAttribute('data-link');
    if (key.startsWith('projects.')) {
      const projKey = key.split('.')[1];
      if (portfolioLinks.projects && portfolioLinks.projects[projKey]) {
        el.href = portfolioLinks.projects[projKey];
      }
    } else if (portfolioLinks[key]) {
      el.href = portfolioLinks[key];
    }
  });

  // Bind Email contact links
  document.querySelectorAll('[data-contact="email"]').forEach((el) => {
    if (portfolioLinks.email) {
      el.href = `mailto:${portfolioLinks.email}`;
    }
  });

  // Update email text display
  const displayEmail = document.getElementById('display-email');
  if (displayEmail && portfolioLinks.email) {
    displayEmail.textContent = portfolioLinks.email;
  }
}

// Generate file path for frame index (1-based file naming: ezgif-frame-001.jpg)
function getFramePath(index) {
  const frameNumber = String(index + 1).padStart(3, '0');
  return `Frames/ezgif-frame-${frameNumber}.jpg`;
}

// Adjust canvas resolution for High-DPI / Retina displays
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const displayWidth = window.innerWidth;
  const displayHeight = window.innerHeight;

  if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
  }

  renderFrame(Math.round(currentFrame), true);
}

// Draw image covering the entire canvas while maintaining aspect ratio (object-fit: cover)
function renderFrame(index, force = false) {
  if (index === lastRenderedFrame && !force) return;

  const clampedIndex = Math.min(TOTAL_FRAMES - 1, Math.max(0, index));
  const img = frames[clampedIndex];

  // If the target frame is loading, fall back to nearest ready frame
  let activeImg = img && img.complete && img.naturalWidth > 0 ? img : null;
  if (!activeImg) {
    for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
      const prev = frames[clampedIndex - offset];
      if (prev && prev.complete && prev.naturalWidth > 0) {
        activeImg = prev;
        break;
      }
      const next = frames[clampedIndex + offset];
      if (next && next.complete && next.naturalWidth > 0) {
        activeImg = next;
        break;
      }
    }
  }

  if (!activeImg) return;

  const cw = canvas.width;
  const ch = canvas.height;
  const iw = activeImg.naturalWidth || activeImg.width;
  const ih = activeImg.naturalHeight || activeImg.height;

  const scale = Math.max(cw / iw, ch / ih);
  const nw = iw * scale;
  const nh = ih * scale;
  const cx = (cw - nw) * 0.5;
  const cy = (ch - nh) * 0.5;

  ctx.drawImage(activeImg, cx, cy, nw, nh);
  lastRenderedFrame = clampedIndex;
}

// Preload all 300 frames with progress indicator
function preloadFrames() {
  return new Promise((resolve) => {
    let completed = 0;

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = getFramePath(i);

      img.onload = () => {
        completed++;
        loadedCount++;

        if (loaderBar) {
          loaderBar.style.width = `${(completed / TOTAL_FRAMES) * 100}%`;
        }

        // Render first frame immediately
        if (i === 0 && !isFirstFrameReady) {
          isFirstFrameReady = true;
          resizeCanvas();
          renderFrame(0, true);
        }

        // Fade out preloader once initial frames are cached
        if (completed >= 25 && loader && !loader.classList.contains('hidden')) {
          loader.classList.add('hidden');
        }

        if (completed === TOTAL_FRAMES) {
          if (loader) loader.classList.add('hidden');
          resolve();
        }
      };

      img.onerror = () => {
        completed++;
        if (completed === TOTAL_FRAMES) {
          if (loader) loader.classList.add('hidden');
          resolve();
        }
      };

      frames[i] = img;
    }
  });
}

// Calculate target frame across the entire page scroll and update navbar state
function updateScrollProgress() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const scrollTop = window.scrollY || window.pageYOffset || 0;
  const progress = maxScroll > 0 ? Math.min(1, Math.max(0, scrollTop / maxScroll)) : 0;
  targetFrame = progress * (TOTAL_FRAMES - 1);

  // Toggle header blur background on scroll
  if (header) {
    if (scrollTop > 30) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }
}

// Buttery smooth animation loop using linear interpolation (LERP)
function animate() {
  updateScrollProgress();

  const ease = 0.12;
  const delta = targetFrame - currentFrame;

  if (Math.abs(delta) > 0.001) {
    currentFrame += delta * ease;
  } else {
    currentFrame = targetFrame;
  }

  renderFrame(Math.round(currentFrame));
  requestAnimationFrame(animate);
}

// Subtle Scroll Reveal for Content Elements
function setupScrollReveal() {
  const revealElements = document.querySelectorAll('.reveal-item');
  
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    revealElements.forEach((el) => observer.observe(el));
  } else {
    revealElements.forEach((el) => el.classList.add('is-revealed'));
  }
}

// Event Listeners
window.addEventListener('resize', resizeCanvas, { passive: true });
window.addEventListener('scroll', updateScrollProgress, { passive: true });

// Initialize
(async function init() {
  applyPortfolioLinks();
  resizeCanvas();
  setupScrollReveal();
  preloadFrames();
  requestAnimationFrame(animate);
})();
