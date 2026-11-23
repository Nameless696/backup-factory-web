// ============================================
// DASHBOARD PAGE
// Components: Fix New Transaction btn, Frequent
// Customers, Dashboard Detail Pop-ups
// ============================================

const DashboardPage = (() => {

  async function render() {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Compute stats
    const allTransactions = await appDb.transactions.toArray();
    const todayTransactions = allTransactions.filter(t => t.date === today);
    const todaySales = todayTransactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
    const yesterdaySales = allTransactions.filter(t => t.date === yesterday).reduce((sum, t) => sum + (t.totalAmount || 0), 0);
    const pendingDues = allTransactions.reduce((sum, t) => sum + (t.dueAmount || 0), 0);

    const products = await appDb.products.toArray();
    const lowStockCount = products.filter(p => p.quantity <= 10).length;

    const totalCustomers = await appDb.customers.count();

    // Frequent customers
    const customers = await appDb.customers.toArray();
    const frequentCustomers = customers.filter(c => c.isFrequent);

    // Customer stats for frequent customers
    const customerStats = {};
    allTransactions.forEach(t => {
      if (!customerStats[t.customerId]) {
        customerStats[t.customerId] = { totalPurchases: 0, pendingDues: 0, count: 0 };
      }
      customerStats[t.customerId].totalPurchases += (t.totalAmount || 0);
      customerStats[t.customerId].pendingDues += (t.dueAmount || 0);
      customerStats[t.customerId].count++;
    });

    // Customer map for recent transactions
    const customerMap = {};
    customers.forEach(c => customerMap[c.id] = c.name);

    // Frequent customers HTML
    let frequentCustomersHtml = '';
    if (frequentCustomers.length > 0) {
      const cards = frequentCustomers.map(c => {
        const stats = customerStats[c.id] || { totalPurchases: 0, pendingDues: 0, count: 0 };
        return `
          <div class="frequent-customer-card" data-action="view-customer-detail" data-customer-id="${c.id}">
            <div class="fc-avatar">${c.name.split(' ').map(w => w.charAt(0)).slice(0, 2).join('').toUpperCase()}</div>
            <div class="fc-info">
              <div class="fc-name">${c.name}</div>
              <div class="fc-phone">${c.phone || '-'}</div>
            </div>
            <div class="fc-stats">
              <div class="fc-stat">
                <span class="fc-stat-label" data-i18n="total_purchases">${I18n.t('total_purchases')}</span>
                <span class="fc-stat-value">${I18n.formatCurrencyShort(stats.totalPurchases)}</span>
              </div>
              ${stats.pendingDues > 0 ? `
                <div class="fc-stat due">
                  <span class="fc-stat-label" data-i18n="pending_dues">${I18n.t('pending_dues')}</span>
                  <span class="fc-stat-value">${I18n.formatCurrencyShort(stats.pendingDues)}</span>
                </div>
              ` : ''}
            </div>
          </div>
        `;
      }).join('');

      frequentCustomersHtml = `
        <div class="card" style="margin-bottom:28px;">
          <div class="card-header">
            <div class="card-title" data-i18n="frequent_customers">${I18n.t('frequent_customers')}</div>
          </div>
          <div class="frequent-customers-grid">
            ${cards}
          </div>
        </div>
      `;
    }

    // Recent transactions (last 10)
    const recentTransactions = allTransactions.sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      return b.id - a.id;
    }).slice(0, 10);

    let recentRowsHtml = '';
    if (recentTransactions.length === 0) {
      recentRowsHtml = `<tr><td colspan="6" class="table-empty"><div class="table-empty-icon">📋</div><span data-i18n="no_transactions">No transactions yet</span></td></tr>`;
    } else {
      recentRowsHtml = recentTransactions.map(t => {
        const statusBadge = getStatusBadge(t.paymentStatus);
        return `
          <tr>
            <td data-label="${I18n.t('bill_no')}"><strong>${t.billNo}</strong></td>
            <td data-label="${I18n.t('date')}">${I18n.formatDate(t.date)}</td>
            <td data-label="${I18n.t('customer')}">${customerMap[t.customerId] || '-'}</td>
            <td data-label="${I18n.t('total_amount')}"><strong>${I18n.formatCurrencyShort(t.totalAmount)}</strong></td>
            <td data-label="${I18n.t('payment_status')}">${statusBadge}</td>
            <td data-label="">
              <button class="btn btn-ghost btn-sm" data-action="view-receipt" data-id="${t.id}">
                <span>👁</span> <span data-i18n="view">View</span>
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }

    return `
      <div class="page-header">
        <div class="page-header-left">
          <h2 data-i18n="dashboard_title">Dashboard</h2>
          <p data-i18n="dashboard_subtitle">Overview of your factory operations</p>
        </div>
      </div>

      ${products.filter(p => p.quantity <= 3).length > 0 ? `
        <div class="low-stock-alert">
          <div class="low-stock-alert-content">
            <span class="low-stock-alert-icon">⚠️</span>
            <div>
              <strong data-i18n="low_stock_alert_title">${I18n.t('low_stock_alert_title')}</strong>
              <span>${I18n.formatNumber(products.filter(p => p.quantity <= 3).length)} ${I18n.t('items_critically_low')}</span>
            </div>
          </div>
          <a href="#/stock" class="low-stock-alert-link" data-i18n="view_all_stock">${I18n.t('view_all_stock')}</a>
        </div>
      ` : ''}

      <div class="stats-grid">
        <div class="stat-card primary clickable-stat" data-action="stat-detail" data-stat="todays-sales">
          <div class="stat-card-header">
            <div>
              <div class="stat-card-label" data-i18n="todays_sales">Today's Sales</div>
              <div class="stat-card-value animate-value">${I18n.formatCurrencyShort(todaySales)}</div>
              <div class="stat-card-hint" data-i18n="click_for_details">${I18n.t('click_for_details')}</div>
            </div>
            <div class="stat-card-icon">💰</div>
          </div>
        </div>
        <div class="stat-card danger clickable-stat" data-action="stat-detail" data-stat="pending-dues">
          <div class="stat-card-header">
            <div>
              <div class="stat-card-label" data-i18n="pending_dues">Pending Dues</div>
              <div class="stat-card-value animate-value">${I18n.formatCurrencyShort(pendingDues)}</div>
              <div class="stat-card-hint" data-i18n="click_for_details">${I18n.t('click_for_details')}</div>
            </div>
            <div class="stat-card-icon">📊</div>
          </div>
        </div>
        <div class="stat-card warning clickable-stat" data-action="stat-detail" data-stat="low-stock">
          <div class="stat-card-header">
            <div>
              <div class="stat-card-label" data-i18n="low_stock_items">Low Stock Items</div>
              <div class="stat-card-value animate-value">${I18n.formatNumber(lowStockCount)}</div>
              <div class="stat-card-hint" data-i18n="click_for_details">${I18n.t('click_for_details')}</div>
            </div>
            <div class="stat-card-icon">📦</div>
          </div>
        </div>
        <div class="stat-card success clickable-stat" data-action="stat-detail" data-stat="total-customers">
          <div class="stat-card-header">
            <div>
              <div class="stat-card-label" data-i18n="total_customers">Total Customers</div>
              <div class="stat-card-value animate-value">${I18n.formatNumber(totalCustomers)}</div>
              <div class="stat-card-hint" data-i18n="click_for_details">${I18n.t('click_for_details')}</div>
            </div>
            <div class="stat-card-icon">👥</div>
          </div>
        </div>
      </div>

      <div class="quick-actions">
        <button class="quick-action-btn qa-transaction" id="btn-new-transaction-dashboard" data-action="nav" data-href="#/transactions?new=1">
          <div class="qa-icon">📝</div>
          <span data-i18n="new_transaction">New Transaction</span>
        </button>
        <button class="quick-action-btn qa-customer" data-action="nav" data-href="#/customers">
          <div class="qa-icon">👤</div>
          <span data-i18n="add_customer">Add Customer</span>
        </button>
        <button class="quick-action-btn qa-stock" data-action="nav" data-href="#/stock">
          <div class="qa-icon">📦</div>
          <span data-i18n="view_stock">View Stock</span>
        </button>
      </div>

      ${frequentCustomersHtml}

      <div class="card">
        <div class="card-header">
          <div class="card-title" data-i18n="recent_transactions">Recent Transactions</div>
        </div>
        <div class="table-container">
          <table class="data-table responsive-cards">
            <thead>
              <tr>
                <th data-i18n="bill_no">Bill No.</th>
                <th data-i18n="date">Date</th>
                <th data-i18n="customer">Customer</th>
                <th data-i18n="total_amount">Total</th>
                <th data-i18n="payment_status">Status</th>
                <th data-i18n="actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${recentRowsHtml}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Dashboard Detail Modal -->
      <div class="modal-overlay" id="dashboard-detail-modal">
        <div class="modal modal-lg">
          <div class="modal-header">
            <h3 class="modal-title" id="dashboard-detail-title">Details</h3>
            <div class="modal-header-actions">
              <button class="btn btn-ghost btn-sm" id="btn-modal-expand" data-action="toggle-fullscreen" title="Expand">⛶</button>
              <button class="modal-close" data-action="close-detail-modal">✕</button>
            </div>
          </div>
          <div class="modal-body" id="dashboard-detail-body">
            <!-- Dynamic content -->
          </div>
        </div>
      </div>

      <!-- Customer Detail Modal (shared) -->
      <div class="modal-overlay" id="customer-detail-modal">
        <div class="modal modal-lg">
          <div class="modal-header">
            <h3 class="modal-title" data-i18n="customer_detail">${I18n.t('customer_detail')}</h3>
            <div class="modal-header-actions">
              <button class="btn btn-ghost btn-sm" data-action="toggle-cd-fullscreen" title="Expand">⛶</button>
              <button class="modal-close" data-action="close-customer-detail">✕</button>
            </div>
          </div>
          <div class="modal-body" id="customer-detail-body">
            <!-- Dynamic content -->
          </div>
        </div>
      </div>
    `;
  }

  function afterRender() {
    const container = document.getElementById('page-container');
    if (!container) return;

    container.addEventListener('click', (e) => {
      // Navigation buttons (fix: use dedicated handler)
      const navBtn = e.target.closest('[data-action="nav"]');
      if (navBtn) {
        e.preventDefault();
        e.stopPropagation();
        const href = navBtn.dataset.href;
        if (href) window.location.hash = href;
        return;
      }

      // View receipt
      const viewBtn = e.target.closest('[data-action="view-receipt"]');
      if (viewBtn) {
        window.location.hash = `#/receipt/${viewBtn.dataset.id}`;
        return;
      }

      // Stat card detail pop-ups
      const statCard = e.target.closest('[data-action="stat-detail"]');
      if (statCard) {
        openStatDetail(statCard.dataset.stat);
        return;
      }

      // Customer detail from frequent customers
      const custCard = e.target.closest('[data-action="view-customer-detail"]');
      if (custCard) {
        openCustomerDetail(parseInt(custCard.dataset.customerId));
        return;
      }

      // Close detail modal
      if (e.target.closest('[data-action="close-detail-modal"]')) {
        closeDetailModal();
        return;
      }

      // Close customer detail modal
      if (e.target.closest('[data-action="close-customer-detail"]')) {
        closeCustomerDetailModal();
        return;
      }

      // Toggle fullscreen
      if (e.target.closest('[data-action="toggle-fullscreen"]')) {
        const modal = document.querySelector('#dashboard-detail-modal .modal');
        modal?.classList.toggle('modal-fullscreen');
        return;
      }

      if (e.target.closest('[data-action="toggle-cd-fullscreen"]')) {
        const modal = document.querySelector('#customer-detail-modal .modal');
        modal?.classList.toggle('modal-fullscreen');
        return;
      }
    });

    // Close modal on overlay click
    const detailModal = document.getElementById('dashboard-detail-modal');
    if (detailModal) {
      detailModal.addEventListener('click', (e) => {
        if (e.target === detailModal) closeDetailModal();
      });
    }
    const custDetailModal = document.getElementById('customer-detail-modal');
    if (custDetailModal) {
      custDetailModal.addEventListener('click', (e) => {
        if (e.target === custDetailModal) closeCustomerDetailModal();
      });
    }
  }

  // ============================================
  // STAT DETAIL POP-UPS (Component 7)
  // ============================================

  async function openStatDetail(stat) {
    const modal = document.getElementById('dashboard-detail-modal');
    const title = document.getElementById('dashboard-detail-title');
    const body = document.getElementById('dashboard-detail-body');
    if (!modal || !body) return;

    let html = '';

    switch (stat) {
      case 'todays-sales':
        html = await renderTodaysSalesDetail();
        title.textContent = I18n.t('todays_sales_detail');
        break;
      case 'pending-dues':
        html = await renderPendingDuesDetail();
        title.textContent = I18n.t('pending_dues_detail');
        break;
      case 'low-stock':
        html = await renderLowStockDetail();
        title.textContent = I18n.t('low_stock_detail');
        break;
      case 'total-customers':
        html = await renderTotalCustomersDetail();
        title.textContent = I18n.t('total_customers_detail');
        break;
    }

    body.innerHTML = html;
    modal.classList.add('active');
    I18n.translatePage();
  }

  function closeDetailModal() {
    const modal = document.getElementById('dashboard-detail-modal');
    modal?.classList.remove('active');
    const inner = modal?.querySelector('.modal');
    inner?.classList.remove('modal-fullscreen');
  }

  async function renderTodaysSalesDetail() {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const allTransactions = await appDb.transactions.toArray();
    const customers = await appDb.customers.toArray();
    const customerMap = {};
    customers.forEach(c => customerMap[c.id] = c.name);

    const todayTx = allTransactions.filter(t => t.date === today);
    const todaySales = todayTx.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
    const yesterdayTx = allTransactions.filter(t => t.date === yesterday);
    const yesterdaySales = yesterdayTx.reduce((sum, t) => sum + (t.totalAmount || 0), 0);

    const maxSale = Math.max(todaySales, yesterdaySales, 1);
    const todayPct = Math.round((todaySales / maxSale) * 100);
    const yesterdayPct = Math.round((yesterdaySales / maxSale) * 100);

    if (todayTx.length === 0) {
      return `<div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-title" data-i18n="no_sales_today">${I18n.t('no_sales_today')}</div></div>`;
    }

    const txRows = todayTx.map(t => {
      const itemNames = (t.items || []).map(i => `${i.name} ×${I18n.formatNumber(i.qty)}`).join(', ');
      return `
        <tr>
          <td><strong>${t.billNo}</strong></td>
          <td>${customerMap[t.customerId] || '-'}</td>
          <td class="detail-items-cell">${itemNames}</td>
          <td><strong>${I18n.formatCurrencyShort(t.totalAmount)}</strong></td>
          <td>${getStatusBadge(t.paymentStatus)}</td>
        </tr>
      `;
    }).join('');

    return `
      <div class="detail-comparison">
        <div class="comparison-bar-group">
          <div class="comparison-item">
            <span class="comparison-label" data-i18n="todays_sales">${I18n.t('todays_sales')}</span>
            <div class="comparison-bar-track">
              <div class="comparison-bar today" style="width:${todayPct}%"></div>
            </div>
            <span class="comparison-value"><strong>${I18n.formatCurrencyShort(todaySales)}</strong></span>
          </div>
          <div class="comparison-item">
            <span class="comparison-label" data-i18n="yesterday_sales">${I18n.t('yesterday_sales')}</span>
            <div class="comparison-bar-track">
              <div class="comparison-bar yesterday" style="width:${yesterdayPct}%"></div>
            </div>
            <span class="comparison-value">${I18n.formatCurrencyShort(yesterdaySales)}</span>
          </div>
        </div>
      </div>
      <div class="table-container" style="margin-top:20px;">
        <table class="data-table">
          <thead>
            <tr>
              <th data-i18n="bill_no">Bill No.</th>
              <th data-i18n="customer">Customer</th>
              <th data-i18n="sold_today">Items Sold</th>
              <th data-i18n="total_amount">Total</th>
              <th data-i18n="payment_status">Status</th>
            </tr>
          </thead>
          <tbody>${txRows}</tbody>
        </table>
      </div>
    `;
  }

  async function renderPendingDuesDetail() {
    const allTransactions = await appDb.transactions.toArray();
    const customers = await appDb.customers.toArray();
    const customerMap = {};
    customers.forEach(c => customerMap[c.id] = c.name);

    const dueTx = allTransactions.filter(t => t.dueAmount > 0).sort((a, b) => b.dueAmount - a.dueAmount);

    if (dueTx.length === 0) {
      return `<div class="empty-state"><div class="empty-state-icon">✅</div><div class="empty-state-title" data-i18n="no_due">${I18n.t('no_due')}</div></div>`;
    }

    const totalDue = dueTx.reduce((sum, t) => sum + t.dueAmount, 0);

    const rows = dueTx.map(t => `
      <tr>
        <td><strong>${t.billNo}</strong></td>
        <td>${customerMap[t.customerId] || '-'}</td>
        <td>${I18n.formatDate(t.date)}</td>
        <td><strong>${I18n.formatCurrencyShort(t.totalAmount)}</strong></td>
        <td>${I18n.formatCurrencyShort(t.paidAmount)}</td>
        <td class="customer-dues"><strong>${I18n.formatCurrencyShort(t.dueAmount)}</strong></td>
      </tr>
    `).join('');

    return `
      <div class="detail-summary-banner danger">
        <span data-i18n="pending_dues">${I18n.t('pending_dues')}</span>:
        <strong>${I18n.formatCurrencyShort(totalDue)}</strong>
        <span class="detail-count">(${I18n.formatNumber(dueTx.length)} ${I18n.t('transaction_count')})</span>
      </div>
      <div class="table-container" style="margin-top:16px;">
        <table class="data-table">
          <thead>
            <tr>
              <th data-i18n="bill_no">Bill No.</th>
              <th data-i18n="customer">Customer</th>
              <th data-i18n="date">Date</th>
              <th data-i18n="total_amount">Total</th>
              <th data-i18n="paid_amount">Paid</th>
              <th data-i18n="due_amount">Due</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  async function renderLowStockDetail() {
    const products = await appDb.products.toArray();
    const lowProducts = products.filter(p => p.quantity <= 10).sort((a, b) => a.quantity - b.quantity);

    if (lowProducts.length === 0) {
      return `<div class="empty-state"><div class="empty-state-icon">✅</div><div class="empty-state-title">All items are well stocked</div></div>`;
    }

    const rows = lowProducts.map(p => {
      const statusBadge = p.quantity <= 0
        ? `<span class="badge badge-danger"><span class="badge-dot"></span> <span data-i18n="out_of_stock">${I18n.t('out_of_stock')}</span></span>`
        : `<span class="badge badge-warning"><span class="badge-dot"></span> <span data-i18n="low_stock">${I18n.t('low_stock')}</span></span>`;
      return `
        <tr>
          <td><strong>${p.name}</strong></td>
          <td><span data-i18n="category_${p.category}">${I18n.t('category_' + p.category)}</span></td>
          <td class="${p.quantity <= 0 ? 'customer-dues' : ''}">${I18n.formatNumber(p.quantity)} <span class="text-muted" data-i18n="unit_${p.unit}">${I18n.t('unit_' + p.unit)}</span></td>
          <td>${I18n.formatCurrencyShort(p.price)}</td>
          <td>${statusBadge}</td>
        </tr>
      `;
    }).join('');

    return `
      <div class="detail-summary-banner warning">
        <span data-i18n="low_stock_items">${I18n.t('low_stock_items')}</span>:
        <strong>${I18n.formatNumber(lowProducts.length)}</strong> ${I18n.t('items_count')}
      </div>
      <div class="table-container" style="margin-top:16px;">
        <table class="data-table">
          <thead>
            <tr>
              <th data-i18n="product_name">Product</th>
              <th data-i18n="category">Category</th>
              <th data-i18n="quantity">Quantity</th>
              <th data-i18n="price_rate">Price</th>
              <th data-i18n="status">Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  async function renderTotalCustomersDetail() {
    const customers = await appDb.customers.toArray();
    const allTransactions = await appDb.transactions.toArray();
    const customerStats = {};
    allTransactions.forEach(t => {
      if (!customerStats[t.customerId]) {
        customerStats[t.customerId] = { totalPurchases: 0, pendingDues: 0, count: 0 };
      }
      customerStats[t.customerId].totalPurchases += (t.totalAmount || 0);
      customerStats[t.customerId].pendingDues += (t.dueAmount || 0);
      customerStats[t.customerId].count++;
    });

    if (customers.length === 0) {
      return `<div class="empty-state"><div class="empty-state-icon">👥</div><div class="empty-state-title" data-i18n="no_customers">${I18n.t('no_customers')}</div></div>`;
    }

    const rows = customers.map(c => {
      const stats = customerStats[c.id] || { totalPurchases: 0, pendingDues: 0, count: 0 };
      return `
        <tr class="clickable-row" data-action="view-customer-detail" data-customer-id="${c.id}">
          <td><strong>${c.name}</strong> ${c.isFrequent ? '<span class="badge badge-primary" style="font-size:0.65rem;padding:2px 6px;">★</span>' : ''}</td>
          <td>${c.phone || '-'}</td>
          <td class="customer-purchases">${I18n.formatCurrencyShort(stats.totalPurchases)}</td>
          <td class="${stats.pendingDues > 0 ? 'customer-dues' : 'customer-dues zero'}">${I18n.formatCurrencyShort(stats.pendingDues)}</td>
          <td>${I18n.formatNumber(stats.count)}</td>
        </tr>
      `;
    }).join('');

    return `
      <div class="detail-summary-banner success">
        <span data-i18n="total_customers">${I18n.t('total_customers')}</span>:
        <strong>${I18n.formatNumber(customers.length)}</strong>
      </div>
      <div class="table-container" style="margin-top:16px;">
        <table class="data-table">
          <thead>
            <tr>
              <th data-i18n="customer_name">Customer</th>
              <th data-i18n="phone">Phone</th>
              <th data-i18n="total_purchases">Total Purchases</th>
              <th data-i18n="pending_dues_col">Pending Dues</th>
              <th data-i18n="transaction_count">Transactions</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  // ============================================
  // CUSTOMER DETAIL MODAL (shared by Component 5)
  // ============================================

  async function openCustomerDetail(customerId) {
    const modal = document.getElementById('customer-detail-modal');
    const body = document.getElementById('customer-detail-body');
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

    // Transaction history
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
        <div class="cdp-avatar">${customer.name.split(' ').map(w => w.charAt(0)).slice(0, 2).join('').toUpperCase()}</div>
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
    const modal = document.getElementById('customer-detail-modal');
    modal?.classList.remove('active');
    const inner = modal?.querySelector('.modal');
    inner?.classList.remove('modal-fullscreen');
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

  // Expose openCustomerDetail globally for other pages
  window.openCustomerDetailFromDashboard = openCustomerDetail;

  return { render, afterRender };
})();

window.DashboardPage = DashboardPage;
