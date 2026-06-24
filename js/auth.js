// ============================================
// AUTH — Mock Offline Authentication with RBAC
// ============================================

const Auth = (() => {
  const USERS = [
    { username: 'admin', password: 'admin123', role: 'admin', displayName: 'Admin User' },
    { username: 'user', password: 'user123', role: 'staff', displayName: 'Staff User' }
  ];

  const SESSION_KEY = 'app_session';

  // Permission definitions per role
  const PERMISSIONS = {
    admin: [
      'view_dashboard', 'view_stock', 'view_customers', 'view_transactions',
      'create_transaction', 'edit_transaction', 'delete_transaction',
      'add_product', 'edit_product', 'delete_product', 'adjust_stock',
      'add_customer', 'edit_customer', 'delete_customer',
      'view_admin_payments', 'record_payment', 'quick_edit_payment',
      'view_analytics', 'view_customer_detail', 'view_dashboard_detail'
    ],
    staff: [
      'view_dashboard', 'view_stock', 'view_customers', 'view_transactions',
      'create_transaction', 'view_customer_detail',
      'add_customer'
    ]
  };

  function login(username, password) {
    const user = USERS.find(u => u.username === username && u.password === password);
    if (user) {
      const session = {
        username: user.username,
        role: user.role,
        displayName: user.displayName,
        loggedInAt: new Date().toISOString()
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return { success: true, user: session };
    }
    return { success: false };
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    window.location.hash = '#/login';
  }

  function getCurrentUser() {
    const session = localStorage.getItem(SESSION_KEY);
    if (!session) return null;
    try {
      return JSON.parse(session);
    } catch {
      return null;
    }
  }

  function isLoggedIn() {
    return getCurrentUser() !== null;
  }

  function isAdmin() {
    const user = getCurrentUser();
    return user?.role === 'admin';
  }

  function isStaff() {
    const user = getCurrentUser();
    return user?.role === 'staff';
  }

  function hasPermission(action) {
    const user = getCurrentUser();
    if (!user) return false;
    const perms = PERMISSIONS[user.role] || [];
    return perms.includes(action);
  }

  function getInitials() {
    const user = getCurrentUser();
    if (!user) return '?';
    return user.displayName.split(' ').map(w => w[0]).join('').toUpperCase();
  }

  return { login, logout, getCurrentUser, isLoggedIn, isAdmin, isStaff, hasPermission, getInitials };
})();

window.Auth = Auth;
