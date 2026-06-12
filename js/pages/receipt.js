// ============================================
// RECEIPT PAGE — Matches Physical Factory Bill
// ============================================

const ReceiptPage = (() => {

  async function render(params) {
    const txId = parseInt(params.id);
    const tx = await appDb.transactions.get(txId);

    if (!tx) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-title">Receipt not found</div>
          <button class="btn btn-primary" onclick="window.location.hash='#/transactions'" data-i18n="back_to_transactions">← Back</button>
        </div>
      `;
    }

    const customer = await appDb.customers.get(tx.customerId);
    const statusBadge = getStatusBadge(tx.paymentStatus);

    // Build item rows
    const itemRows = (tx.items || []).map((item, idx) => {
      const totalRs = Math.floor(item.total);
      const totalPaisa = Math.round((item.total - totalRs) * 100);
      return `
        <tr>
          <td>${I18n.getLang() === 'ne' ? I18n.toNepaliDigits(idx + 1) : idx + 1}</td>
          <td>${item.name}</td>
          <td style="text-align:center;">${I18n.formatNumber(item.qty)}</td>
          <td style="text-align:right;">${I18n.formatNumber(item.rate)}</td>
          <td class="amount">${I18n.formatNumber(totalRs)}</td>
          <td class="amount">${I18n.formatNumber(totalPaisa).padStart(2, '0')}</td>
        </tr>
      `;
    }).join('');

    // Grand total split
    const grandTotalRs = Math.floor(tx.totalAmount);
    const grandTotalPaisa = Math.round((tx.totalAmount - grandTotalRs) * 100);

    // Amount in words
    const amountWords = I18n.amountInWords(tx.totalAmount);

    return `
      <div class="receipt-wrapper">
        <div class="receipt-actions">
          <button class="btn btn-secondary" onclick="window.location.hash='#/transactions'">
            <span data-i18n="back_to_transactions">← Back to Transactions</span>
          </button>
          <button class="btn btn-primary" id="btn-print-receipt">
            <span>🖨️</span> <span data-i18n="print_receipt">Print Receipt</span>
          </button>
        </div>

        <div class="receipt" id="receipt-printable">
          <div class="receipt-status-overlay">
            ${statusBadge}
          </div>

          <!-- Header -->
          <div class="receipt-header">
            <div class="receipt-logo-area">
              <div class="receipt-logo">NP</div>
              <div>
                <div class="receipt-company-name receipt-company-name-ne" data-i18n="app_name_full">${I18n.t('app_name_full')}</div>
                <div class="receipt-address" data-i18n="address">${I18n.t('address')}</div>
              </div>
            </div>
            <div class="receipt-bill-no">${I18n.getLang() === 'ne' ? I18n.toNepaliDigits(tx.billNo) : tx.billNo}</div>
          </div>

          <!-- Meta info -->
          <div class="receipt-meta">
            <div class="receipt-meta-item">
              <span class="receipt-meta-label" data-i18n="bill_no">${I18n.t('bill_no')}:</span>
              <span class="receipt-meta-value">${I18n.getLang() === 'ne' ? I18n.toNepaliDigits(tx.billNo) : tx.billNo}</span>
            </div>
            <div class="receipt-meta-item">
              <span class="receipt-meta-label" data-i18n="date">${I18n.t('date')}:</span>
              <span class="receipt-meta-value">${I18n.formatDate(tx.date)}</span>
            </div>
            <div class="receipt-meta-item">
              <span class="receipt-meta-label" data-i18n="pan_label">${I18n.t('pan_label')}:</span>
              <span class="receipt-meta-value" data-i18n="pan_number">${I18n.t('pan_number')}</span>
            </div>
            <div class="receipt-meta-item">
              <span class="receipt-meta-label" data-i18n="payment_status">${I18n.t('payment_status')}:</span>
              <span class="receipt-meta-value">${statusBadge}</span>
            </div>
            <div class="receipt-meta-item" style="grid-column:1/-1;">
              <span class="receipt-meta-label" data-i18n="buyer_name">${I18n.t('buyer_name')}:</span>
              <span class="receipt-meta-value">${customer?.name || '-'}</span>
            </div>
            <div class="receipt-meta-item" style="grid-column:1/-1;">
              <span class="receipt-meta-label" data-i18n="buyer_address">${I18n.t('buyer_address')}:</span>
              <span class="receipt-meta-value">-</span>
            </div>
          </div>

          <!-- Items Table (matching physical bill format) -->
          <table class="receipt-table">
            <thead>
              <tr>
                <th data-i18n="sn">${I18n.t('sn')}</th>
                <th data-i18n="description">${I18n.t('description')}</th>
                <th data-i18n="quantity">${I18n.t('quantity')}</th>
                <th data-i18n="rate">${I18n.t('rate')}</th>
                <th colspan="2">${I18n.t('total_amount')}</th>
              </tr>
              <tr>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th style="text-align:right;">${I18n.t('currency_symbol')}</th>
                <th style="text-align:right;">${I18n.t('paisa')}</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="4" style="text-align:right;"><strong>${I18n.t('grand_total')}</strong></td>
                <td class="amount"><strong>${I18n.formatNumber(grandTotalRs)}</strong></td>
                <td class="amount"><strong>${I18n.formatNumber(grandTotalPaisa).toString().padStart(2, '0')}</strong></td>
              </tr>
            </tfoot>
          </table>

          <!-- Amount in Words -->
          <div class="receipt-words">
            <span class="receipt-words-label" data-i18n="amount_in_words">${I18n.t('amount_in_words')}</span>
            <span class="receipt-words-value"> ${amountWords}</span>
          </div>

          <!-- Payment Summary -->
          ${tx.paymentStatus !== 'paid' ? `
            <div style="margin-bottom:24px;">
              <div class="bill-summary-row">
                <span data-i18n="paid_amount">${I18n.t('paid_amount')}:</span>
                <span><strong>${I18n.formatCurrencyShort(tx.paidAmount)}</strong></span>
              </div>
              <div class="bill-summary-row due">
                <span data-i18n="due_amount">${I18n.t('due_amount')}:</span>
                <span><strong>${I18n.formatCurrencyShort(tx.dueAmount)}</strong></span>
              </div>
            </div>
          ` : ''}

          <!-- Footer / Signature -->
          <div class="receipt-footer">
            <div></div>
            <div class="receipt-signature">
              <div class="receipt-signature-line"></div>
              <div class="receipt-signature-label" data-i18n="authorized_signature">${I18n.t('authorized_signature')}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function afterRender() {
    const printBtn = document.getElementById('btn-print-receipt');
    if (printBtn) {
      printBtn.addEventListener('click', () => window.print());
    }
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

window.ReceiptPage = ReceiptPage;
