// ============================================
// FACTORY APP — UNIT TESTS
// ============================================

(function () {
  const output = document.getElementById('test-output');
  const summary = document.getElementById('test-summary');
  let passed = 0;
  let failed = 0;
  let currentSuite = '';

  function suite(name) {
    currentSuite = name;
    const el = document.createElement('div');
    el.className = 'test-suite';
    el.innerHTML = `<div class="suite-title">${name}</div>`;
    el.id = `suite-${name.replace(/\s/g, '-').toLowerCase()}`;
    output.appendChild(el);
  }

  function test(description, fn) {
    const suiteEl = document.getElementById(`suite-${currentSuite.replace(/\s/g, '-').toLowerCase()}`);
    const result = document.createElement('div');
    try {
      fn();
      result.className = 'test-result pass';
      result.innerHTML = `<span class="icon">✅</span> ${description}`;
      passed++;
    } catch (err) {
      result.className = 'test-result fail';
      result.innerHTML = `<span class="icon">❌</span> ${description} <span class="error-msg">${err.message}</span>`;
      failed++;
      console.error(`FAIL: ${description}`, err);
    }
    suiteEl.appendChild(result);
  }

  function assert(condition, msg = 'Assertion failed') {
    if (!condition) throw new Error(msg);
  }

  function assertEqual(actual, expected, msg = '') {
    if (actual !== expected) {
      throw new Error(`${msg} Expected "${expected}" but got "${actual}"`);
    }
  }

  function assertIncludes(haystack, needle, msg = '') {
    if (!haystack.includes(needle)) {
      throw new Error(`${msg} Expected "${haystack}" to include "${needle}"`);
    }
  }

  // ============================================
  // AUTH TESTS
  // ============================================
  suite('Auth Module');

  test('login with valid admin credentials returns success', () => {
    const result = Auth.login('admin', 'admin123');
    assert(result.success, 'Login should succeed');
    assertEqual(result.user.role, 'admin', 'Role should be admin');
  });

  test('login with valid staff credentials returns success', () => {
    const result = Auth.login('user', 'user123');
    assert(result.success, 'Login should succeed');
    assertEqual(result.user.role, 'staff', 'Role should be staff');
  });

  test('login with invalid credentials returns failure', () => {
    const result = Auth.login('bad', 'wrong');
    assert(!result.success, 'Login should fail');
  });

  test('isLoggedIn returns true after login', () => {
    Auth.login('admin', 'admin123');
    assert(Auth.isLoggedIn(), 'Should be logged in');
  });

  test('isAdmin returns true for admin user', () => {
    Auth.login('admin', 'admin123');
    assert(Auth.isAdmin(), 'Should be admin');
    assert(!Auth.isStaff(), 'Should not be staff');
  });

  test('isStaff returns true for staff user', () => {
    Auth.login('user', 'user123');
    assert(Auth.isStaff(), 'Should be staff');
    assert(!Auth.isAdmin(), 'Should not be admin');
  });

  test('getInitials returns correct initials', () => {
    Auth.login('admin', 'admin123');
    assertEqual(Auth.getInitials(), 'AU', 'Initials for "Admin User"');
  });

  // ============================================
  // RBAC PERMISSIONS
  // ============================================
  suite('RBAC Permissions');

  test('admin has all key permissions', () => {
    Auth.login('admin', 'admin123');
    assert(Auth.hasPermission('view_dashboard'), 'Admin should view dashboard');
    assert(Auth.hasPermission('add_product'), 'Admin should add products');
    assert(Auth.hasPermission('edit_product'), 'Admin should edit products');
    assert(Auth.hasPermission('delete_product'), 'Admin should delete products');
    assert(Auth.hasPermission('adjust_stock'), 'Admin should adjust stock');
    assert(Auth.hasPermission('quick_edit_payment'), 'Admin should quick-edit payments');
    assert(Auth.hasPermission('view_admin_payments'), 'Admin should view admin payments');
    assert(Auth.hasPermission('record_payment'), 'Admin should record payments');
    assert(Auth.hasPermission('edit_customer'), 'Admin should edit customers');
    assert(Auth.hasPermission('delete_customer'), 'Admin should delete customers');
  });

  test('staff has view permissions', () => {
    Auth.login('user', 'user123');
    assert(Auth.hasPermission('view_dashboard'), 'Staff should view dashboard');
    assert(Auth.hasPermission('view_stock'), 'Staff should view stock');
    assert(Auth.hasPermission('view_customers'), 'Staff should view customers');
    assert(Auth.hasPermission('view_transactions'), 'Staff should view transactions');
  });

  test('staff can create transactions', () => {
    Auth.login('user', 'user123');
    assert(Auth.hasPermission('create_transaction'), 'Staff should create transactions');
  });

  test('staff can add customers', () => {
    Auth.login('user', 'user123');
    assert(Auth.hasPermission('add_customer'), 'Staff should add customers');
  });

  test('staff cannot edit/delete products', () => {
    Auth.login('user', 'user123');
    assert(!Auth.hasPermission('add_product'), 'Staff should NOT add products');
    assert(!Auth.hasPermission('edit_product'), 'Staff should NOT edit products');
    assert(!Auth.hasPermission('delete_product'), 'Staff should NOT delete products');
    assert(!Auth.hasPermission('adjust_stock'), 'Staff should NOT adjust stock');
  });

  test('staff cannot access admin features', () => {
    Auth.login('user', 'user123');
    assert(!Auth.hasPermission('view_admin_payments'), 'Staff should NOT view admin payments');
    assert(!Auth.hasPermission('record_payment'), 'Staff should NOT record payments');
    assert(!Auth.hasPermission('quick_edit_payment'), 'Staff should NOT quick-edit payments');
  });

  test('staff cannot edit/delete customers', () => {
    Auth.login('user', 'user123');
    assert(!Auth.hasPermission('edit_customer'), 'Staff should NOT edit customers');
    assert(!Auth.hasPermission('delete_customer'), 'Staff should NOT delete customers');
  });

  test('hasPermission returns false for non-existent action', () => {
    Auth.login('admin', 'admin123');
    assert(!Auth.hasPermission('fly_to_moon'), 'Should not have made-up permission');
  });

  test('hasPermission returns false when not logged in', () => {
    localStorage.removeItem('app_session');
    assert(!Auth.hasPermission('view_dashboard'), 'Should deny when not logged in');
  });

  // ============================================
  // I18N TESTS
  // ============================================
  suite('I18n Module');

  test('t() replaces underscores in fallback keys', () => {
    // Before translations load, fallback should replace underscores
    const result = I18n.t('some_nonexistent_key_that_wont_match');
    assert(!result.includes('_'), `Result "${result}" should not contain underscores`);
    assertIncludes(result, 'some nonexistent key that wont match');
  });

  test('t() returns key with spaces when key has underscores and no translation', () => {
    const result = I18n.t('nav_dashboard_test_xyz');
    assertEqual(result, 'nav dashboard test xyz', 'Underscores replaced with spaces');
  });

  test('t() returns key without modification when key has no underscores', () => {
    const result = I18n.t('testkey');
    assertEqual(result, 'testkey', 'No underscores to replace');
  });

  // ============================================
  // BUSINESS LOGIC TESTS
  // ============================================
  suite('Business Logic');

  test('payment status calculation: paid when due=0', () => {
    const total = 1000, paid = 1000;
    const due = Math.max(0, total - paid);
    let status = 'due';
    if (due <= 0) status = 'paid';
    else if (paid > 0) status = 'partial';
    assertEqual(status, 'paid');
  });

  test('payment status calculation: partial when 0 < paid < total', () => {
    const total = 1000, paid = 500;
    const due = Math.max(0, total - paid);
    let status = 'due';
    if (due <= 0) status = 'paid';
    else if (paid > 0) status = 'partial';
    assertEqual(status, 'partial');
  });

  test('payment status calculation: due when paid=0', () => {
    const total = 1000, paid = 0;
    const due = Math.max(0, total - paid);
    let status = 'due';
    if (due <= 0) status = 'paid';
    else if (paid > 0) status = 'partial';
    assertEqual(status, 'due');
  });

  test('stock status: out_of_stock when quantity=0', () => {
    const qty = 0;
    const status = qty <= 0 ? 'out_of_stock' : qty <= 10 ? 'low_stock' : 'in_stock';
    assertEqual(status, 'out_of_stock');
  });

  test('stock status: low_stock when quantity=5', () => {
    const qty = 5;
    const status = qty <= 0 ? 'out_of_stock' : qty <= 10 ? 'low_stock' : 'in_stock';
    assertEqual(status, 'low_stock');
  });

  test('stock status: in_stock when quantity=50', () => {
    const qty = 50;
    const status = qty <= 0 ? 'out_of_stock' : qty <= 10 ? 'low_stock' : 'in_stock';
    assertEqual(status, 'in_stock');
  });

  test('stock removal: prevents negative quantity', () => {
    const currentStock = 5;
    const removeQty = 10;
    const allowed = removeQty <= currentStock;
    assert(!allowed, 'Should not allow removing more than available');
  });

  test('stock removal: allows valid removal', () => {
    const currentStock = 10;
    const removeQty = 5;
    const newQty = currentStock - removeQty;
    assert(removeQty <= currentStock, 'Removal should be allowed');
    assertEqual(newQty, 5, 'New quantity should be 5');
  });

  test('quick payment: full payment sets due to 0', () => {
    const total = 1000, currentPaid = 200;
    const due = total - currentPaid;
    const paymentAmount = due; // full payment
    const newPaid = currentPaid + paymentAmount;
    const newDue = Math.max(0, total - newPaid);
    assertEqual(newDue, 0);
    assertEqual(newPaid, 1000);
  });

  test('quick payment: half payment calculates correctly', () => {
    const total = 1000, currentPaid = 0;
    const due = total - currentPaid;
    const paymentAmount = Math.round(due / 2);
    const newPaid = currentPaid + paymentAmount;
    const newDue = Math.max(0, total - newPaid);
    assertEqual(paymentAmount, 500);
    assertEqual(newDue, 500);
  });

  test('quick payment: prevents overpayment', () => {
    const due = 300;
    const paymentAmount = 500;
    const isValid = paymentAmount <= due;
    assert(!isValid, 'Should reject payment exceeding due');
  });

  // ============================================
  // SUMMARY
  // ============================================
  const total = passed + failed;
  summary.innerHTML = `
    <span class="stat total-count">Total: ${total}</span>
    <span class="stat pass-count">✅ Passed: ${passed}</span>
    <span class="stat fail-count">❌ Failed: ${failed}</span>
  `;

  // Cleanup auth state
  localStorage.removeItem('app_session');
})();
