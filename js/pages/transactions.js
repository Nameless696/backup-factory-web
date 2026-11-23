// ============================================
// TRANSACTIONS PAGE (Billing)
// Components: Payment Quick Edit, RBAC
// ============================================

const TransactionsPage = (() => {
  let billItems = [];
  let showForm = false;

  async function render() {
    // Check if we should show form directly
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    showForm = urlParams.get('new') === '1';

    if (showForm) {
      return await renderForm();
    }
    return await renderList();
  }

  async function renderList() {
    const transactions = await appDb.transactions.toArray();
    const customers = await appDb.customers.toArray();
    const customerMap = {};
    customers.forEach(c => customerMap[c.id] = c.name);
    const canQuickEdit = Auth.hasPermission('quick_edit_payment');

    // Sort by date desc then id desc
    transactions.sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      return b.id - a.id;
    });

    let rowsHtml = '';
    if (transactions.length === 0) {
      rowsHtml = `<tr><td colspan="7" class="table-empty"><div class="table-empty-icon">📋</div><span data-i18n="no_transactions">No transactions yet</span></td></tr>`;
    } else {
      rowsHtml = transactions.map(t => {
        const statusBadge = getStatusBadge(t.paymentStatus);
        const clickableStatus = canQuickEdit && t.dueAmount > 0
          ? `<span class="clickable-status" data-action="quick-edit-payment" data-id="${t.id}" data-due="${t.dueAmount}" data-total="${t.totalAmount}" data-paid="${t.paidAmount}" title="${I18n.t('quick_payment')}">${statusBadge}</span>`
          : statusBadge;
        return `
          <tr data-status="${t.paymentStatus}">
            <td data-label="${I18n.t('bill_no')}"><strong>${t.billNo}</strong></td>
            <td data-label="${I18n.t('date')}">${I18n.formatDate(t.date)}</td>
            <td data-label="${I18n.t('customer')}">${customerMap[t.customerId] || '-'}</td>
            <td data-label="${I18n.t('total_amount')}"><strong>${I18n.formatCurrencyShort(t.totalAmount)}</strong></td>
            <td data-label="${I18n.t('paid_amount')}">${I18n.formatCurrencyShort(t.paidAmount)}</td>
            <td data-label="${I18n.t('payment_status')}">${clickableStatus}</td>
            <td data-label="">
              <button class="btn btn-ghost btn-sm" data-action="view-receipt" data-id="${t.id}">
                <span>👁</span> <span data-i18n="view">View</span>
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }

    const canCreate = Auth.hasPermission('create_transaction');

    return `
      <div class="page-header">
        <div class="page-header-left">
          <h2 data-i18n="transactions_title">Transactions</h2>
          <p data-i18n="transactions_subtitle">View and create billing transactions</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary btn-sm" id="btn-export-csv-tx">
            <span>📥</span> <span data-i18n="export_csv">${I18n.t('export_csv')}</span>
          </button>
          ${canCreate ? `
            <button class="btn btn-primary" id="btn-new-transaction">
              <span>+</span> <span data-i18n="create_transaction">Create Transaction</span>
            </button>
          ` : ''}
        </div>
      </div>

      <div class="actions-row">
        <div class="search-bar">
          <span class="search-bar-icon">🔍</span>
          <input type="text" class="form-input" id="transaction-search" data-i18n="search_transactions" placeholder="Search transactions...">
        </div>
        <div class="filter-tabs">
          <button class="filter-tab active" data-filter="all" data-i18n="filter_all">All</button>
          <button class="filter-tab" data-filter="paid" data-i18n="filter_paid">Paid</button>
          <button class="filter-tab" data-filter="partial" data-i18n="filter_partial">Partial</button>
          <button class="filter-tab" data-filter="due" data-i18n="filter_due">Due</button>
        </div>
      </div>

      <div class="card">
        <div class="table-container">
          <table class="data-table responsive-cards">
            <thead>
              <tr>
                <th data-i18n="bill_no">Bill No.</th>
                <th data-i18n="date">Date</th>
                <th data-i18n="customer">Customer</th>
                <th data-i18n="total_amount">Total</th>
                <th data-i18n="paid_amount">Paid</th>
                <th data-i18n="payment_status">Status</th>
                <th data-i18n="actions">Actions</th>
              </tr>
            </thead>
            <tbody id="transactions-tbody">
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Quick Payment Edit Modal -->
      <div class="modal-overlay" id="quick-payment-modal">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title" data-i18n="quick_payment">${I18n.t('quick_payment')}</h3>
            <button class="modal-close" data-action="close-quick-payment">✕</button>
          </div>
          <div class="modal-body">
            <input type="hidden" id="qp-tx-id">
            <div class="qp-current-status" id="qp-current-status"></div>
            <div class="qp-preset-buttons">
              <button class="btn btn-success" id="btn-qp-full" data-action="qp-full">
                <span>✓</span> <span data-i18n="mark_paid">${I18n.t('mark_paid')}</span>
              </button>
              <button class="btn btn-warning" id="btn-qp-half" data-action="qp-half">
                <span>½</span> <span data-i18n="half_payment">${I18n.t('half_payment')}</span>
              </button>
            </div>
            <div class="qp-custom-section">
              <label class="form-label" data-i18n="custom_amount">${I18n.t('custom_amount')}</label>
              <div class="qp-custom-input-row">
                <input type="number" class="form-input" id="qp-custom-amount" min="0" step="0.01" data-i18n="enter_amount" placeholder="Enter amount...">
                <button class="btn btn-primary" id="btn-qp-custom" data-action="qp-custom">
                  <span data-i18n="save">${I18n.t('save')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async function renderForm() {
    billItems = [{ productId: '', qty: 1, rate: 0, total: 0 }];
    const customers = await appDb.customers.toArray();
    const products = await appDb.products.toArray();

    const customerOptions = customers.map(c =>
      `<option value="${c.id}">${c.name}</option>`
    ).join('');

    const nextBillNo = await dbHelpers.generateBillNo();
    const today = new Date().toISOString().split('T')[0];

    return `
      <div class="page-header">
        <div class="page-header-left">
          <h2 data-i18n="create_transaction">Create Transaction</h2>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary" id="btn-back-list">
            <span>←</span> <span data-i18n="transactions_title">Transactions</span>
          </button>
        </div>
      </div>

      <div class="card">
        <form id="transaction-form">
          <div class="billing-form">
            <div class="form-group">
              <label class="form-label" data-i18n="bill_no">Bill No.</label>
              <input type="text" class="form-input" id="bill-no" value="${nextBillNo}" readonly>
            </div>
            <div class="form-group">
              <label class="form-label" data-i18n="date">Date</label>
              <input type="date" class="form-input" id="bill-date" value="${today}" required>
            </div>
            <div class="form-group">
              <label class="form-label" data-i18n="customer">Customer</label>
              <select class="form-select" id="bill-customer" required>
                <option value="" data-i18n="select_customer">Select Customer</option>
                ${customerOptions}
              </select>
            </div>
            <div class="form-group" style="display:flex;align-items:flex-end;">
              <button type="button" class="btn btn-secondary btn-sm" id="btn-inline-customer">
                <span data-i18n="add_new_customer_inline">+ Add New Customer</span>
              </button>
            </div>

            <div class="bill-items-section">
              <label class="form-label" style="margin-bottom:12px;">
                <span data-i18n="item">Items</span>
              </label>
              <div class="table-container">
                <table class="bill-items-table">
                  <thead>
                    <tr>
                      <th data-i18n="sn">S.N.</th>
                      <th data-i18n="select_product">Product</th>
                      <th data-i18n="quantity">Qty</th>
                      <th data-i18n="rate">Rate</th>
                      <th data-i18n="total">Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody id="bill-items-tbody">
                  </tbody>
                </table>
              </div>
              <button type="button" class="btn btn-secondary btn-sm" id="btn-add-item" style="margin-top:8px;">
                <span>+</span> <span data-i18n="add_item">Add Item</span>
              </button>
            </div>

            <div class="bill-summary">
              <div class="bill-summary-card">
                <div class="bill-summary-row">
                  <span data-i18n="grand_total">Grand Total</span>
                  <span id="bill-grand-total"><strong>${I18n.formatCurrencyShort(0)}</strong></span>
                </div>
                <div class="form-group" style="margin:12px 0 0;">
                  <label class="form-label" data-i18n="paid_amount">Amount Paid</label>
                  <input type="number" class="form-input" id="bill-paid-amount" value="0" min="0" step="0.01">
                </div>
                <div class="bill-summary-row due">
                  <span data-i18n="due_amount">Due Amount</span>
                  <span id="bill-due-amount">${I18n.formatCurrencyShort(0)}</span>
                </div>
                <div class="bill-summary-row">
                  <span data-i18n="payment_status">Status</span>
                  <span id="bill-payment-status">-</span>
                </div>
                <div class="bill-summary-row total">
                  <span data-i18n="total">Total</span>
                  <span id="bill-final-total">${I18n.formatCurrencyShort(0)}</span>
                </div>
              </div>
            </div>
          </div>

          <div style="margin-top:24px; display:flex; justify-content:flex-end; gap:12px;">
            <button type="button" class="btn btn-secondary" id="btn-cancel-transaction" data-i18n="cancel">Cancel</button>
            <button type="button" class="btn btn-primary btn-lg" id="btn-save-transaction">
              <span data-i18n="save_transaction">Save Transaction</span>
            </button>
          </div>
        </form>
      </div>

      <!-- Inline Customer Modal -->
      <div class="modal-overlay" id="inline-customer-modal">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title" data-i18n="add_customer_title">Add Customer</h3>
            <button class="modal-close" data-action="close-inline-modal">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label" data-i18n="customer_name">Customer Name</label>
              <input type="text" class="form-input" id="inline-cust-name" required>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label" data-i18n="phone">Phone</label>
                <input type="tel" class="form-input" id="inline-cust-phone">
              </div>
              <div class="form-group">
                <label class="form-label" data-i18n="pan_no">PAN No.</label>
                <input type="text" class="form-input" id="inline-cust-pan">
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" data-action="close-inline-modal" data-i18n="cancel">Cancel</button>
            <button class="btn btn-primary" id="btn-save-inline-customer" data-i18n="save">Save</button>
          </div>
        </div>
      </div>
    `;
  }

  function afterRender() {
    const container = document.getElementById('page-container');
    if (!container) return;

    container.addEventListener('click', handleClick);

    if (showForm) {
      renderItemRows();
      // Paid amount change
      const paidInput = document.getElementById('bill-paid-amount');
      if (paidInput) {
        paidInput.addEventListener('input', recalcSummary);
      }
    } else {
      // Search
      const searchInput = document.getElementById('transaction-search');
      if (searchInput) searchInput.addEventListener('input', handleSearch);

      // Filter tabs
      container.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => handleFilter(tab));
      });

      // Close quick payment modal on overlay click
      const qpModal = document.getElementById('quick-payment-modal');
      if (qpModal) {
        qpModal.addEventListener('click', (e) => {
          if (e.target === qpModal) closeQuickPayment();
        });
      }
    }
  }

  function handleClick(e) {
    if (e.target.closest('#btn-export-csv-tx')) {
      exportTransactionsCSV();
      return;
    }
    if (e.target.closest('#btn-new-transaction')) {
      window.location.hash = '#/transactions?new=1';
      return;
    }
    if (e.target.closest('#btn-back-list') || e.target.closest('#btn-cancel-transaction')) {
      window.location.hash = '#/transactions';
      return;
    }
    if (e.target.closest('#btn-add-item')) {
      addItemRow();
      return;
    }
    if (e.target.closest('#btn-save-transaction')) {
      saveTransaction();
      return;
    }
    if (e.target.closest('#btn-inline-customer')) {
      document.getElementById('inline-customer-modal')?.classList.add('active');
      I18n.translatePage();
      return;
    }
    if (e.target.closest('#btn-save-inline-customer')) {
      saveInlineCustomer();
      return;
    }

    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action === 'close-inline-modal') {
      document.getElementById('inline-customer-modal')?.classList.remove('active');
      return;
    }
    if (action === 'remove-item') {
      const idx = parseInt(e.target.closest('[data-action]').dataset.index);
      removeItemRow(idx);
      return;
    }
    if (action === 'view-receipt') {
      const id = e.target.closest('[data-action]').dataset.id;
      window.location.hash = `#/receipt/${id}`;
      return;
    }

    // Quick payment edit actions
    if (action === 'quick-edit-payment') {
      const el = e.target.closest('[data-action]');
      openQuickPayment(el.dataset.id, el.dataset.due, el.dataset.total, el.dataset.paid);
      return;
    }
    if (action === 'close-quick-payment') {
      closeQuickPayment();
      return;
    }
    if (action === 'qp-full') {
      applyQuickPayment('full');
      return;
    }
    if (action === 'qp-half') {
      applyQuickPayment('half');
      return;
    }
    if (action === 'qp-custom') {
      applyQuickPayment('custom');
      return;
    }
  }

  // ============================================
  // QUICK PAYMENT EDIT (Component 6)
  // ============================================

  let qpTxData = null;

  function openQuickPayment(txId, dueAmount, totalAmount, paidAmount) {
    const modal = document.getElementById('quick-payment-modal');
    if (!modal) return;

    qpTxData = {
      id: parseInt(txId),
      due: parseFloat(dueAmount),
      total: parseFloat(totalAmount),
      paid: parseFloat(paidAmount)
    };

    document.getElementById('qp-tx-id').value = txId;

    const statusEl = document.getElementById('qp-current-status');
    if (statusEl) {
      statusEl.innerHTML = `
        <div class="qp-info-row">
          <span data-i18n="total_amount">${I18n.t('total_amount')}</span>
          <strong>${I18n.formatCurrencyShort(qpTxData.total)}</strong>
        </div>
        <div class="qp-info-row">
          <span data-i18n="paid_amount">${I18n.t('paid_amount')}</span>
          <span>${I18n.formatCurrencyShort(qpTxData.paid)}</span>
        </div>
        <div class="qp-info-row due">
          <span data-i18n="due_amount">${I18n.t('due_amount')}</span>
          <strong>${I18n.formatCurrencyShort(qpTxData.due)}</strong>
        </div>
      `;
    }

    // Set half payment button text
    const halfBtn = document.getElementById('btn-qp-half');
    if (halfBtn) {
      const halfAmt = Math.round(qpTxData.due / 2);
      halfBtn.title = I18n.formatCurrencyShort(halfAmt);
    }

    document.getElementById('qp-custom-amount').value = '';
    document.getElementById('qp-custom-amount').max = qpTxData.due;
    modal.classList.add('active');
    I18n.translatePage();
  }

  function closeQuickPayment() {
    document.getElementById('quick-payment-modal')?.classList.remove('active');
    qpTxData = null;
  }

  async function applyQuickPayment(type) {
    if (!qpTxData) return;

    let paymentAmount = 0;

    switch (type) {
      case 'full':
        paymentAmount = qpTxData.due;
        break;
      case 'half':
        paymentAmount = Math.round(qpTxData.due / 2);
        break;
      case 'custom':
        paymentAmount = parseFloat(document.getElementById('qp-custom-amount')?.value) || 0;
        break;
    }

    if (paymentAmount <= 0) {
      Toast.warning(I18n.t('error_invalid_amount'));
      return;
    }

    if (paymentAmount > qpTxData.due) {
      Toast.warning(I18n.t('error_amount_exceeds'));
      return;
    }

    const tx = await appDb.transactions.get(qpTxData.id);
    if (!tx) return;

    const newPaid = tx.paidAmount + paymentAmount;
    const newDue = Math.max(0, tx.totalAmount - newPaid);
    let newStatus = 'due';
    if (newDue <= 0) newStatus = 'paid';
    else if (newPaid > 0) newStatus = 'partial';

    await appDb.transactions.update(qpTxData.id, {
      paidAmount: newPaid,
      dueAmount: newDue,
      paymentStatus: newStatus,
      syncStatus: 'pending',
      updatedAt: new Date().toISOString()
    });

    await dbHelpers.addToSyncQueue('update', 'transactions', qpTxData.id);

    closeQuickPayment();
    Toast.success(I18n.t('payment_updated'));
    Sync.updatePendingCount();
    Router.navigate(window.location.hash);
  }

  // ============================================
  // BILLING FORM LOGIC
  // ============================================

  async function renderItemRows() {
    const products = await appDb.products.toArray();
    const tbody = document.getElementById('bill-items-tbody');
    if (!tbody) return;

    tbody.innerHTML = billItems.map((item, idx) => {
      const productOptions = products.map(p =>
        `<option value="${p.id}" ${item.productId == p.id ? 'selected' : ''}>${p.name} (${I18n.formatCurrencyShort(p.price)}/${I18n.t('unit_' + p.unit)})</option>`
      ).join('');

      return `
        <tr>
          <td>${idx + 1}</td>
          <td>
            <select class="form-select bill-item-product" data-index="${idx}">
              <option value="" data-i18n="select_product">Select Product</option>
              ${productOptions}
            </select>
          </td>
          <td><input type="number" class="form-input bill-item-qty" data-index="${idx}" value="${item.qty}" min="1" style="width:80px;"></td>
          <td><input type="number" class="form-input bill-item-rate" data-index="${idx}" value="${item.rate}" min="0" step="0.01" style="width:100px;"></td>
          <td class="item-total">${I18n.formatCurrencyShort(item.total)}</td>
          <td>
            ${billItems.length > 1 ? `<button type="button" class="btn-remove-item" data-action="remove-item" data-index="${idx}">✕</button>` : ''}
          </td>
        </tr>
      `;
    }).join('');

    // Re-attach change listeners
    tbody.querySelectorAll('.bill-item-product').forEach(sel => {
      sel.addEventListener('change', (e) => onProductChange(e));
    });
    tbody.querySelectorAll('.bill-item-qty').forEach(input => {
      input.addEventListener('input', (e) => onQtyRateChange(e));
    });
    tbody.querySelectorAll('.bill-item-rate').forEach(input => {
      input.addEventListener('input', (e) => onQtyRateChange(e));
    });

    I18n.translatePage();
    recalcSummary();
  }

  async function onProductChange(e) {
    const idx = parseInt(e.target.dataset.index);
    const productId = parseInt(e.target.value);
    if (!productId) return;

    const product = await appDb.products.get(productId);
    if (product) {
      billItems[idx].productId = productId;
      billItems[idx].rate = product.price;
      billItems[idx].total = billItems[idx].qty * product.price;
      renderItemRows();
    }
  }

  function onQtyRateChange(e) {
    const idx = parseInt(e.target.dataset.index);
    const qtyInput = document.querySelector(`.bill-item-qty[data-index="${idx}"]`);
    const rateInput = document.querySelector(`.bill-item-rate[data-index="${idx}"]`);

    billItems[idx].qty = parseInt(qtyInput?.value) || 0;
    billItems[idx].rate = parseFloat(rateInput?.value) || 0;
    billItems[idx].total = billItems[idx].qty * billItems[idx].rate;

    // Update total cell
    const row = qtyInput?.closest('tr');
    const totalCell = row?.querySelector('.item-total');
    if (totalCell) totalCell.textContent = I18n.formatCurrencyShort(billItems[idx].total);

    recalcSummary();
  }

  function addItemRow() {
    billItems.push({ productId: '', qty: 1, rate: 0, total: 0 });
    renderItemRows();
  }

  function removeItemRow(idx) {
    if (billItems.length <= 1) return;
    billItems.splice(idx, 1);
    renderItemRows();
  }

  function recalcSummary() {
    const grandTotal = billItems.reduce((sum, item) => sum + item.total, 0);
    const paidAmount = parseFloat(document.getElementById('bill-paid-amount')?.value) || 0;
    const dueAmount = Math.max(0, grandTotal - paidAmount);

    let status = 'due';
    if (dueAmount <= 0 && grandTotal > 0) status = 'paid';
    else if (paidAmount > 0 && dueAmount > 0) status = 'partial';

    const gtEl = document.getElementById('bill-grand-total');
    const dueEl = document.getElementById('bill-due-amount');
    const statusEl = document.getElementById('bill-payment-status');
    const finalEl = document.getElementById('bill-final-total');

    if (gtEl) gtEl.innerHTML = `<strong>${I18n.formatCurrencyShort(grandTotal)}</strong>`;
    if (dueEl) dueEl.textContent = I18n.formatCurrencyShort(dueAmount);
    if (finalEl) finalEl.textContent = I18n.formatCurrencyShort(grandTotal);
    if (statusEl) statusEl.innerHTML = getStatusBadge(status);
  }

  async function saveTransaction() {
    const saveBtn = document.getElementById('btn-save-transaction');
    setButtonLoading(saveBtn, true);
    const billNo = document.getElementById('bill-no')?.value;
    const date = document.getElementById('bill-date')?.value;
    const customerId = parseInt(document.getElementById('bill-customer')?.value);
    const paidAmount = parseFloat(document.getElementById('bill-paid-amount')?.value) || 0;

    if (!customerId) {
      Toast.warning(I18n.t('error_select_customer'));
      setButtonLoading(saveBtn, false);
      return;
    }

    const validItems = billItems.filter(item => item.productId && item.qty > 0 && item.rate > 0);
    if (validItems.length === 0) {
      Toast.warning(I18n.t('error_add_items'));
      setButtonLoading(saveBtn, false);
      return;
    }

    const totalAmount = validItems.reduce((sum, item) => sum + item.total, 0);
    const dueAmount = Math.max(0, totalAmount - paidAmount);
    let paymentStatus = 'due';
    if (dueAmount <= 0) paymentStatus = 'paid';
    else if (paidAmount > 0) paymentStatus = 'partial';

    // Build items array with product names
    const products = await appDb.products.toArray();
    const productMap = {};
    products.forEach(p => productMap[p.id] = p);

    const items = validItems.map(item => ({
      productId: item.productId,
      name: productMap[item.productId]?.name || '',
      qty: item.qty,
      rate: item.rate,
      total: item.total
    }));

    // Save transaction
    const txId = await appDb.transactions.add({
      billNo, date, customerId, items,
      totalAmount, paidAmount, dueAmount, paymentStatus,
      syncStatus: 'pending',
      updatedAt: new Date().toISOString()
    });

    await dbHelpers.addToSyncQueue('create', 'transactions', txId);

    // Deduct stock
    for (const item of validItems) {
      const product = productMap[item.productId];
      if (product) {
        const newQty = Math.max(0, product.quantity - item.qty);
        await appDb.products.update(item.productId, {
          quantity: newQty,
          status: dbHelpers.getProductStatus(newQty),
          syncStatus: 'pending',
          updatedAt: new Date().toISOString()
        });
      }
    }

    setButtonLoading(saveBtn, false);
    Toast.success(I18n.t('success_transaction_saved'));
    Sync.updatePendingCount();
    window.location.hash = `#/receipt/${txId}`;
  }

  async function saveInlineCustomer() {
    const name = document.getElementById('inline-cust-name')?.value.trim();
    const phone = document.getElementById('inline-cust-phone')?.value.trim();
    const panNo = document.getElementById('inline-cust-pan')?.value.trim();

    if (!name) {
      Toast.warning(I18n.t('error_fill_required'));
      return;
    }

    const id = await appDb.customers.add({
      name, phone, panNo, isFrequent: false,
      syncStatus: 'pending',
      updatedAt: new Date().toISOString()
    });
    await dbHelpers.addToSyncQueue('create', 'customers', id);

    // Add to dropdown and select
    const select = document.getElementById('bill-customer');
    if (select) {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = name;
      option.selected = true;
      select.appendChild(option);
    }

    document.getElementById('inline-customer-modal')?.classList.remove('active');
    Toast.success(I18n.t('success_customer_added'));
    Sync.updatePendingCount();
  }

  async function exportTransactionsCSV() {
    const transactions = await appDb.transactions.toArray();
    const customers = await appDb.customers.toArray();
    const customerMap = {};
    customers.forEach(c => customerMap[c.id] = c.name);
    const headers = ['Bill No', 'Date', 'Customer', 'Total', 'Paid', 'Due', 'Status'];
    const rows = transactions.map(t => [
      t.billNo, t.date, customerMap[t.customerId] || '-',
      t.totalAmount, t.paidAmount, t.dueAmount, t.paymentStatus
    ]);
    exportTableToCSV('transactions.csv', headers, rows);
    Toast.success(I18n.t('export_success'));
  }

  function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#transactions-tbody tr');
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(query) ? '' : 'none';
    });
  }

  function handleFilter(tab) {
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    const filter = tab.dataset.filter;
    const rows = document.querySelectorAll('#transactions-tbody tr');
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

window.TransactionsPage = TransactionsPage;
