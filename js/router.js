// ============================================
// ROUTER — Hash-based SPA Router
// ============================================

const Router = (() => {
  let routes = [];
  let currentRoute = null;

  function addRoute(path, handler, options = {}) {
    routes.push({ path, handler, ...options });
  }

  function matchRoute(hash) {
    // Strip query parameters before matching
    const fullPath = hash.replace('#', '') || '/login';
    const path = fullPath.split('?')[0];

    for (const route of routes) {
      // Handle parametric routes like /receipt/:id
      const paramNames = [];
      const regexStr = route.path.replace(/:([^/]+)/g, (_, name) => {
        paramNames.push(name);
        return '([^/]+)';
      });
      const regex = new RegExp(`^${regexStr}$`);
      const match = path.match(regex);

      if (match) {
        const params = {};
        paramNames.forEach((name, i) => {
          params[name] = match[i + 1];
        });
        return { route, params };
      }
    }
    return null;
  }

  async function navigate(hash) {
    if (!hash) hash = window.location.hash || '#/login';
    const cleanHash = hash.startsWith('#') ? hash : `#${hash}`;

    const matched = matchRoute(cleanHash);

    if (!matched) {
      window.location.hash = '#/dashboard';
      return;
    }

    const { route, params } = matched;

    // Auth guard
    if (route.requiresAuth && !Auth.isLoggedIn()) {
      window.location.hash = '#/login';
      return;
    }

    // Admin guard
    if (route.adminOnly && !Auth.isAdmin()) {
      Toast.warning('Admin access required');
      window.location.hash = '#/dashboard';
      return;
    }

    // If logged in and trying to access login, redirect to dashboard
    if (route.path === '/login' && Auth.isLoggedIn()) {
      window.location.hash = '#/dashboard';
      return;
    }

    currentRoute = route;

    // Update page layout based on route
    const appLayout = document.getElementById('app-layout');
    const loginLayout = document.getElementById('login-layout');
    const pageContainer = document.getElementById('page-container');

    if (route.path === '/login') {
      if (appLayout) appLayout.style.display = 'none';
      if (loginLayout) loginLayout.style.display = 'flex';
      // Render login into login layout
      try {
        const html = await route.handler(params);
        if (loginLayout) loginLayout.innerHTML = html;
        I18n.translatePage();
        route.afterRender?.(params);
      } catch (e) {
        console.error('Router: Error rendering login', e);
      }
    } else {
      if (loginLayout) loginLayout.style.display = 'none';
      if (appLayout) appLayout.style.display = 'flex';

      // Update sidebar active state
      updateSidebarActive(cleanHash);

      // Update topbar title
      if (route.titleKey) {
        const topbarTitle = document.getElementById('topbar-title');
        if (topbarTitle) {
          topbarTitle.setAttribute('data-i18n', route.titleKey);
          topbarTitle.textContent = I18n.t(route.titleKey);
        }
      }

      // Render page content
      try {
        const html = await route.handler(params);
        if (pageContainer) {
          pageContainer.innerHTML = html;
          // Apply translations after DOM insertion
          I18n.translatePage();
          // Call afterRender hook
          route.afterRender?.(params);
        }
      } catch (e) {
        console.error('Router: Error rendering page', e);
        if (pageContainer) {
          pageContainer.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Error loading page</div></div>`;
        }
      }
    }
  }

  function updateSidebarActive(hash) {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
      const href = item.getAttribute('data-route');
      if (href && hash.startsWith('#' + href)) {
        item.classList.add('active');
      }
    });
  }

  function init() {
    window.addEventListener('hashchange', () => navigate(window.location.hash));
    navigate(window.location.hash);
  }

  function getCurrentRoute() {
    return currentRoute;
  }

  return { addRoute, navigate, init, getCurrentRoute };
})();

window.Router = Router;
