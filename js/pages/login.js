// ============================================
// LOGIN PAGE
// ============================================

const LoginPage = (() => {
  function render() {
    const savedUsername = localStorage.getItem('last_username') || '';
    return `
      <div class="login-card">
        <div class="login-header">
          <div class="login-logo">NP</div>
          <h2 data-i18n="login_title">Welcome Back</h2>
          <p data-i18n="login_subtitle">Sign in to your account</p>
        </div>
        <form class="login-form" id="login-form">
          <div class="form-group">
            <label data-i18n="login_username">Username</label>
            <input type="text" id="login-username" class="form-input" data-i18n="login_username" autocomplete="username" value="${savedUsername}" required>
          </div>
          <div class="form-group">
            <label data-i18n="login_password">Password</label>
            <div class="password-wrapper">
              <input type="password" id="login-password" class="form-input" data-i18n="login_password" autocomplete="current-password" required>
              <button type="button" class="btn-show-password" id="btn-toggle-password" title="${I18n.t('show_password')}">👁</button>
            </div>
          </div>
          <div class="login-error" id="login-error"></div>
          <button type="submit" class="login-btn" data-i18n="login_btn">Sign In</button>
        </form>
        <div class="login-hint">
          <span data-i18n="login_hint">Demo credentials</span>: <code>admin / admin123</code>
        </div>
      </div>
    `;
  }

  function afterRender() {
    const form = document.getElementById('login-form');
    if (form) {
      form.addEventListener('submit', handleLogin);
    }

    // Password toggle
    const toggleBtn = document.getElementById('btn-toggle-password');
    const passwordInput = document.getElementById('login-password');
    if (toggleBtn && passwordInput) {
      toggleBtn.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        toggleBtn.textContent = isPassword ? '🙈' : '👁';
        toggleBtn.title = isPassword ? I18n.t('hide_password') : I18n.t('show_password');
      });
    }

    // Focus: if username is saved, focus password; else focus username
    const usernameInput = document.getElementById('login-username');
    if (usernameInput && usernameInput.value) {
      setTimeout(() => passwordInput?.focus(), 100);
    } else {
      setTimeout(() => usernameInput?.focus(), 100);
    }
  }

  function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();
    const errorEl = document.getElementById('login-error');

    if (!username || !password) {
      errorEl.textContent = I18n.t('error_fill_required');
      errorEl.style.animation = 'none';
      errorEl.offsetHeight; // reflow
      errorEl.style.animation = 'shake 0.4s ease';
      return;
    }

    const result = Auth.login(username, password);
    if (result.success) {
      localStorage.setItem('last_username', username);
      window.location.hash = '#/dashboard';
      setTimeout(() => {
        updateUserInfo();
        Sync.updateStatus();
      }, 100);
    } else {
      errorEl.textContent = I18n.t('login_error');
      errorEl.style.animation = 'none';
      errorEl.offsetHeight;
      errorEl.style.animation = 'shake 0.4s ease';
    }
  }

  function updateUserInfo() {
    const user = Auth.getCurrentUser();
    if (!user) return;
    const nameEl = document.getElementById('sidebar-user-name');
    const roleEl = document.getElementById('sidebar-user-role');
    const avatarEl = document.getElementById('sidebar-user-avatar');
    if (nameEl) nameEl.textContent = user.displayName;
    if (roleEl) roleEl.textContent = user.role;
    if (avatarEl) avatarEl.textContent = Auth.getInitials();
  }

  return { render, afterRender };
})();

window.LoginPage = LoginPage;
