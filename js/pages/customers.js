// ============================================
// CUSTOMER MANAGEMENT PAGE
// ============================================

const CustomersPage = (() => {

  async function render() {
    const customers = await appDb.customers.toArray();
    const transactions = await appDb.transactions.toArray();

    // Compute per-customer stats
    const customerStats = {};
    transactions.forEach(t => {
      if (!customerStats[t.customerId]) {
        customerStats[t.customerId] = { totalPurchases: 0, pendingDues: 0 };
      }
      customerStats[t.customerId].totalPurchases += (t.totalAmount || 0);
      customerStats[t.customerId].pendingDues += (t.dueAmount || 0);
    });

    let rowsHtml = '';
    if (customers.length === 0) {
      rowsHtml = `<tr><td colspan="6" class="table-empty"><div class="table-empty-icon">👥</div><span data-i18n="no_customers">No customers yet</span></td></tr>`;
    } else {
      rowsHtml = customers.map(c => {
        const stats = customerStats[c.id] || { totalPurchases: 0, pendingDues: 0 };
        return `
          <tr>
            <td><strong>${c.name}</strong></td>
            <td>${c.phone || '-'}</td>
            <td>${c.panNo || '-'}</td>
            <td class="customer-purchases">${I18n.formatCurrencyShort(stats.totalPurchases)}</td>
            <td class="${stats.pendingDues > 0 ? 'customer-dues' : 'customer-dues zero'}">${I18n.formatCurrencyShort(stats.pendingDues)}</td>
            <td>
              <div class="product-actions">
                <button class="btn btn-secondary btn-sm" data-action="edit-customer" data-id="${c.id}">✏️</button>
                <button class="btn btn-danger btn-sm" data-action="delete-customer" data-id="${c.id}">🗑️</button>
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
        <div class="page-header-actions">
          <button class="btn btn-primary" id="btn-add-customer">
            <span>+</span> <span data-i18n="add_customer">Add Customer</span>
          </button>
        </div>
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

      <!-- Customer Modal -->
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
        editCustomer(e.target.closest('[data-action]').dataset.id);
        break;
      case 'delete-customer':
        deleteCustomer(e.target.closest('[data-action]').dataset.id);
        break;
    }
  }

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
