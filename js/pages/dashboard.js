// ============================================
// DASHBOARD PAGE
// ============================================

const DashboardPage = (() => {

  async function render() {
    const today = new Date().toISOString().split('T')[0];

    // Compute stats
    const allTransactions = await appDb.transactions.toArray();
    const todayTransactions = allTransactions.filter(t => t.date === today);
    const todaySales = todayTransactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
    const pendingDues = allTransactions.reduce((sum, t) => sum + (t.dueAmount || 0), 0);

    const products = await appDb.products.toArray();
    const lowStockCount = products.filter(p => p.quantity <= 10 && p.quantity > 0).length +
                          products.filter(p => p.quantity <= 0).length;

    const totalCustomers = await appDb.customers.count();

    // Recent transactions (last 10)
    const recentTransactions = allTransactions.sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      return b.id - a.id;
    }).slice(0, 10);

    // Get customer names for transactions
    const customers = await appDb.customers.toArray();
    const customerMap = {};
    customers.forEach(c => customerMap[c.id] = c.name);

    let recentRowsHtml = '';
    if (recentTransactions.length === 0) {
      recentRowsHtml = `<tr><td colspan="6" class="table-empty"><div class="table-empty-icon">📋</div><span data-i18n="no_transactions">No transactions yet</span></td></tr>`;
    } else {
      recentRowsHtml = recentTransactions.map(t => {
        const statusBadge = getStatusBadge(t.paymentStatus);
        return `
          <tr>
            <td><strong>${t.billNo}</strong></td>
            <td>${I18n.formatDate(t.date)}</td>
            <td>${customerMap[t.customerId] || '-'}</td>
            <td><strong>${I18n.formatCurrencyShort(t.totalAmount)}</strong></td>
            <td>${statusBadge}</td>
            <td>
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

      <div class="stats-grid">
        <div class="stat-card primary">
          <div class="stat-card-header">
            <div>
              <div class="stat-card-label" data-i18n="todays_sales">Today's Sales</div>
              <div class="stat-card-value animate-value">${I18n.formatCurrencyShort(todaySales)}</div>
            </div>
            <div class="stat-card-icon">💰</div>
          </div>
        </div>
        <div class="stat-card danger">
          <div class="stat-card-header">
            <div>
              <div class="stat-card-label" data-i18n="pending_dues">Pending Dues</div>
              <div class="stat-card-value animate-value">${I18n.formatCurrencyShort(pendingDues)}</div>
            </div>
            <div class="stat-card-icon">📊</div>
          </div>
        </div>
        <div class="stat-card warning">
          <div class="stat-card-header">
            <div>
              <div class="stat-card-label" data-i18n="low_stock_items">Low Stock Items</div>
              <div class="stat-card-value animate-value">${I18n.formatNumber(lowStockCount)}</div>
            </div>
            <div class="stat-card-icon">📦</div>
          </div>
        </div>
        <div class="stat-card success">
          <div class="stat-card-header">
            <div>
              <div class="stat-card-label" data-i18n="total_customers">Total Customers</div>
              <div class="stat-card-value animate-value">${I18n.formatNumber(totalCustomers)}</div>
            </div>
            <div class="stat-card-icon">👥</div>
          </div>
        </div>
      </div>

      <div class="quick-actions">
        <button class="quick-action-btn qa-transaction" data-action="nav" data-href="#/transactions?new=1">
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

      <div class="card">
        <div class="card-header">
          <div class="card-title" data-i18n="recent_transactions">Recent Transactions</div>
        </div>
        <div class="table-container">
          <table class="data-table">
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
    `;
  }

  function afterRender() {
    const container = document.getElementById('page-container');
    if (!container) return;

    container.addEventListener('click', (e) => {
      const navBtn = e.target.closest('[data-action="nav"]');
      if (navBtn) {
        window.location.hash = navBtn.dataset.href;
        return;
      }

      const viewBtn = e.target.closest('[data-action="view-receipt"]');
      if (viewBtn) {
        window.location.hash = `#/receipt/${viewBtn.dataset.id}`;
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

window.DashboardPage = DashboardPage;
