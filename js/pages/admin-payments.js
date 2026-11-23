// ============================================
// ADMIN PAYMENTS PAGE
// ============================================

const AdminPaymentsPage = (() => {

  async function render() {
    const transactions = await appDb.transactions.toArray();
    const customers = await appDb.customers.toArray();
    const customerMap = {};
    customers.forEach(c => customerMap[c.id] = c.name);

    // Sort by date desc
    transactions.sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      return b.id - a.id;
    });

    let rowsHtml = '';
    if (transactions.length === 0) {
      rowsHtml = `<tr><td colspan="8" class="table-empty"><div class="table-empty-icon">💳</div><span data-i18n="no_transactions">No transactions</span></td></tr>`;
    } else {
      rowsHtml = transactions.map(t => {
        const statusBadge = getStatusBadge(t.paymentStatus);
        const canPay = t.dueAmount > 0;
        return `
          <tr data-status="${t.paymentStatus}">
            <td data-label="${I18n.t('bill_no')}"><strong>${t.billNo}</strong></td>
            <td data-label="${I18n.t('customer')}">${customerMap[t.customerId] || '-'}</td>
            <td data-label="${I18n.t('date')}">${I18n.formatDate(t.date)}</td>
            <td data-label="${I18n.t('total_amount')}"><strong>${I18n.formatCurrencyShort(t.totalAmount)}</strong></td>
            <td data-label="${I18n.t('paid_amount')}">${I18n.formatCurrencyShort(t.paidAmount)}</td>
            <td data-label="${I18n.t('due_amount')}" class="${t.dueAmount > 0 ? 'customer-dues' : 'customer-dues zero'}">${I18n.formatCurrencyShort(t.dueAmount)}</td>
            <td data-label="${I18n.t('payment_status')}">${statusBadge}</td>
            <td>
              ${canPay ? `
                <button class="btn btn-success btn-sm" data-action="open-payment-modal" data-id="${t.id}" data-due="${t.dueAmount}">
                  <span>💵</span> <span data-i18n="record_payment">Record Payment</span>
                </button>
              ` : `<span class="badge badge-success" data-i18n="no_due">${I18n.t('no_due')}</span>`}
            </td>
          </tr>
        `;
      }).join('');
    }

    return `
      <div class="page-header">
        <div class="page-header-left">
          <h2 data-i18n="admin_payments_title">Payment Management</h2>
          <p data-i18n="admin_payments_subtitle">Track and record customer payments</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary btn-sm" id="btn-export-csv-payments">
            <span>📥</span> <span data-i18n="export_csv">${I18n.t('export_csv')}</span>
          </button>
        </div>
      </div>

      <div class="actions-row">
        <div class="search-bar">
          <span class="search-bar-icon">🔍</span>
          <input type="text" class="form-input" id="payment-search" data-i18n="search_transactions" placeholder="Search...">
        </div>
        <div class="filter-tabs">
          <button class="filter-tab active" data-filter="all" data-i18n="filter_all">All</button>
          <button class="filter-tab" data-filter="due" data-i18n="filter_due">Due</button>
          <button class="filter-tab" data-filter="partial" data-i18n="filter_partial">Partial</button>
          <button class="filter-tab" data-filter="paid" data-i18n="filter_paid">Paid</button>
        </div>
      </div>

      <div class="card">
        <div class="table-container">
          <table class="data-table responsive-cards">
            <thead>
              <tr>
                <th data-i18n="bill_no">Bill No.</th>
                <th data-i18n="customer">Customer</th>
                <th data-i18n="date">Date</th>
                <th data-i18n="total_amount">Total</th>
                <th data-i18n="paid_amount">Paid</th>
                <th data-i18n="due_amount">Due</th>
                <th data-i18n="payment_status">Status</th>
                <th data-i18n="actions">Actions</th>
              </tr>
            </thead>
            <tbody id="payments-tbody">
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Payment Modal -->
      <div class="modal-overlay" id="payment-modal">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title" data-i18n="record_payment">Record Payment</h3>
            <button class="modal-close" data-action="close-payment-modal">✕</button>
          </div>
          <div class="modal-body">
            <input type="hidden" id="payment-tx-id">
            <div class="form-group">
              <label class="form-label" data-i18n="due_amount">Due Amount</label>
              <div id="payment-due-display" style="font-size:var(--text-xl);font-weight:800;color:var(--danger-500);margin-bottom:8px;"></div>
            </div>
            <div class="form-group">
              <label class="form-label" data-i18n="payment_amount">Payment Amount</label>
              <input type="number" class="form-input" id="payment-amount-input" min="0" step="0.01" placeholder="0.00">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" data-action="close-payment-modal" data-i18n="cancel">Cancel</button>
            <button class="btn btn-success" id="btn-confirm-payment" data-i18n="record_payment">Record Payment</button>
          </div>
        </div>
      </div>
    `;
  }

  function afterRender() {
    const container = document.getElementById('page-container');
    if (!container) return;

    container.addEventListener('click', handleClick);

    const searchInput = document.getElementById('payment-search');
    if (searchInput) searchInput.addEventListener('input', handleSearch);

    container.querySelectorAll('.filter-tab').forEach(tab => {
      tab.addEventListener('click', () => handleFilter(tab));
    });
  }

  function handleClick(e) {
    if (e.target.closest('#btn-export-csv-payments')) {
      exportPaymentsCSV();
      return;
    }

    const action = e.target.closest('[data-action]')?.dataset.action;

    if (action === 'open-payment-modal') {
      const btn = e.target.closest('[data-action]');
      openPaymentModal(btn.dataset.id, btn.dataset.due);
      return;
    }

    if (action === 'close-payment-modal') {
      closePaymentModal();
      return;
    }

    if (e.target.closest('#btn-confirm-payment')) {
      confirmPayment();
      return;
    }
  }

  function openPaymentModal(txId, dueAmount) {
    const modal = document.getElementById('payment-modal');
    document.getElementById('payment-tx-id').value = txId;
    document.getElementById('payment-due-display').textContent = I18n.formatCurrencyShort(dueAmount);
    document.getElementById('payment-amount-input').value = '';
    document.getElementById('payment-amount-input').max = dueAmount;
    modal.classList.add('active');
    I18n.translatePage();
    setTimeout(() => document.getElementById('payment-amount-input').focus(), 100);
  }

  function closePaymentModal() {
    document.getElementById('payment-modal')?.classList.remove('active');
  }

  async function confirmPayment() {
    const payBtn = document.getElementById('btn-confirm-payment');
    setButtonLoading(payBtn, true);
    const txId = parseInt(document.getElementById('payment-tx-id').value);
    const amount = parseFloat(document.getElementById('payment-amount-input').value) || 0;

    if (amount <= 0) {
      Toast.warning(I18n.t('error_invalid_amount'));
      setButtonLoading(payBtn, false);
      return;
    }

    const tx = await appDb.transactions.get(txId);
    if (!tx) { setButtonLoading(payBtn, false); return; }

    if (amount > tx.dueAmount) {
      Toast.warning(I18n.t('error_amount_exceeds'));
      setButtonLoading(payBtn, false);
      return;
    }

    const newPaid = tx.paidAmount + amount;
    const newDue = Math.max(0, tx.totalAmount - newPaid);
    let newStatus = 'due';
    if (newDue <= 0) newStatus = 'paid';
    else if (newPaid > 0) newStatus = 'partial';

    await appDb.transactions.update(txId, {
      paidAmount: newPaid,
      dueAmount: newDue,
      paymentStatus: newStatus,
      syncStatus: 'pending',
      updatedAt: new Date().toISOString()
    });

    await dbHelpers.addToSyncQueue('update', 'transactions', txId);

    setButtonLoading(payBtn, false);
    closePaymentModal();
    Toast.success(I18n.t('success_payment_recorded'));
    Sync.updatePendingCount();
    Router.navigate(window.location.hash);
  }

  async function exportPaymentsCSV() {
    const transactions = await appDb.transactions.toArray();
    const customers = await appDb.customers.toArray();
    const customerMap = {};
    customers.forEach(c => customerMap[c.id] = c.name);
    const headers = ['Bill No', 'Customer', 'Date', 'Total', 'Paid', 'Due', 'Status'];
    const rows = transactions.map(t => [
      t.billNo, customerMap[t.customerId] || '-', t.date,
      t.totalAmount, t.paidAmount, t.dueAmount, t.paymentStatus
    ]);
    exportTableToCSV('payments.csv', headers, rows);
    Toast.success(I18n.t('export_success'));
  }

  function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#payments-tbody tr');
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(query) ? '' : 'none';
    });
  }

  function handleFilter(tab) {
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    const filter = tab.dataset.filter;
    const rows = document.querySelectorAll('#payments-tbody tr');
    rows.forEach(row => {
      if (filter === 'all') {
        row.style.display = '';
      } else {
        row.style.display = row.dataset.status === filter ? '' : 'none';
      }
    });
  }

  function getStatusBadge(status) {
    const map = {
      paid: { class: 'badge-success', key: 'paid' },
      partial: { class: 'badge-warning', key: 'partial' },
      due: { class: 'badge-danger', key: 'due' }
    };
    const s = map[status] || map.due;
    return `<span class="badge ${s.class}"><span class="badge-dot"></span><span data-i18n="${s.key}">${I18n.t(s.key)}</span></span>`;
  }

  return { render, afterRender };
})();

window.AdminPaymentsPage = AdminPaymentsPage;
