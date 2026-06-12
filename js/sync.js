// ============================================
// SYNC ENGINE — Online/Offline Detection
// ============================================

const Sync = (() => {
  function init() {
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    updateStatus();
    updatePendingCount();
  }

  function updateStatus() {
    const isOnline = navigator.onLine;
    const statusEl = document.getElementById('sync-status');
    const bannerEl = document.getElementById('offline-banner');
    const dotEl = statusEl?.querySelector('.sync-dot');
    const textEl = statusEl?.querySelector('.sync-text');

    if (statusEl) {
      statusEl.className = `sync-status ${isOnline ? 'online' : 'offline'}`;
    }
    if (textEl) {
      textEl.setAttribute('data-i18n', isOnline ? 'sync_online' : 'sync_offline');
      textEl.textContent = I18n.t(isOnline ? 'sync_online' : 'sync_offline');
    }

    // Show offline banner only when offline
    if (!isOnline && bannerEl) {
      bannerEl.classList.add('visible');
    } else if (bannerEl) {
      bannerEl.classList.remove('visible');
    }

    updatePendingCount();
  }

  async function updatePendingCount() {
    try {
      const count = await appDb.syncQueue.count();
      const pendingEl = document.getElementById('sync-pending-count');
      if (pendingEl) {
        if (count > 0) {
          pendingEl.textContent = `${I18n.formatNumber(count)} ${I18n.t('sync_pending')}`;
          pendingEl.style.display = 'inline';
        } else {
          pendingEl.style.display = 'none';
        }
      }
    } catch (e) {
      // DB not ready yet
    }
  }

  async function syncNow() {
    try {
      // Clear sync queue
      await appDb.syncQueue.clear();

      // Mark all records as synced
      await appDb.transactions.toCollection().modify({ syncStatus: 'synced' });
      await appDb.customers.toCollection().modify({ syncStatus: 'synced' });
      await appDb.products.toCollection().modify({ syncStatus: 'synced' });

      updatePendingCount();
      Toast.success(I18n.t('sync_success'));
    } catch (e) {
      Toast.error('Sync failed: ' + e.message);
    }
  }

  return { init, updateStatus, updatePendingCount, syncNow };
})();

window.Sync = Sync;
