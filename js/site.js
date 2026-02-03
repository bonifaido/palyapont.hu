(function () {
  const nav = document.getElementById('topnav');
  const toggle = document.querySelector('.nav-toggle');

  if (nav && toggle) {
    const setOpen = (open) => {
      nav.dataset.open = open ? 'true' : 'false';
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };

    toggle.addEventListener('click', () => {
      setOpen(nav.dataset.open !== 'true');
    });

    nav.addEventListener('click', (e) => {
      const target = e.target;
      if (target && target.tagName === 'A') setOpen(false);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
    });
  }

  if (nav) {
    // Active link highlight: supports both http(s) and file:// preview.
    const links = Array.from(nav.querySelectorAll('a[href]'));

    const getBasename = (path) => {
      if (!path) return '';
      const parts = path.split('/').filter(Boolean);
      return parts.length ? parts[parts.length - 1] : '';
    };

    const isFile = window.location.protocol === 'file:';
    const currentBasename = getBasename(window.location.pathname) || 'index.html';
    const currentPath = (window.location.pathname || '').replace(/\/+/g, '/');

    links.forEach((a) => {
      const href = a.getAttribute('href');
      if (!href) return;
      if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('#')) return;

      const hrefBasename = getBasename(href) || 'index.html';

      let match = false;
      if (isFile) {
        match = hrefBasename === currentBasename;
      } else {
        // For hosted mode, do a conservative match by pathname ending.
        match = currentPath.endsWith('/' + hrefBasename) || (hrefBasename === 'index.html' && (currentPath === '/' || currentPath.endsWith('/index.html')));
      }

      if (match) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  // Simple lightbox for the office gallery.
  const LIGHTBOX_ID = 'pp-lightbox';
  let lightboxEl = null;
  let lightboxImg = null;
  let lightboxCaption = null;
  let lightboxCloseBtn = null;
  let previousFocus = null;

  const ensureLightbox = () => {
    if (lightboxEl) return;

    const overlay = document.createElement('div');
    overlay.id = LIGHTBOX_ID;
    overlay.className = 'pp-lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Kép nagy nézet');
    overlay.hidden = true;
    // Fallback inline styles so it still centers even if CSS fails to load.
    overlay.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:2000',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'padding:20px',
      'background:rgba(0,0,0,.86)'
    ].join(';');
    // Inline `display:flex` would override the default `[hidden]{display:none}`.
    // We toggle display manually on open/close.
    overlay.style.display = 'none';

    const content = document.createElement('div');
    content.className = 'pp-lightbox__content';
    content.style.cssText = 'position:relative;width:min(1100px,96vw)';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'pp-lightbox__close';
    closeBtn.setAttribute('aria-label', 'Bezárás');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = [
      'position:absolute',
      'top:-8px',
      'right:-8px',
      'width:44px',
      'height:44px',
      'border-radius:999px',
      'border:1px solid rgba(255,255,255,.22)',
      'background:rgba(20,20,20,.6)',
      'color:#fff',
      'font-size:30px',
      'line-height:1',
      'cursor:pointer'
    ].join(';');

    const figure = document.createElement('figure');
    figure.className = 'pp-lightbox__figure';

    const img = document.createElement('img');
    img.className = 'pp-lightbox__img';
    img.alt = '';
    img.decoding = 'async';
    img.style.cssText = [
      'display:block',
      'width:100%',
      'height:auto',
      'max-height:84vh',
      'object-fit:contain',
      'border-radius:14px',
      'background:rgba(0,0,0,.25)'
    ].join(';');

    const caption = document.createElement('figcaption');
    caption.className = 'pp-lightbox__caption';
    caption.style.cssText = 'margin-top:12px;color:rgba(255,255,255,.92);text-align:center;font-size:0.95rem';

    figure.appendChild(img);
    figure.appendChild(caption);
    content.appendChild(closeBtn);
    content.appendChild(figure);
    overlay.appendChild(content);
    document.body.appendChild(overlay);

    const close = () => {
      if (!lightboxEl || lightboxEl.hidden) return;
      lightboxEl.hidden = true;
      lightboxEl.style.display = 'none';
      document.body.classList.remove('lightbox-open');
      document.documentElement.style.overflow = '';
      if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
      previousFocus = null;
      if (lightboxImg) lightboxImg.removeAttribute('src');
      if (lightboxCaption) lightboxCaption.textContent = '';
    };

    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      close();
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightboxEl && !lightboxEl.hidden) close();
    });

    lightboxEl = overlay;
    lightboxImg = img;
    lightboxCaption = caption;
    lightboxCloseBtn = closeBtn;
    lightboxEl.__close = close;
  };

  const openLightbox = ({ src, altText }) => {
    ensureLightbox();
    if (!lightboxEl || !lightboxImg) return;

    previousFocus = document.activeElement;
    lightboxImg.src = src;
    lightboxImg.alt = altText || '';
    if (lightboxCaption) lightboxCaption.textContent = altText || '';

    document.body.classList.add('lightbox-open');
    document.documentElement.style.overflow = 'hidden';
    lightboxEl.hidden = false;
    lightboxEl.style.display = 'flex';
    if (lightboxCloseBtn) lightboxCloseBtn.focus();
  };

  document.addEventListener('click', (e) => {
    const link = e.target && e.target.closest ? e.target.closest('.gallery a[href]') : null;
    if (!link) return;
    if (e.defaultPrevented) return;
    if (e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const href = link.getAttribute('href');
    if (!href) return;

    const img = link.querySelector('img');
    const altText = (img && img.getAttribute('alt')) || link.getAttribute('aria-label') || '';

    e.preventDefault();
    openLightbox({ src: link.href, altText });
  });
})();
