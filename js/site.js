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
  let lightboxPrevBtn = null;
  let lightboxNextBtn = null;
  let previousFocus = null;
  let lightboxItems = [];
  let lightboxIndex = 0;

  const clampIndex = (value, length) => {
    if (!length) return 0;
    const n = value % length;
    return n < 0 ? n + length : n;
  };

  const renderLightbox = () => {
    if (!lightboxImg) return;
    const item = lightboxItems[lightboxIndex];
    if (!item) return;

    lightboxImg.src = item.src;
    lightboxImg.alt = item.altText || '';
    if (lightboxCaption) {
      let captionText = item.altText || '';
      if (lightboxItems.length > 1) {
        const counter = `${lightboxIndex + 1}/${lightboxItems.length}`;
        captionText = captionText ? `${captionText} — ${counter}` : counter;
      }
      lightboxCaption.textContent = captionText;
    }

    const multi = lightboxItems.length > 1;
    if (lightboxPrevBtn) {
      lightboxPrevBtn.disabled = !multi;
      lightboxPrevBtn.setAttribute('aria-disabled', (!multi).toString());
      lightboxPrevBtn.style.display = multi ? 'flex' : 'none';
    }
    if (lightboxNextBtn) {
      lightboxNextBtn.disabled = !multi;
      lightboxNextBtn.setAttribute('aria-disabled', (!multi).toString());
      lightboxNextBtn.style.display = multi ? 'flex' : 'none';
    }
  };

  const stepLightbox = (delta) => {
    if (!lightboxItems.length) return;
    lightboxIndex = clampIndex(lightboxIndex + delta, lightboxItems.length);
    renderLightbox();
  };

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

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'pp-lightbox__nav pp-lightbox__prev';
    prevBtn.setAttribute('aria-label', 'Előző kép');
    prevBtn.textContent = '‹';
    prevBtn.style.cssText = [
      'position:absolute',
      'top:50%',
      'left:-8px',
      'transform:translateY(-50%)',
      'width:46px',
      'height:46px',
      'border-radius:999px',
      'border:1px solid rgba(255,255,255,.22)',
      'background:rgba(20,20,20,.6)',
      'color:#fff',
      'font-size:34px',
      'line-height:1',
      'cursor:pointer',
      'display:none'
    ].join(';');

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'pp-lightbox__nav pp-lightbox__next';
    nextBtn.setAttribute('aria-label', 'Következő kép');
    nextBtn.textContent = '›';
    nextBtn.style.cssText = [
      'position:absolute',
      'top:50%',
      'right:-8px',
      'transform:translateY(-50%)',
      'width:46px',
      'height:46px',
      'border-radius:999px',
      'border:1px solid rgba(255,255,255,.22)',
      'background:rgba(20,20,20,.6)',
      'color:#fff',
      'font-size:34px',
      'line-height:1',
      'cursor:pointer',
      'display:none'
    ].join(';');

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
      lightboxItems = [];
      lightboxIndex = 0;
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

    prevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (prevBtn.disabled) return;
      stepLightbox(-1);
    });

    nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (nextBtn.disabled) return;
      stepLightbox(1);
    });

    document.addEventListener('keydown', (e) => {
      if (!lightboxEl || lightboxEl.hidden) return;
      if (e.key === 'Escape') {
        close();
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        stepLightbox(-1);
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        stepLightbox(1);
      }
    });

    lightboxEl = overlay;
    lightboxImg = img;
    lightboxCaption = caption;
    lightboxCloseBtn = closeBtn;
    lightboxPrevBtn = prevBtn;
    lightboxNextBtn = nextBtn;
    lightboxEl.__close = close;

    // Insert nav buttons last so they're above the image.
    content.appendChild(prevBtn);
    content.appendChild(nextBtn);
  };

  const openLightbox = ({ items, index, src, altText }) => {
    ensureLightbox();
    if (!lightboxEl || !lightboxImg) return;

    previousFocus = document.activeElement;
    if (Array.isArray(items) && items.length) {
      lightboxItems = items;
      lightboxIndex = clampIndex(typeof index === 'number' ? index : 0, lightboxItems.length);
    } else {
      lightboxItems = [{ src, altText }];
      lightboxIndex = 0;
    }
    renderLightbox();

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

    e.preventDefault();

    const gallery = link.closest('.gallery');
    const galleryLinks = gallery ? Array.from(gallery.querySelectorAll('a[href]')) : [link];
    const items = galleryLinks.map((a) => {
      const img = a.querySelector('img');
      const altText = (img && img.getAttribute('alt')) || a.getAttribute('aria-label') || '';
      return { src: a.href, altText };
    });
    const index = Math.max(0, galleryLinks.indexOf(link));

    openLightbox({ items, index });
  });
})();
