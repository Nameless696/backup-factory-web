// ============================================
// CUSTOMER MANAGEMENT PAGE
// Components: Customer Detail Modal, RBAC
// ============================================

const CustomersPage = (() => {

  async function render() {
    const customers = await appDb.customers.toArray();
    const transactions = await appDb.transactions.toArray();
    const isAdmin = Auth.isAdmin();
    const canEdit = Auth.hasPermission('edit_customer');
    const canDelete = Auth.hasPermission('delete_customer');
    const canAdd = Auth.hasPermission('add_customer');

    // Compute per-customer stats
    const customerStats = {};
    transactions.forEach(t => {
      if (!customerStats[t.customerId]) {
        customerStats[t.customerId] = { totalPurchases: 0, pendingDues: 0, count: 0 };
      }
      customerStats[t.customerId].totalPurchases += (t.totalAmount || 0);
      customerStats[t.customerId].pendingDues += (t.dueAmount || 0);
      customerStats[t.customerId].count++;
    });

    let rowsHtml = '';
    if (customers.length === 0) {
      rowsHtml = `<tr><td colspan="6" class="table-empty"><div class="table-empty-icon">👥</div><span data-i18n="no_customers">No customers yet</span></td></tr>`;
    } else {
      rowsHtml = customers.map(c => {
        const stats = customerStats[c.id] || { totalPurchases: 0, pendingDues: 0 };
        return `
          <tr class="clickable-row" data-action="view-customer" data-id="${c.id}">
            <td><strong>${c.name}</strong> ${c.isFrequent ? '<span class="badge badge-primary" style="font-size:0.65rem;padding:2px 6px;">★</span>' : ''}</td>
            <td>${c.phone || '-'}</td>
            <td>${c.panNo || '-'}</td>
            <td class="customer-purchases">${I18n.formatCurrencyShort(stats.totalPurchases)}</td>
            <td class="${stats.pendingDues > 0 ? 'customer-dues' : 'customer-dues zero'}">${I18n.formatCurrencyShort(stats.pendingDues)}</td>
            <td>
              <div class="product-actions" onclick="event.stopPropagation()">
                ${canEdit ? `<button class="btn btn-secondary btn-sm" data-action="edit-customer" data-id="${c.id}">✏️</button>` : ''}
                ${canDelete ? `<button class="btn btn-danger btn-sm" data-action="delete-customer" data-id="${c.id}">🗑️</button>` : ''}
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }

    return `
      <div class="page-header">
        <div class="page-header-left">
          <h2 data-i18n="customers_title">Customers</h2>
          <p data-i18n="customers_subtitle">Manage your customer database</p>
        </div>
        ${canAdd ? `
          <div class="page-header-actions">
            <button class="btn btn-primary" id="btn-add-customer">
              <span>+</span> <span data-i18n="add_customer">Add Customer</span>
            </button>
          </div>
        ` : ''}
      </div>

      <div class="actions-row">
        <div class="search-bar">
          <span class="search-bar-icon">🔍</span>
          <input type="text" class="form-input" id="customer-search" data-i18n="search_customers" placeholder="Search customers...">
        </div>
      </div>

      <div class="card">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th data-i18n="customer_name">Customer Name</th>
                <th data-i18n="phone">Phone</th>
                <th data-i18n="pan_no">PAN No.</th>
                <th data-i18n="total_purchases">Total Purchases</th>
                <th data-i18n="pending_dues_col">Pending Dues</th>
                <th data-i18n="actions">Actions</th>
              </tr>
            </thead>
            <tbody id="customers-tbody">
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Customer Edit Modal -->
      <div class="modal-overlay" id="customer-modal">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title" id="customer-modal-title" data-i18n="add_customer_title">Add Customer</h3>
            <button class="modal-close" data-action="close-modal">✕</button>
          </div>
          <div class="modal-body">
            <form id="customer-form">
              <input type="hidden" id="customer-edit-id">
              <div class="form-group">
                <label class="form-label" data-i18n="customer_name">Customer Name</label>
                <input type="text" class="form-input" id="customer-name-input" required>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" data-i18n="phone">Phone</label>
                  <input type="tel" class="form-input" id="customer-phone">
                </div>
                <div class="form-group">
                  <label class="form-label" data-i18n="pan_no">PAN No.</label>
                  <input type="text" class="form-input" id="customer-pan">
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">
                  <input type="checkbox" id="customer-frequent"> <span data-i18n="is_frequent">Frequent Buyer</span>
                </label>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" data-action="close-modal" data-i18n="cancel">Cancel</button>
            <button class="btn btn-primary" id="btn-save-customer" data-i18n="save">Save</button>
          </div>
        </div>
      </div>

      <!-- Customer Detail Modal -->
      <div class="modal-overlay" id="customer-detail-modal-page">
        <div class="modal modal-lg">
          <div class="modal-header">
            <h3 class="modal-title" data-i18n="customer_detail">${I18n.t('customer_detail')}</h3>
            <div class="modal-header-actions">
              <button class="btn btn-ghost btn-sm" data-action="toggle-cd-fullscreen" title="Expand">⛶</button>
              <button class="modal-close" data-action="close-customer-detail">✕</button>
            </div>
          </div>
          <div class="modal-body" id="customer-detail-body-page">
            <!-- Dynamic content -->
          </div>
        </div>
      </div>
    `;
  }

  function afterRender() {
    const container = document.getElementById('page-container');
    if (!container) return;

    container.addEventListener('click', handleClick);

    const searchInput = document.getElementById('customer-search');
    if (searchInput) {
      searchInput.addEventListener('input', handleSearch);
    }

    // Close modals on overlay click
    const detailModal = document.getElementById('customer-detail-modal-page');
    if (detailModal) {
      detailModal.addEventListener('click', (e) => {
        if (e.target === detailModal) closeCustomerDetailModal();
      });
    }
  }

  function handleClick(e) {
    const action = e.target.closest('[data-action]')?.dataset.action;

    if (e.target.closest('#btn-add-customer')) {
      openCustomerModal();
      return;
    }
    if (e.target.closest('#btn-save-customer')) {
      saveCustomer();
      return;
    }

    if (!action) return;

    switch (action) {
      case 'close-modal':
        closeCustomerModal();
        break;
      case 'edit-customer':
        e.stopPropagation();
        editCustomer(e.target.closest('[data-action]').dataset.id);
        break;
      case 'delete-customer':
        e.stopPropagation();
        deleteCustomer(e.target.closest('[data-action]').dataset.id);
        break;
      case 'view-customer':
        openCustomerDetail(parseInt(e.target.closest('[data-action]').dataset.id));
        break;
      case 'close-customer-detail':
        closeCustomerDetailModal();
        break;
      case 'toggle-cd-fullscreen':
        const modal = document.querySelector('#customer-detail-modal-page .modal');
        modal?.classList.toggle('modal-fullscreen');
        break;
    }
  }

  // ============================================
  // CUSTOMER DETAIL VIEW (Component 5)
  // ============================================

  async function openCustomerDetail(customerId) {
    const modal = document.getElementById('customer-detail-modal-page');
    const body = document.getElementById('customer-detail-body-page');
    if (!modal || !body) return;

    const customer = await appDb.customers.get(customerId);
    if (!customer) return;

    const allTransactions = await appDb.transactions.toArray();
    const custTransactions = allTransactions.filter(t => t.customerId === customerId);
    const totalSpending = custTransactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
    const pendingDues = custTransactions.reduce((sum, t) => sum + (t.dueAmount || 0), 0);

    // Most purchased items
    const itemCounts = {};
    custTransactions.forEach(t => {
      (t.items || []).forEach(item => {
        if (!itemCounts[item.name]) {
          itemCounts[item.name] = { name: item.name, qty: 0, total: 0 };
        }
        itemCounts[item.name].qty += item.qty;
        itemCounts[item.name].total += item.total;
      });
    });
    const topItems = Object.values(itemCounts).sort((a, b) => b.qty - a.qty).slice(0, 5);

    // Transaction history sorted by date desc
    const txSorted = custTransactions.sort((a, b) => b.date.localeCompare(a.date));

    const topItemsHtml = topItems.length > 0
      ? topItems.map(item => `
          <div class="top-item">
            <span class="top-item-name">${item.name}</span>
            <span class="top-item-qty">${I18n.formatNumber(item.qty)} ${I18n.t('times_purchased')}</span>
            <span class="top-item-total">${I18n.formatCurrencyShort(item.total)}</span>
          </div>
        `).join('')
      : `<div class="text-muted" style="padding:12px 0;">${I18n.t('no_transactions')}</div>`;

    const getStatusBadge = (status) => {
      const map = {
        paid: { class: 'badge-success', key: 'paid' },
        partial: { class: 'badge-warning', key: 'partial' },
        due: { class: 'badge-danger', key: 'due' }
      };
      const s = map[status] || map.due;
      return `<span class="badge ${s.class}"><span class="badge-dot"></span><span data-i18n="${s.key}">${I18n.t(s.key)}</span></span>`;
    };

    const txHistoryHtml = txSorted.length > 0
      ? txSorted.map(t => `
          <div class="cust-tx-row">
            <div class="cust-tx-info">
              <span class="cust-tx-bill">#${t.billNo}</span>
              <span class="cust-tx-date">${I18n.formatDate(t.date)}</span>
            </div>
            <div class="cust-tx-amounts">
              <span class="cust-tx-total">${I18n.formatCurrencyShort(t.totalAmount)}</span>
              ${getStatusBadge(t.paymentStatus)}
            </div>
            ${t.dueAmount > 0 ? `<div class="cust-tx-due">${I18n.t('due_amount')}: <strong>${I18n.formatCurrencyShort(t.dueAmount)}</strong></div>` : ''}
          </div>
        `).join('')
      : `<div class="text-muted" style="padding:12px 0;">${I18n.t('no_transactions')}</div>`;

    body.innerHTML = `
      <div class="customer-detail-profile">
        <div class="cdp-avatar">${customer.name.charAt(0).toUpperCase()}</div>
        <div class="cdp-info">
          <h3 class="cdp-name">${customer.name}</h3>
          <div class="cdp-meta">
            ${customer.phone ? `<span>📞 ${customer.phone}</span>` : ''}
            ${customer.panNo ? `<span>📋 ${customer.panNo}</span>` : ''}
            ${customer.isFrequent ? `<span class="badge badge-primary">★ ${I18n.t('is_frequent')}</span>` : ''}
          </div>
        </div>
      </div>

      <div class="cdp-stats-grid">
        <div class="cdp-stat-card">
          <div class="cdp-stat-label" data-i18n="total_spending">${I18n.t('total_spending')}</div>
          <div class="cdp-stat-value primary">${I18n.formatCurrencyShort(totalSpending)}</div>
        </div>
        <div class="cdp-stat-card">
          <div class="cdp-stat-label" data-i18n="pending_dues">${I18n.t('pending_dues')}</div>
          <div class="cdp-stat-value ${pendingDues > 0 ? 'danger' : 'success'}">${I18n.formatCurrencyShort(pendingDues)}</div>
        </div>
        <div class="cdp-stat-card">
          <div class="cdp-stat-label" data-i18n="transaction_count">${I18n.t('transaction_count')}</div>
          <div class="cdp-stat-value">${I18n.formatNumber(custTransactions.length)}</div>
        </div>
      </div>

      <div class="cdp-section">
        <h4 data-i18n="most_purchased_items">${I18n.t('most_purchased_items')}</h4>
        <div class="top-items-list">
          ${topItemsHtml}
        </div>
      </div>

      <div class="cdp-section">
        <h4 data-i18n="purchase_history">${I18n.t('purchase_history')}</h4>
        <div class="cust-tx-list">
          ${txHistoryHtml}
        </div>
      </div>
    `;

    modal.classList.add('active');
    I18n.translatePage();
  }

  function closeCustomerDetailModal() {
    const modal = document.getElementById('customer-detail-modal-page');
    modal?.classList.remove('active');
    const inner = modal?.querySelector('.modal');
    inner?.classList.remove('modal-fullscreen');
  }

  // ============================================
  // CRUD Operations
  // ============================================

  function openCustomerModal(customer = null) {
    const modal = document.getElementById('customer-modal');
    const title = document.getElementById('customer-modal-title');
    const editId = document.getElementById('customer-edit-id');

    if (customer) {
      title.setAttribute('data-i18n', 'edit_customer');
      title.textContent = I18n.t('edit_customer');
      editId.value = customer.id;
      document.getElementById('customer-name-input').value = customer.name;
      document.getElementById('customer-phone').value = customer.phone || '';
      document.getElementById('customer-pan').value = customer.panNo || '';
      document.getElementById('customer-frequent').checked = customer.isFrequent || false;
    } else {
      title.setAttribute('data-i18n', 'add_customer_title');
      title.textContent = I18n.t('add_customer_title');
      editId.value = '';
      document.getElementById('customer-form').reset();
    }

    modal.classList.add('active');
    I18n.translatePage();
  }

  function closeCustomerModal() {
    document.getElementById('customer-modal')?.classList.remove('active');
  }

  async function saveCustomer() {
    const name = document.getElementById('customer-name-input').value.trim();
    const phone = document.getElementById('customer-phone').value.trim();
    const panNo = document.getElementById('customer-pan').value.trim();
    const isFrequent = document.getElementById('customer-frequent').checked;
    const editId = document.getElementById('customer-edit-id').value;

    if (!name) {
      Toast.warning(I18n.t('error_fill_required'));
      return;
    }

    const now = new Date().toISOString();

    if (editId) {
      await appDb.customers.update(parseInt(editId), {
        name, phone, panNo, isFrequent,
        syncStatus: 'pending', updatedAt: now
      });
      await dbHelpers.addToSyncQueue('update', 'customers', parseInt(editId));
      Toast.success(I18n.t('success_customer_updated'));
    } else {
      const id = await appDb.customers.add({
        name, phone, panNo, isFrequent,
        syncStatus: 'pending', updatedAt: now
      });
      await dbHelpers.addToSyncQueue('create', 'customers', id);
      Toast.success(I18n.t('success_customer_added'));
    }

    closeCustomerModal();
    Sync.updatePendingCount();
    Router.navigate(window.location.hash);
  }

  async function editCustomer(customerId) {
    const customer = await appDb.customers.get(parseInt(customerId));
    if (customer) openCustomerModal(customer);
  }

  async function deleteCustomer(customerId) {
    if (!confirm(I18n.t('confirm_delete'))) return;
    await appDb.customers.delete(parseInt(customerId));
    await dbHelpers.addToSyncQueue('delete', 'customers', parseInt(customerId));
    Toast.success(I18n.t('success_customer_deleted'));
    Sync.updatePendingCount();
    Router.navigate(window.location.hash);
  }

  function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#customers-tbody tr');
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(query) ? '' : 'none';
    });
  }

  return { render, afterRender };
})();

window.CustomersPage = CustomersPage;
