/* ==========================================================================
   鱼心快跑 · yuxin.run — interactions
   Vanilla JS. Everything degrades gracefully without it.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Theme ---------- */
  var THEME_KEY = 'yr-theme';
  var themeBtn = $('#themeToggle');
  var themeMeta = $('meta[name="theme-color"]');

  function applyTheme(theme, persist) {
    root.dataset.theme = theme;
    if (themeMeta) themeMeta.setAttribute('content', theme === 'dark' ? '#0F1413' : '#F6F3EC');
    if (themeBtn) {
      themeBtn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      themeBtn.setAttribute('aria-label', theme === 'dark' ? '切换到浅色主题' : '切换到深色主题');
    }
    if (persist) {
      try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* private mode */ }
    }
  }

  applyTheme(root.dataset.theme === 'dark' ? 'dark' : 'light', false);

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true);
    });
  }

  /* ---------- Header, progress, back-to-top ---------- */
  var header = $('#siteHeader');
  var progress = $('#progressBar');
  var toTop = $('#toTop');
  var ticking = false;

  function onScrollFrame() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle('is-scrolled', y > 10);

    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? Math.min(y / max, 1) : 0;
      progress.style.transform = 'scaleX(' + ratio.toFixed(4) + ')';
    }

    if (toTop) toTop.classList.toggle('is-visible', y > 640);
    ticking = false;
  }

  function requestScrollFrame() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(onScrollFrame);
    }
  }

  window.addEventListener('scroll', requestScrollFrame, { passive: true });
  window.addEventListener('resize', requestScrollFrame);
  onScrollFrame();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    });
  }

  /* ---------- Mobile menu ---------- */
  var menu = $('#mobileMenu');
  var menuBtn = $('#menuToggle');

  function setMenu(open, returnFocus) {
    if (!menu || !menuBtn) return;
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuBtn.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
    document.body.classList.toggle('is-locked', open);

    if (open) {
      var first = $('a', menu);
      if (first) first.focus({ preventScroll: true });
    } else if (returnFocus) {
      menuBtn.focus({ preventScroll: true });
    }
  }

  if (menu && menuBtn) {
    menuBtn.addEventListener('click', function () {
      setMenu(!menu.classList.contains('is-open'), true);
    });

    $$('a', menu).forEach(function (link) {
      link.addEventListener('click', function () { setMenu(false); });
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && menu.classList.contains('is-open')) {
        setMenu(false, true);
      }
    });

    var desktopQuery = window.matchMedia('(min-width: 901px)');
    var onBreakpoint = function (event) { if (event.matches) setMenu(false); };
    if (desktopQuery.addEventListener) desktopQuery.addEventListener('change', onBreakpoint);
    else desktopQuery.addListener(onBreakpoint);
  }

  /* ---------- Scroll reveal ---------- */
  var revealEls = $$('.reveal');
  var terminal = $('.terminal');

  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-inview');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    revealEls.forEach(function (el) { revealObserver.observe(el); });

    if (terminal) {
      var terminalObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            terminal.classList.add('is-inview');
            terminalObserver.disconnect();
          }
        });
      }, { threshold: 0.25 });
      terminalObserver.observe(terminal);
    }
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-inview'); });
    if (terminal) terminal.classList.add('is-inview');
  }

  /* ---------- Active nav link ---------- */
  var navLinks = $$('#primaryNav a');
  var sections = $$('main section[id]');

  function markActive(id) {
    navLinks.forEach(function (link) {
      var isActive = link.getAttribute('href') === '#' + id;
      link.classList.toggle('is-active', isActive);
      if (isActive) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }

  if ('IntersectionObserver' in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) markActive(entry.target.id);
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (section) { spy.observe(section); });
  }

  /* ---------- Copy email ---------- */
  var copyBtn = $('#copyEmail');
  var toast = $('#toast');
  var toastTimer = null;
  var EMAIL = 'hello@yuxin.run';

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 2600);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  }

  function legacyCopy(text) {
    var field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.top = '-200px';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(field);
    return ok;
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      copyText(EMAIL).then(function (ok) {
        showToast(ok ? '邮箱已复制：' + EMAIL : '请手动复制：' + EMAIL);
      });
    });
  }

  /* ---------- Hero card tilt (fine pointers only) ---------- */
  var tiltCard = $('[data-tilt]');

  if (tiltCard && window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduceMotion.matches) {
    var frameRequested = false;
    var targetX = 0;
    var targetY = 0;

    var renderTilt = function () {
      tiltCard.style.setProperty('--tx', targetX.toFixed(2) + 'px');
      tiltCard.style.setProperty('--ty', targetY.toFixed(2) + 'px');
      frameRequested = false;
    };

    tiltCard.addEventListener('pointermove', function (event) {
      var rect = tiltCard.getBoundingClientRect();
      var relX = (event.clientX - rect.left) / rect.width - 0.5;
      var relY = (event.clientY - rect.top) / rect.height - 0.5;
      targetX = relX * 10;
      targetY = relY * 8;
      if (!frameRequested) {
        frameRequested = true;
        window.requestAnimationFrame(renderTilt);
      }
    });

    tiltCard.addEventListener('pointerleave', function () {
      targetX = 0;
      targetY = 0;
      window.requestAnimationFrame(renderTilt);
    });
  }

  /* ---------- Little easter egg: the fish wiggles ---------- */
  $$('.brand-mark, .logo-frame').forEach(function (mark) {
    mark.addEventListener('click', function () {
      mark.classList.remove('is-wiggle');
      void mark.offsetWidth;
      mark.classList.add('is-wiggle');
    });
  });

  /* ---------- Footer year ---------- */
  var year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();