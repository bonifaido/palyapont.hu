(function () {
  const nav = document.getElementById('topnav');
  if (!nav) return;

  const toggle = document.querySelector('.nav-toggle');
  if (toggle) {
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
})();
