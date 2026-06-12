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

  function show(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${ICONS[type] || ICONS.info}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="this.closest('.toast').remove()">✕</button>
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
