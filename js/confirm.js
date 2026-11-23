// ============================================
// CONFIRM — Custom Confirmation Dialog
// Replaces window.confirm() with styled modal
// ============================================

const Confirm = (() => {
  function show(message, options = {}) {
    return new Promise((resolve) => {
      const {
        title = I18n.t('confirm_title'),
        confirmText = I18n.t('confirm_yes'),
        cancelText = I18n.t('cancel'),
        variant = 'danger' // 'danger', 'warning', 'primary'
      } = options;

      // Remove any existing confirm modal
      document.getElementById('confirm-modal-overlay')?.remove();

      const overlay = document.createElement('div');
      overlay.id = 'confirm-modal-overlay';
      overlay.className = 'modal-overlay active';
      overlay.innerHTML = `
        <div class="modal confirm-modal">
          <div class="modal-header">
            <h3 class="modal-title">${title}</h3>
          </div>
          <div class="modal-body">
            <p class="confirm-message">${message}</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="confirm-cancel-btn">${cancelText}</button>
            <button class="btn btn-${variant}" id="confirm-ok-btn">${confirmText}</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      const cleanup = (result) => {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
        resolve(result);
      };

      overlay.querySelector('#confirm-ok-btn').addEventListener('click', () => cleanup(true));
      overlay.querySelector('#confirm-cancel-btn').addEventListener('click', () => cleanup(false));
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) cleanup(false);
      });

      // Escape key to cancel
      const escHandler = (e) => {
        if (e.key === 'Escape') {
          document.removeEventListener('keydown', escHandler);
          cleanup(false);
        }
      };
      document.addEventListener('keydown', escHandler);

      // Auto-focus cancel button (safe default)
      setTimeout(() => overlay.querySelector('#confirm-cancel-btn')?.focus(), 50);
    });
  }

  return { show };
})();

window.Confirm = Confirm;

// ============================================
// BUTTON LOADING STATE UTILITY
// ============================================

function setButtonLoading(btn, loading) {
  if (!btn) return;
  if (loading) {
    btn.disabled = true;
    btn.dataset.originalHtml = btn.innerHTML;
    btn.classList.add('btn-loading');
  } else {
    btn.disabled = false;
    if (btn.dataset.originalHtml) {
      btn.innerHTML = btn.dataset.originalHtml;
    }
    btn.classList.remove('btn-loading');
  }
}

window.setButtonLoading = setButtonLoading;

// ============================================
// CSV EXPORT UTILITY
// ============================================

function exportTableToCSV(filename, headers, rows) {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => {
      const str = String(cell == null ? '' : cell).replace(/"/g, '""');
      return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
    }).join(','))
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

window.exportTableToCSV = exportTableToCSV;
