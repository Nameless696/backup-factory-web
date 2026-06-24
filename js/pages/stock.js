// ============================================
// STOCK MANAGEMENT PAGE
// Components: Add/Remove stock, improved UX, RBAC
// ============================================

const StockPage = (() => {

  async function render() {
    const products = await appDb.products.toArray();
    const isAdmin = Auth.isAdmin();
    const canAdjust = Auth.hasPermission('adjust_stock');
    const canEdit = Auth.hasPermission('edit_product');
    const canAdd = Auth.hasPermission('add_product');

    // Status counts
    const inStock = products.filter(p => p.quantity > 10).length;
    const lowStock = products.filter(p => p.quantity > 0 && p.quantity <= 10).length;
    const outOfStock = products.filter(p => p.quantity <= 0).length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);

    let rowsHtml = '';
    if (products.length === 0) {
      rowsHtml = `<tr><td colspan="${canAdjust ? 7 : 5}" class="table-empty"><div class="table-empty-icon">📦</div><span data-i18n="no_products">No products yet</span></td></tr>`;
    } else {
      rowsHtml = products.map(p => {
        const statusInfo = getStockStatusBadge(p.quantity);
        const categoryKey = `category_${p.category}`;
        const unitKey = `unit_${p.unit}`;
        return `
          <tr>
            <td><strong>${p.name}</strong></td>
            <td><span data-i18n="${categoryKey}">${I18n.t(categoryKey)}</span></td>
            <td>${I18n.formatNumber(p.quantity)} <span class="text-muted" data-i18n="${unitKey}">${I18n.t(unitKey)}</span></td>
            <td>${I18n.formatCurrencyShort(p.price)}</td>
            <td>${statusInfo}</td>
            ${canAdjust ? `
              <td>
                <div class="product-actions stock-adjust-actions">
                  <input type="number" class="quick-stock-input" data-id="${p.id}" placeholder="0" min="1" value="">
                  <button class="btn btn-success btn-sm" data-action="quick-add-stock" data-id="${p.id}" title="${I18n.t('add_stock')}">
                    <span>+</span>
                  </button>
                  <button class="btn btn-warning btn-sm" data-action="quick-remove-stock" data-id="${p.id}" title="${I18n.t('remove_stock')}">
                    <span>−</span>
                  </button>
                </div>
              </td>
            ` : ''}
            ${canEdit ? `
              <td>
                <div class="product-actions">
                  <button class="btn btn-secondary btn-sm" data-action="edit-product" data-id="${p.id}">✏️</button>
                  <button class="btn btn-danger btn-sm" data-action="delete-product" data-id="${p.id}">🗑️</button>
                </div>
              </td>
            ` : ''}
          </tr>
        `;
      }).join('');
    }

    return `
      <div class="page-header">
        <div class="page-header-left">
          <h2 data-i18n="stock_title">Stock Management</h2>
          <p data-i18n="stock_subtitle">Manage your products and inventory</p>
        </div>
        ${canAdd ? `
          <div class="page-header-actions">
            <button class="btn btn-primary" id="btn-add-product">
              <span>+</span> <span data-i18n="add_product">Add Product</span>
            </button>
          </div>
        ` : ''}
      </div>

      <div class="stock-status-bar">
        <div class="stock-status-chip">
          <span class="badge badge-success"><span class="badge-dot"></span> <span data-i18n="in_stock">In Stock</span></span>
          <span class="count">${I18n.formatNumber(inStock)}</span>
        </div>
        <div class="stock-status-chip">
          <span class="badge badge-warning"><span class="badge-dot"></span> <span data-i18n="low_stock">Low Stock</span></span>
          <span class="count">${I18n.formatNumber(lowStock)}</span>
        </div>
        <div class="stock-status-chip">
          <span class="badge badge-danger"><span class="badge-dot"></span> <span data-i18n="out_of_stock">Out of Stock</span></span>
          <span class="count">${I18n.formatNumber(outOfStock)}</span>
        </div>
      </div>

      <div class="actions-row">
        <div class="search-bar">
          <span class="search-bar-icon">🔍</span>
          <input type="text" class="form-input" id="stock-search" data-i18n="search_products" placeholder="Search products...">
        </div>
      </div>

      <div class="card">
        <div class="table-container">
          <table class="data-table" id="stock-table">
            <thead>
              <tr>
                <th data-i18n="product_name">Product Name</th>
                <th data-i18n="category">Category</th>
                <th data-i18n="quantity">Quantity</th>
                <th data-i18n="price_rate">Price/Rate</th>
                <th data-i18n="status">Status</th>
                ${canAdjust ? `<th data-i18n="adjust_stock">Adjust Stock</th>` : ''}
                ${canEdit ? `<th data-i18n="actions">Actions</th>` : ''}
              </tr>
            </thead>
            <tbody id="stock-tbody">
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Product Modal -->
      <div class="modal-overlay" id="product-modal">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title" id="product-modal-title" data-i18n="add_product">Add Product</h3>
            <button class="modal-close" data-action="close-modal">✕</button>
          </div>
          <div class="modal-body">
            <form id="product-form">
              <input type="hidden" id="product-edit-id">
              <div class="form-group">
                <label class="form-label" data-i18n="product_name">Product Name</label>
                <input type="text" class="form-input" id="product-name" required>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" data-i18n="category">Category</label>
                  <select class="form-select" id="product-category">
                    <option value="pipes" data-i18n="category_pipes">Pipes</option>
                    <option value="containers" data-i18n="category_containers">Containers</option>
                    <option value="sheets" data-i18n="category_sheets">Sheets</option>
                    <option value="bags" data-i18n="category_bags">Bags</option>
                    <option value="bottles" data-i18n="category_bottles">Bottles</option>
                    <option value="other" data-i18n="category_other">Other</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label" data-i18n="unit">Unit</label>
                  <select class="form-select" id="product-unit">
                    <option value="pcs" data-i18n="unit_pcs">Pcs</option>
                    <option value="kg" data-i18n="unit_kg">Kg</option>
                    <option value="meter" data-i18n="unit_meter">Meter</option>
                    <option value="roll" data-i18n="unit_roll">Roll</option>
                    <option value="bundle" data-i18n="unit_bundle">Bundle</option>
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" data-i18n="price_rate">Price/Rate</label>
                  <input type="number" class="form-input" id="product-price" min="0" step="0.01" required>
                </div>
                <div class="form-group">
                  <label class="form-label" data-i18n="quantity">Quantity</label>
                  <input type="number" class="form-input" id="product-quantity" min="0" required>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" data-action="close-modal" data-i18n="cancel">Cancel</button>
            <button class="btn btn-primary" id="btn-save-product" data-i18n="save">Save</button>
          </div>
        </div>
      </div>
    `;
  }

  function afterRender() {
    const container = document.getElementById('page-container');
    if (!container) return;

    // Event delegation
    container.addEventListener('click', handleClick);

    // Search
    const searchInput = document.getElementById('stock-search');
    if (searchInput) {
      searchInput.addEventListener('input', handleSearch);
    }
  }

  function handleClick(e) {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (!action) {
      // Check for add product button
      if (e.target.closest('#btn-add-product')) {
        openProductModal();
        return;
      }
      if (e.target.closest('#btn-save-product')) {
        saveProduct();
        return;
      }
      return;
    }

    switch (action) {
      case 'close-modal':
        closeProductModal();
        break;
      case 'quick-add-stock':
        quickAddStock(e.target.closest('[data-action]').dataset.id);
        break;
      case 'quick-remove-stock':
        quickRemoveStock(e.target.closest('[data-action]').dataset.id);
        break;
      case 'edit-product':
        editProduct(e.target.closest('[data-action]').dataset.id);
        break;
      case 'delete-product':
        deleteProduct(e.target.closest('[data-action]').dataset.id);
        break;
    }
  }

  function openProductModal(product = null) {
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('product-modal-title');
    const editId = document.getElementById('product-edit-id');

    if (product) {
      title.setAttribute('data-i18n', 'edit_product');
      title.textContent = I18n.t('edit_product');
      editId.value = product.id;
      document.getElementById('product-name').value = product.name;
      document.getElementById('product-category').value = product.category;
      document.getElementById('product-unit').value = product.unit;
      document.getElementById('product-price').value = product.price;
      document.getElementById('product-quantity').value = product.quantity;
    } else {
      title.setAttribute('data-i18n', 'add_product');
      title.textContent = I18n.t('add_product');
      editId.value = '';
      document.getElementById('product-form').reset();
    }

    modal.classList.add('active');
    I18n.translatePage();
  }

  function closeProductModal() {
    document.getElementById('product-modal')?.classList.remove('active');
  }

  async function saveProduct() {
    const name = document.getElementById('product-name').value.trim();
    const category = document.getElementById('product-category').value;
    const unit = document.getElementById('product-unit').value;
    const price = parseFloat(document.getElementById('product-price').value) || 0;
    const quantity = parseInt(document.getElementById('product-quantity').value) || 0;
    const editId = document.getElementById('product-edit-id').value;

    if (!name || price <= 0) {
      Toast.warning(I18n.t('error_fill_required'));
      return;
    }

    const status = dbHelpers.getProductStatus(quantity);
    const now = new Date().toISOString();

    if (editId) {
      await appDb.products.update(parseInt(editId), {
        name, category, unit, price, quantity, status,
        syncStatus: 'pending', updatedAt: now
      });
      await dbHelpers.addToSyncQueue('update', 'products', parseInt(editId));
      Toast.success(I18n.t('success_product_updated'));
    } else {
      const id = await appDb.products.add({
        name, category, unit, price, quantity, status,
        syncStatus: 'pending', updatedAt: now
      });
      await dbHelpers.addToSyncQueue('create', 'products', id);
      Toast.success(I18n.t('success_product_added'));
    }

    closeProductModal();
    Sync.updatePendingCount();
    Router.navigate(window.location.hash);
  }

  async function quickAddStock(productId) {
    const input = document.querySelector(`.quick-stock-input[data-id="${productId}"]`);
    const addQty = parseInt(input?.value) || 0;
    if (addQty <= 0) {
      Toast.warning(I18n.t('error_invalid_amount'));
      return;
    }

    const product = await appDb.products.get(parseInt(productId));
    if (!product) return;

    const newQty = product.quantity + addQty;
    await appDb.products.update(parseInt(productId), {
      quantity: newQty,
      status: dbHelpers.getProductStatus(newQty),
      syncStatus: 'pending',
      updatedAt: new Date().toISOString()
    });
    await dbHelpers.addToSyncQueue('update', 'products', parseInt(productId));

    Toast.success(`+${addQty} ${I18n.t('success_stock_added')}`);
    Sync.updatePendingCount();
    Router.navigate(window.location.hash);
  }

  async function quickRemoveStock(productId) {
    const input = document.querySelector(`.quick-stock-input[data-id="${productId}"]`);
    const removeQty = parseInt(input?.value) || 0;
    if (removeQty <= 0) {
      Toast.warning(I18n.t('error_invalid_amount'));
      return;
    }

    const product = await appDb.products.get(parseInt(productId));
    if (!product) return;

    if (removeQty > product.quantity) {
      Toast.warning(I18n.t('error_insufficient_stock'));
      return;
    }

    const newQty = product.quantity - removeQty;
    await appDb.products.update(parseInt(productId), {
      quantity: newQty,
      status: dbHelpers.getProductStatus(newQty),
      syncStatus: 'pending',
      updatedAt: new Date().toISOString()
    });
    await dbHelpers.addToSyncQueue('update', 'products', parseInt(productId));

    Toast.success(`-${removeQty} ${I18n.t('success_stock_removed')}`);
    Sync.updatePendingCount();
    Router.navigate(window.location.hash);
  }

  async function editProduct(productId) {
    const product = await appDb.products.get(parseInt(productId));
    if (product) openProductModal(product);
  }

  async function deleteProduct(productId) {
    if (!confirm(I18n.t('confirm_delete'))) return;
    await appDb.products.delete(parseInt(productId));
    await dbHelpers.addToSyncQueue('delete', 'products', parseInt(productId));
    Toast.success(I18n.t('success_product_deleted'));
    Sync.updatePendingCount();
    Router.navigate(window.location.hash);
  }

  function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#stock-tbody tr');
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(query) ? '' : 'none';
    });
  }

  function getStockStatusBadge(quantity) {
    if (quantity <= 0) {
      return `<span class="badge badge-danger"><span class="badge-dot"></span> <span data-i18n="out_of_stock">${I18n.t('out_of_stock')}</span></span>`;
    }
    if (quantity <= 10) {
      return `<span class="badge badge-warning"><span class="badge-dot"></span> <span data-i18n="low_stock">${I18n.t('low_stock')}</span></span>`;
    }
    return `<span class="badge badge-success"><span class="badge-dot"></span> <span data-i18n="in_stock">${I18n.t('in_stock')}</span></span>`;
  }

  return { render, afterRender };
})();

window.StockPage = StockPage;
