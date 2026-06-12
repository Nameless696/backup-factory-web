// ============================================
// AUTH — Mock Offline Authentication
// ============================================

const Auth = (() => {
  const USERS = [
    { username: 'admin', password: 'admin123', role: 'admin', displayName: 'Admin User' },
    { username: 'user', password: 'user123', role: 'user', displayName: 'Staff User' }
  ];

  const SESSION_KEY = 'app_session';

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

  function getInitials() {
    const user = getCurrentUser();
    if (!user) return '?';
    return user.displayName.split(' ').map(w => w[0]).join('').toUpperCase();
  }

  return { login, logout, getCurrentUser, isLoggedIn, isAdmin, getInitials };
})();

window.Auth = Auth;
