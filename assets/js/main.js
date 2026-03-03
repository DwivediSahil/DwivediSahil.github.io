/**
 * Sahil's Notes - Main JavaScript
 * Optimized for performance
 */

(function() {
  'use strict';

  // ============================================
  // UTILITIES
  // ============================================

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  // Debounce function for search
  function debounce(fn, delay) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  // Calculate reading time
  function getReadingTime(text) {
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min read`;
  }

  // Show toast notification
  function showToast(message, duration = 2000) {
    const existing = $('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), duration);
  }

  // ============================================
  // THEME (DARK MODE)
  // ============================================

  const Theme = {
    init() {
      const saved = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = saved || (prefersDark ? 'dark' : 'light');
      this.set(theme, false);

      // Listen for system theme changes
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
          this.set(e.matches ? 'dark' : 'light', false);
        }
      });
    },

    set(theme, save = true) {
      document.documentElement.setAttribute('data-theme', theme);
      if (save) localStorage.setItem('theme', theme);
      this.updateIcon();
    },

    toggle() {
      const current = document.documentElement.getAttribute('data-theme');
      this.set(current === 'dark' ? 'light' : 'dark');
    },

    updateIcon() {
      const btn = $('.theme-toggle');
      if (!btn) return;
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      btn.innerHTML = isDark ?
        '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>' :
        '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>';
    }
  };

  // ============================================
  // MOBILE MENU
  // ============================================

  const MobileMenu = {
    init() {
      const toggle = $('.menu-toggle');
      const menu = $('.mobile-menu');
      if (!toggle || !menu) return;

      toggle.addEventListener('click', () => {
        menu.classList.toggle('active');
        const isOpen = menu.classList.contains('active');
        toggle.setAttribute('aria-expanded', isOpen);
      });

      // Close on outside click
      document.addEventListener('click', (e) => {
        if (!menu.contains(e.target) && !toggle.contains(e.target)) {
          menu.classList.remove('active');
        }
      });
    }
  };

  // ============================================
  // LIGHTBOX
  // ============================================

  const Lightbox = {
    images: [],
    currentIndex: 0,
    isAnimating: false,

    init() {
      // Create lightbox element if not exists
      if (!$('.lightbox')) {
        const html = `
          <div class="lightbox" id="lightbox">
            <button class="lightbox-close" aria-label="Close">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
            <button class="lightbox-nav lightbox-prev" aria-label="Previous">
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <div class="lightbox-content">
              <img id="lightbox-img" src="" alt="">
            </div>
            <button class="lightbox-nav lightbox-next" aria-label="Next">
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
            <p class="lightbox-title" id="lightbox-title"></p>
            <span class="lightbox-counter" id="lightbox-counter"></span>
          </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
      }

      this.lightbox = $('#lightbox');
      this.img = $('#lightbox-img');
      this.title = $('#lightbox-title');
      this.counter = $('#lightbox-counter');

      // Event listeners
      $('.lightbox-close').addEventListener('click', () => this.close());
      $('.lightbox-prev').addEventListener('click', () => this.prev());
      $('.lightbox-next').addEventListener('click', () => this.next());

      this.lightbox.addEventListener('click', (e) => {
        if (e.target === this.lightbox) this.close();
      });

      // Keyboard navigation
      document.addEventListener('keydown', (e) => {
        if (!this.lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') this.close();
        if (e.key === 'ArrowLeft') this.prev();
        if (e.key === 'ArrowRight') this.next();
      });

      // Touch/swipe support
      let touchStartX = 0;
      let touchStartY = 0;
      this.lightbox.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
      }, { passive: true });

      this.lightbox.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].screenX;
        const touchEndY = e.changedTouches[0].screenY;
        const diffX = touchStartX - touchEndX;
        const diffY = touchStartY - touchEndY;

        // Only trigger if horizontal swipe is greater than vertical
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
          diffX > 0 ? this.next() : this.prev();
        }
      }, { passive: true });
    },

    setImages(images) {
      this.images = images;
    },

    open(src, titleText, index = 0) {
      this.currentIndex = index;
      this.img.src = src;
      this.title.textContent = titleText || '';
      this.updateCounter();

      // Force reflow for animation
      this.lightbox.style.display = 'flex';
      requestAnimationFrame(() => {
        this.lightbox.classList.add('active');
      });

      document.body.style.overflow = 'hidden';
    },

    close() {
      this.lightbox.classList.remove('active');
      document.body.style.overflow = '';

      // Hide after animation
      setTimeout(() => {
        if (!this.lightbox.classList.contains('active')) {
          this.lightbox.style.display = 'none';
        }
      }, 350);
    },

    prev() {
      if (this.images.length === 0 || this.isAnimating) return;
      this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
      this.showCurrent('prev');
    },

    next() {
      if (this.images.length === 0 || this.isAnimating) return;
      this.currentIndex = (this.currentIndex + 1) % this.images.length;
      this.showCurrent('next');
    },

    showCurrent(direction = 'next') {
      const img = this.images[this.currentIndex];
      if (!img) return;

      this.isAnimating = true;

      // Animate out
      this.img.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
      this.img.style.opacity = '0';
      this.img.style.transform = direction === 'next' ? 'translateX(-20px)' : 'translateX(20px)';

      setTimeout(() => {
        this.img.src = img.url;
        this.title.textContent = img.title || '';
        this.updateCounter();

        // Animate in from opposite direction
        this.img.style.transform = direction === 'next' ? 'translateX(20px)' : 'translateX(-20px)';

        requestAnimationFrame(() => {
          this.img.style.opacity = '1';
          this.img.style.transform = 'translateX(0)';

          setTimeout(() => {
            this.isAnimating = false;
          }, 150);
        });
      }, 150);
    },

    updateCounter() {
      if (this.counter && this.images.length > 0) {
        this.counter.textContent = `${this.currentIndex + 1} / ${this.images.length}`;
      }
    }
  };

  // ============================================
  // SKELETON LOADERS
  // ============================================

  const Skeleton = {
    card() {
      return `
        <div class="card">
          <div class="skeleton skeleton-image"></div>
          <div class="card-body">
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text"></div>
          </div>
        </div>
      `;
    },

    featuredPost() {
      return `
        <div class="skeleton skeleton-image" style="padding-top:50%;margin-bottom:1rem;"></div>
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text" style="width:40%;"></div>
      `;
    },

    sidebarPost() {
      return `
        <div class="sidebar-post">
          <div class="skeleton" style="height:8rem;margin-bottom:0.75rem;"></div>
          <div class="skeleton skeleton-title"></div>
          <div class="skeleton skeleton-text"></div>
        </div>
      `.repeat(3);
    },

    galleryGrid(count = 12) {
      return `
        <div class="skeleton" style="aspect-ratio:1;"></div>
      `.repeat(count);
    }
  };

  // ============================================
  // IMAGE BLUR-UP LOADING
  // ============================================

  const BlurImage = {
    // Apply blur-up effect to an image element
    apply(img) {
      img.classList.add('loading');
      if (img.complete) {
        img.classList.remove('loading');
        img.classList.add('loaded');
      } else {
        img.addEventListener('load', () => {
          img.classList.remove('loading');
          img.classList.add('loaded');
        }, { once: true });
      }
    },

    // Apply to all images in a container
    applyToContainer(container) {
      const images = container.querySelectorAll('img[loading="lazy"]');
      images.forEach(img => this.apply(img));
    },

    // Create image HTML with blur-up wrapper
    createHTML(src, alt, extraClasses = '') {
      return `
        <div class="img-blur-wrapper ${extraClasses}">
          <img src="${src}" alt="${alt}" loading="lazy" class="loading" onload="this.classList.remove('loading');this.classList.add('loaded');">
        </div>
      `;
    }
  };

  // ============================================
  // ICONS
  // ============================================

  const Icons = {
    clock: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    search: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>'
  };

  // ============================================
  // PAGE TRANSITIONS
  // ============================================

  const PageTransition = {
    init() {
      // Handle all internal link clicks
      document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;

        const href = link.getAttribute('href');
        if (!href) return;

        // Skip external links, anchors, and special links
        if (href.startsWith('http') ||
            href.startsWith('#') ||
            href.startsWith('mailto:') ||
            href.startsWith('tel:') ||
            link.target === '_blank' ||
            e.ctrlKey || e.metaKey) {
          return;
        }

        e.preventDefault();
        this.navigateTo(href);
      });

      // Handle browser back/forward
      window.addEventListener('popstate', () => {
        this.navigateTo(window.location.pathname + window.location.search, false);
      });
    },

    navigateTo(url, pushState = true) {
      document.body.classList.add('page-leaving');

      setTimeout(() => {
        if (pushState) {
          window.location.href = url;
        } else {
          window.location.reload();
        }
      }, 200);
    }
  };

  // ============================================
  // SCROLL ANIMATIONS
  // ============================================

  const ScrollAnimations = {
    init() {
      // Intersection Observer for fade-in animations
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('fade-in');
              observer.unobserve(entry.target);
            }
          });
        }, {
          threshold: 0.1,
          rootMargin: '0px 0px -50px 0px'
        });

        // Observe elements with data-animate attribute
        $$('[data-animate]').forEach(el => {
          el.style.opacity = '0';
          observer.observe(el);
        });
      }
    }
  };

  // ============================================
  // INITIALIZATION
  // ============================================

  function init() {
    Theme.init();
    MobileMenu.init();
    Lightbox.init();
    PageTransition.init();
    ScrollAnimations.init();

    // Add Takehara topographic background
    const topo = document.createElement('div');
    topo.className = 'takehara-topo';
    document.body.appendChild(topo);

    // Set current year in footer
    const yearEl = $('#currentYear');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Page load animation complete
    document.body.style.opacity = '1';
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ============================================
  // EXPOSE PUBLIC API
  // ============================================

  window.SahilNotes = {
    Theme,
    Lightbox,
    Skeleton,
    BlurImage,
    Icons,
    getReadingTime,
    showToast,
    debounce,
    $,
    $$
  };

})();
