// ============================================
// TOAST — Notification System
// ============================================

const Toast = (() => {
  const ICONS = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  const MAX_VISIBLE = 3;

  function show(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    // Limit visible toasts
    const existing = container.querySelectorAll('.toast:not(.toast-removing)');
    if (existing.length >= MAX_VISIBLE) {
      const oldest = existing[0];
      oldest.classList.add('toast-removing');
      setTimeout(() => oldest.remove(), 300);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${ICONS[type] || ICONS.info}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="this.closest('.toast').remove()">✕</button>
      <div class="toast-progress"><div class="toast-progress-bar" style="animation-duration:${duration}ms"></div></div>
    `;

    container.appendChild(toast);

    // Auto remove
    setTimeout(() => {
      toast.classList.add('toast-removing');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  function success(message) { show(message, 'success'); }
  function error(message) { show(message, 'error', 5000); }
  function warning(message) { show(message, 'warning'); }
  function info(message) { show(message, 'info'); }

  return { show, success, error, warning, info };
})();

window.Toast = Toast;
