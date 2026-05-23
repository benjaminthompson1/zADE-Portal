/* ==========================================================================
   zADE Portal — Main JavaScript
   Served as a static resource from the Liberty WAR root.
   No inline scripts: this file is referenced with <script defer> in index.html,
   allowing a stricter Content-Security-Policy (script-src 'self').
   ========================================================================== */

(function () {
  'use strict';

  /* ── Global error handling ── */
  window.addEventListener('error', function (e) {
    if (!e.filename || !e.filename.includes('status')) {
      showNotification('An unexpected error occurred. Please try again.', 'error');
    }
  });

  window.addEventListener('unhandledrejection', function (e) {
    if (!e.reason || !String(e.reason.message).includes('status')) {
      showNotification('A background operation failed. Please try again.', 'error');
    }
    e.preventDefault();
  });

  /* ── Notifications ── */
  function showNotification(message, type) {
    type = type || 'success';
    var container = document.getElementById('notification-container');
    if (!container) return;
    var n = document.createElement('div');
    n.className = 'notification ' + type;
    n.textContent = message;
    container.appendChild(n);
    n.offsetHeight; // force reflow to trigger CSS transition
    n.classList.add('show');
    setTimeout(function () {
      n.classList.remove('show');
      setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 300);
    }, 4000);
  }

  /* ── Hamburger menu ── */
  function initHamburger() {
    var hamburger = document.getElementById('hamburger');
    var nav = document.getElementById('nav');
    if (!hamburger || !nav) return;

    hamburger.addEventListener('click', function () {
      var open = nav.classList.toggle('show');
      hamburger.setAttribute('aria-expanded', String(open));
    });
  }

  /* ── Scroll: spy + back-to-top visibility ──
     Combined into a single scroll listener to avoid duplicate event overhead. */
  function initScroll() {
    var sections  = document.querySelectorAll('section.section');
    var navLinks  = document.querySelectorAll('.shell-header-nav a');
    var backToTop = document.getElementById('back-to-top');

    window.addEventListener('scroll', function () {
      var y = window.scrollY;

      /* Scroll-spy: highlight the nav link whose section is in view */
      var current = '';
      sections.forEach(function (sec) {
        if (y >= sec.offsetTop - 80) current = sec.id;
      });
      navLinks.forEach(function (link) {
        link.removeAttribute('aria-current');
        if (link.getAttribute('href') === '#' + current) {
          link.setAttribute('aria-current', 'true');
        }
      });

      /* Show/hide the back-to-top button after scrolling 400 px */
      if (backToTop) {
        if (y > 400) {
          backToTop.classList.add('visible');
        } else {
          backToTop.classList.remove('visible');
        }
      }
    });

    /* Back-to-top click */
    if (backToTop) {
      backToTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  /* ── Service status checker ── */
  async function checkService(url, id, timeout) {
    timeout = timeout || 8000;
    var el = document.getElementById(id);
    if (!el) return;

    el.className = 'status-dot loading';
    el.title = 'Checking status\u2026';

    /* Try HEAD first (cheap), fall back to GET (some servers reject HEAD) */
    var reached = false;
    for (var method of ['HEAD', 'GET']) {
      if (reached) break;
      try {
        var ctrl = new AbortController();
        var tid  = setTimeout(function () { ctrl.abort(); }, timeout);
        await fetch(url, { method: method, mode: 'no-cors', signal: ctrl.signal });
        clearTimeout(tid);
        reached = true;
      } catch (_) { /* try next method */ }
    }

    if (reached) {
      el.className = 'status-dot up';
      el.title = 'Service appears to be reachable';
    } else {
      el.className = 'status-dot down';
      el.title = 'Service unreachable';
    }
  }

  var SERVICE_LIST = [
    { url: 'https://s0w1.dal-ebis.ihost.com:10443/zosmf/LogOnPanel.jsp',                                        id: 'zosmf-status'          },
    { url: 'https://s0w1.dal-ebis.ihost.com:7554/zlux/ui/v1/ZLUX/plugins/org.zowe.zlux.bootstrap/web/',        id: 'zowe-status'           },
    { url: 'https://guac.mainframehome.net/#/',                                                                  id: 'guac-status'           },
    { url: 'https://minio.mainframehome.net/browser',                                                            id: 'minio-status'          },
    { url: 'https://zcee3.mainframehome.net/items?startItemID=10',                                               id: 'catalog-list-status'   },
    { url: 'https://zcee3.mainframehome.net/items/10',                                                           id: 'catalog-single-status' },
    { url: 'https://zcee3.mainframehome.net/employees/000010',                                                   id: 'employee-single-status'},
    { url: 'https://zcee3.mainframehome.net/employees?department=A00&job=PRES%20%20%20%20',                     id: 'employee-query-status' },
  ];

  async function checkAllServices() {
    /* Reset all dots to loading */
    SERVICE_LIST.forEach(function (svc) {
      var el = document.getElementById(svc.id);
      if (el) { el.className = 'status-dot loading'; el.title = 'Checking status\u2026'; }
    });

    var btn           = document.getElementById('refresh-btn');
    var lastCheckedEl = document.getElementById('last-checked-status');

    if (btn) { btn.disabled = true; btn.classList.add('spinning'); }

    /* Check services sequentially to avoid hammering the network */
    for (var svc of SERVICE_LIST) {
      await checkService(svc.url, svc.id);
    }

    if (btn) { btn.disabled = false; btn.classList.remove('spinning'); }
    if (lastCheckedEl) {
      lastCheckedEl.textContent = 'Last checked: ' + new Date().toLocaleTimeString();
    }
  }

  /* ── Modal wiring (shared by Help and Lab Info) ── */
  function initModal(triggerId, modalId, closeBtnId) {
    var trigger  = document.getElementById(triggerId);
    var modal    = document.getElementById(modalId);
    var closeBtn = document.getElementById(closeBtnId);
    if (!trigger || !modal || !closeBtn) return;

    function openModal() {
      modal.hidden = false;
      modal.classList.add('visible');
      closeBtn.focus();
    }

    function closeModal() {
      modal.classList.remove('visible');
      setTimeout(function () { modal.hidden = true; }, 250);
      trigger.focus();
    }

    trigger.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hidden) closeModal();
    });
  }

  /* ── Copy-to-clipboard for API endpoint buttons ── */
  function initCopyButtons() {
    document.querySelectorAll('.copy-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var text = btn.getAttribute('data-copy');
        navigator.clipboard.writeText(text).then(function () {
          btn.classList.add('copied');
          var icon = btn.querySelector('i');
          if (icon) { icon.className = 'fas fa-check'; }
          setTimeout(function () {
            btn.classList.remove('copied');
            if (icon) { icon.className = 'fas fa-copy'; }
          }, 2000);
        }).catch(function () {
          showNotification('Could not copy to clipboard.', 'error');
        });
      });
    });
  }

  /* ── Init ── */
  document.addEventListener('DOMContentLoaded', function () {
    initHamburger();
    initModal('help-btn', 'help-modal', 'help-close-btn');
    initModal('labinfo-btn', 'labinfo-modal', 'labinfo-close-btn');
    initScroll();
    initCopyButtons();
    checkAllServices();

    var lastUpdatedEl = document.getElementById('last-updated');
    if (lastUpdatedEl) {
      lastUpdatedEl.textContent = 'Page loaded: ' + new Date().toLocaleString();
    }

    var refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', checkAllServices);
    }
  });

}());
