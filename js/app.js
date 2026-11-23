// ============================================
// APP.JS — Bootstrap & Route Registration
// ============================================

(async function () {
  // 1. Initialize i18n
  await I18n.init();

  // 2. Seed demo data
  await dbHelpers.seedDemoData();

  // 3. Register routes
  Router.addRoute('/login', LoginPage.render, {
    afterRender: LoginPage.afterRender,
    requiresAuth: false,
    titleKey: 'login_title'
  });

  Router.addRoute('/dashboard', DashboardPage.render, {
    afterRender: DashboardPage.afterRender,
    requiresAuth: true,
    titleKey: 'dashboard_title'
  });

  Router.addRoute('/stock', StockPage.render, {
    afterRender: StockPage.afterRender,
    requiresAuth: true,
    titleKey: 'stock_title'
  });

  Router.addRoute('/customers', CustomersPage.render, {
    afterRender: CustomersPage.afterRender,
    requiresAuth: true,
    titleKey: 'customers_title'
  });

  Router.addRoute('/transactions', TransactionsPage.render, {
    afterRender: TransactionsPage.afterRender,
    requiresAuth: true,
    titleKey: 'transactions_title'
  });

  Router.addRoute('/receipt/:id', ReceiptPage.render, {
    afterRender: ReceiptPage.afterRender,
    requiresAuth: true,
    titleKey: 'receipt_title'
  });

  Router.addRoute('/admin/payments', AdminPaymentsPage.render, {
    afterRender: AdminPaymentsPage.afterRender,
    requiresAuth: true,
    adminOnly: true,
    titleKey: 'admin_payments_title'
  });

  // 4. Initialize sync engine
  Sync.init();

  // 5. Setup global UI handlers
  setupGlobalHandlers();

  // 5b. Global keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Escape closes any open modal
    if (e.key === 'Escape') {
      const modal = document.querySelector('.modal-overlay.active');
      if (modal) {
        modal.classList.remove('active');
        return;
      }
    }
    // Alt+N → new transaction
    if (e.altKey && e.key === 'n') {
      e.preventDefault();
      if (Auth.getCurrentUser()) window.location.hash = '#/transactions?new=1';
    }
    // Alt+S → focus search on current page
    if (e.altKey && e.key === 's') {
      e.preventDefault();
      const search = document.querySelector('#transaction-search, #stock-search, #customer-search, #payment-search');
      if (search) search.focus();
    }
  });

  // 6. Update user info in sidebar
  updateSidebarUser();

  // 7. Apply saved theme
  applyTheme();

  // 8. Start router
  Router.init();

  // 9. Register service worker
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('./sw.js');
    } catch (e) {
      console.log('SW registration failed:', e);
    }
  }
})();

function setupGlobalHandlers() {
  // Sidebar toggle (mobile)
  const sidebarToggle = document.getElementById('btn-sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      sidebar?.classList.toggle('open');
      overlay?.classList.toggle('visible');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar?.classList.remove('open');
      overlay?.classList.remove('visible');
    });
  }

  // Close sidebar on nav click (mobile)
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      if (window.innerWidth <= 1024) {
        sidebar?.classList.remove('open');
        overlay?.classList.remove('visible');
      }
    });
  });

  // Theme toggle
  const themeToggle = document.getElementById('btn-theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  // Language toggle
  const langToggle = document.getElementById('btn-lang-toggle');
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      const newLang = I18n.getLang() === 'en' ? 'ne' : 'en';
      I18n.setLanguage(newLang);
      // Re-render current page to update dynamic content
      Router.navigate(window.location.hash);
    });
  }

  // Logout button
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => Auth.logout());
  }

  // Sync button
  const syncBtn = document.getElementById('btn-sync');
  if (syncBtn) {
    syncBtn.addEventListener('click', () => Sync.syncNow());
  }

  // Sync status click
  const syncStatus = document.getElementById('sync-status');
  if (syncStatus) {
    syncStatus.addEventListener('click', () => Sync.syncNow());
  }
}

function updateSidebarUser() {
  const user = Auth.getCurrentUser();
  if (!user) return;

  const nameEl = document.getElementById('sidebar-user-name');
  const roleEl = document.getElementById('sidebar-user-role');
  const avatarEl = document.getElementById('sidebar-user-avatar');

  if (nameEl) nameEl.textContent = user.displayName;
  if (roleEl) roleEl.textContent = I18n.t(user.role === 'admin' ? 'role_admin' : 'role_staff');
  if (avatarEl) avatarEl.textContent = Auth.getInitials();

  // Show/hide admin nav
  const adminNav = document.getElementById('admin-nav-section');
  if (adminNav) {
    adminNav.style.display = user.role === 'admin' ? 'block' : 'none';
  }
}

function applyTheme() {
  const savedTheme = localStorage.getItem('app_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('app_theme', newTheme);
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('btn-theme-toggle');
  if (btn) {
    btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    btn.title = theme === 'dark' ? I18n.t('theme_light') : I18n.t('theme_dark');
  }
}
