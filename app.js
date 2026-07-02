/**
 * APEX 2026 — Main Application Logic
 * Handles routing, UI rendering, and event handling
 */

// ─── State ─────────────────────────────────────────────────────────────────
let currentPage = 'home';
let currentSession = null;
let selectedRating = 0;
let liveUpdateInterval = null;
let currentLbTab = 'visits';

// ─── Init ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initNavbar();
  restoreSession();
  setupEventListeners();
  navigateTo('home');
  startLiveUpdates();
});

// ─── Particles ─────────────────────────────────────────────────────────────
function initParticles() {
  const container = document.getElementById('bgParticles');
  const colors = ['#00d4ff', '#7c3aed', '#ec4899', '#10b981', '#f59e0b'];
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 4 + 2;
    p.style.cssText = `
      width: ${size}px; height: ${size}px;
      left: ${Math.random() * 100}%;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      animation-duration: ${Math.random() * 20 + 15}s;
      animation-delay: ${Math.random() * 15}s;
    `;
    container.appendChild(p);
  }
}

// ─── Navbar ────────────────────────────────────────────────────────────────
function initNavbar() {
  // Scroll effect
  window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 10);
  });

  // Hamburger
  document.getElementById('hamburger').addEventListener('click', () => {
    document.getElementById('navLinks').classList.toggle('open');
  });

  // Nav brand click → home
  document.querySelector('.nav-brand').addEventListener('click', () => navigateTo('home'));

  // Nav links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const page = link.dataset.page;
      navigateTo(page);
      document.getElementById('navLinks').classList.remove('open');
    });
  });

  // Logout
  document.getElementById('btnLogout').addEventListener('click', handleLogout);
}

// ─── Routing ───────────────────────────────────────────────────────────────
function navigateTo(page) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  currentPage = page;
  const el = document.getElementById(`page-${page}`);
  if (el) {
    el.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Highlight active nav
  const navEl = document.querySelector(`[data-page="${page}"]`);
  if (navEl) navEl.classList.add('active');

  // Render page
  renderPage(page);
}

function renderPage(page) {
  switch (page) {
    case 'home': renderHomePage(); break;
    case 'leaderboard': renderLeaderboard(); break;
    case 'student-dashboard': renderStudentDashboard(); break;
    case 'club-dashboard': renderClubDashboard(); break;
    case 'club-login': renderClubLoginPage(); break;
  }
}

// ─── Session ───────────────────────────────────────────────────────────────
function restoreSession() {
  const session = DB.getSession();
  if (!session) return;
  currentSession = session;
  updateNavForSession(session);
}

function updateNavForSession(session) {
  const badge = document.getElementById('navUserBadge');
  const logoutBtn = document.getElementById('btnLogout');
  if (session) {
    badge.textContent = session.type === 'student' ? session.id : session.id;
    badge.classList.remove('hidden');
    logoutBtn.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
    logoutBtn.classList.add('hidden');
  }
}

function handleLogout() {
  DB.clearSession();
  currentSession = null;
  updateNavForSession(null);
  showToast('Logged out successfully', 'info', '👋');
  navigateTo('home');
}

// ─── Live Updates ──────────────────────────────────────────────────────────
function startLiveUpdates() {
  window.addEventListener('apex-data-update', () => {
    if (currentPage === 'home') renderHomePage();
    if (currentPage === 'leaderboard') renderLeaderboard();
    if (currentPage === 'student-dashboard') renderStudentDashboard();
    if (currentPage === 'club-dashboard') renderClubDashboard();
  });

  // Poll every 5 seconds
  setInterval(() => {
    window.dispatchEvent(new Event('apex-data-update'));
  }, 5000);
}

// ─── HOME PAGE ─────────────────────────────────────────────────────────────
function renderHomePage() {
  const stats = DB.getGlobalStats();
  animateNumber('totalStudents', stats.totalCheckins);
  animateNumber('totalClubs', stats.totalClubs);
  animateNumber('totalRatings', stats.totalRatings);
  document.getElementById('avgRating').textContent = stats.avgRating;
  document.getElementById('clubCountDisplay').textContent = stats.totalClubs;

  const sorted = DB.getAllClubsSorted('visits').slice(0, 6);
  const grid = document.getElementById('homeClubsGrid');
  grid.innerHTML = sorted.map((club, i) => `
    <div class="club-card">
      <div class="club-card-rank ${getRankClass(i)}">
        ${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
      </div>
      <div class="club-card-icon">${club.icon}</div>
      <div class="club-card-name">${club.name}</div>
      <div class="club-card-category">${club.category}</div>
      <div class="club-card-stats">
        <div class="club-mini-stat">
          <span class="club-mini-val">${club.total}</span>
          <span class="club-mini-label">Visitors</span>
        </div>
        <div class="club-mini-stat">
          <span class="club-mini-val">${club.avgRating}</span>
          <span class="club-mini-label">Rating</span>
        </div>
      </div>
      <div class="club-rating-stars">${starsDisplay(parseFloat(club.avgRating))}</div>
    </div>
  `).join('');
}

function animateNumber(elId, target) {
  const el = document.getElementById(elId);
  if (!el) return;
  const current = parseInt(el.textContent) || 0;
  if (current === target) return;
  const diff = target - current;
  const steps = 20;
  let step = 0;
  const timer = setInterval(() => {
    step++;
    el.textContent = Math.round(current + (diff * step / steps));
    if (step >= steps) clearInterval(timer);
  }, 30);
}

// ─── LEADERBOARD ───────────────────────────────────────────────────────────
function renderLeaderboard() {
  const sorted = DB.getAllClubsSorted(currentLbTab === 'rating' ? 'rating' : 'visits');
  const container = document.getElementById('leaderboardContainer');

  if (sorted.every(c => c.total === 0)) {
    container.innerHTML = `<div class="lb-empty">🏁 No check-ins yet! Be the first to visit a stall.</div>`;
    return;
  }

  container.innerHTML = sorted.map((club, i) => `
    <div class="lb-row ${i < 3 ? `top-${i + 1}` : ''}">
      <div class="lb-pos ${i < 3 ? `lb-pos-${i + 1}` : 'lb-pos-other'}">
        ${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
      </div>
      <div class="lb-icon">${club.icon}</div>
      <div class="lb-info">
        <div class="lb-name">${club.name}</div>
        <div class="lb-category">${club.category}</div>
        <div class="lb-id">${club.id} • ${club.stall}</div>
      </div>
      <div class="lb-stats">
        <div class="lb-stat">
          <div class="lb-stat-val">${club.total}</div>
          <div class="lb-stat-label">Visitors</div>
        </div>
        <div class="lb-stat">
          <div class="lb-stat-val">${club.avgRating}</div>
          <div class="lb-stat-label">Avg Rating</div>
        </div>
        <div class="lb-stat">
          <div class="lb-stat-val">${starsDisplay(parseFloat(club.avgRating))}</div>
          <div class="lb-stat-label">Stars</div>
        </div>
      </div>
    </div>
  `).join('');
}

// ─── STUDENT DASHBOARD ─────────────────────────────────────────────────────
function renderStudentDashboard() {
  if (!currentSession || currentSession.type !== 'student') return;
  const student = DB.getStudentById(currentSession.id);
  if (!student) return;

  document.getElementById('studentName').textContent = student.name.split(' ')[0];
  document.getElementById('studentIdDisplay').textContent = student.id;

  const checkins = DB.getCheckinsByStudent(student.id);
  document.getElementById('myVisits').textContent = checkins.length;
  document.getElementById('myRatings').textContent = checkins.length;

  // Visit history
  const histEl = document.getElementById('myVisitHistory');
  if (checkins.length === 0) {
    histEl.innerHTML = `<p class="empty-state">No visits yet. Go explore some stalls! 🚀</p>`;
    return;
  }
  const clubs = DB.getClubs();
  histEl.innerHTML = [...checkins].reverse().map(c => {
    const club = clubs.find(cl => cl.id === c.clubId);
    return `
      <div class="visit-card">
        <div>
          <div class="visit-club-name">${club ? club.icon + ' ' + club.name : c.clubId}</div>
          <div class="visit-club-id">${c.clubId} • ${club ? club.stall : ''}</div>
        </div>
        <div class="visit-rating">${starsDisplay(c.rating)}</div>
        ${c.comment ? `<div style="font-size:0.82rem;color:var(--text-secondary);font-style:italic;">"${c.comment}"</div>` : ''}
        <div class="visit-time">${formatTime(c.timestamp)}</div>
      </div>
    `;
  }).join('');
}

// ─── CLUB DASHBOARD ────────────────────────────────────────────────────────
function renderClubDashboard() {
  if (!currentSession || currentSession.type !== 'club') return;
  const club = DB.getClubById(currentSession.id);
  if (!club) return;

  const stats = DB.getClubStats(club.id);
  const allSorted = DB.getAllClubsSorted('visits');
  const rank = allSorted.findIndex(c => c.id === club.id) + 1;

  document.getElementById('clubDashTitle').textContent = `${club.icon} ${club.name}`;
  document.getElementById('clubIdDisplay').textContent = club.id;
  document.getElementById('clubCurrentRank').textContent = `#${rank}`;
  document.getElementById('clubTotalStudents').textContent = stats.total;
  document.getElementById('clubAvgRating').textContent = stats.avgRating;
  document.getElementById('clubTodayStudents').textContent = stats.todayCount;
  document.getElementById('clubTotalComments').textContent = stats.totalComments;

  // Rating distribution
  const maxCount = Math.max(...stats.ratingDist.map(r => r.count), 1);
  document.getElementById('ratingDistribution').innerHTML = stats.ratingDist.map(r => `
    <div class="rating-bar-row">
      <span class="rating-bar-label">${'★'.repeat(r.stars)}</span>
      <div class="rating-bar-track">
        <div class="rating-bar-fill" style="width: ${(r.count / maxCount * 100)}%"></div>
      </div>
      <span class="rating-bar-count">${r.count}</span>
    </div>
  `).join('');

  // Visitor feed (latest 10)
  const students = DB.getStudents();
  const recentCheckins = [...stats.checkins].reverse().slice(0, 15);
  document.getElementById('visitorFeed').innerHTML = recentCheckins.length
    ? recentCheckins.map(c => {
        const s = students.find(st => st.id === c.studentId);
        return `
          <div class="feed-item">
            <div class="feed-dot"></div>
            <span class="feed-student">${s ? s.name : c.studentId}</span>
            <span class="feed-rating">${starsDisplay(c.rating)}</span>
            <span class="feed-time">${formatTimeShort(c.timestamp)}</span>
          </div>
        `;
      }).join('')
    : '<p style="color:var(--text-muted);font-size:0.85rem;text-align:center;padding:1rem;">No visitors yet</p>';

  // Students table
  renderStudentsTable(stats.checkins, students);
}

function renderStudentsTable(checkins, students) {
  const tbody = document.getElementById('studentsTableBody');
  const emptyState = document.getElementById('emptyTableState');
  const query = document.getElementById('studentSearch').value.toLowerCase();

  if (checkins.length === 0) {
    tbody.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  const filtered = [...checkins].reverse().filter(c => {
    const s = students.find(st => st.id === c.studentId);
    const name = s ? s.name.toLowerCase() : '';
    return name.includes(query) || c.studentId.toLowerCase().includes(query);
  });

  tbody.innerHTML = filtered.map((c, i) => {
    const s = students.find(st => st.id === c.studentId);
    return `
      <tr>
        <td>${i + 1}</td>
        <td class="td-id">${c.studentId}</td>
        <td class="td-name">${s ? s.name : '—'}</td>
        <td>${s ? s.dept : '—'}</td>
        <td class="td-rating">${starsDisplay(c.rating)} <span style="color:var(--text-muted);font-size:0.78rem;">(${c.rating}/5)</span></td>
        <td class="td-comment">${c.comment || '<span style="color:var(--text-muted)">—</span>'}</td>
        <td class="td-time">${formatTime(c.timestamp)}</td>
      </tr>
    `;
  }).join('');
}

// ─── CLUB LOGIN PAGE ────────────────────────────────────────────────────────
function renderClubLoginPage() {
  const clubs = DB.getClubs();
  const table = clubs.map(c => `${c.id} / pwd: <b>${INITIAL_CLUBS.find(ic => ic.id === c.id)?.password || 'see below'}</b>`).join('<br/>');
  document.getElementById('demoCredsTable').innerHTML = table;
}

// ─── EVENT LISTENERS ───────────────────────────────────────────────────────
function setupEventListeners() {
  // Hero buttons
  document.getElementById('heroStudentBtn').addEventListener('click', () => {
    if (currentSession?.type === 'student') navigateTo('student-dashboard');
    else navigateTo('student-login');
  });
  document.getElementById('heroLeaderboardBtn').addEventListener('click', () => navigateTo('leaderboard'));

  // Auth links (dynamic)
  document.addEventListener('click', e => {
    const link = e.target.closest('.auth-link');
    if (link) { e.preventDefault(); navigateTo(link.dataset.page); }
  });

  // Leaderboard tabs
  document.getElementById('tabVisits').addEventListener('click', () => {
    currentLbTab = 'visits';
    document.getElementById('tabVisits').classList.add('active');
    document.getElementById('tabRating').classList.remove('active');
    renderLeaderboard();
  });
  document.getElementById('tabRating').addEventListener('click', () => {
    currentLbTab = 'rating';
    document.getElementById('tabRating').classList.add('active');
    document.getElementById('tabVisits').classList.remove('active');
    renderLeaderboard();
  });

  // Password toggles
  document.addEventListener('click', e => {
    const btn = e.target.closest('.toggle-pw');
    if (!btn) return;
    const input = document.getElementById(btn.dataset.target);
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
    btn.textContent = input.type === 'password' ? '👁' : '🙈';
  });

  // Student Signup
  document.getElementById('studentSignupForm').addEventListener('submit', handleStudentSignup);

  // Student Login
  document.getElementById('studentLoginForm').addEventListener('submit', handleStudentLogin);

  // Club Login
  document.getElementById('clubLoginForm').addEventListener('submit', handleClubLogin);

  // Check-in form
  document.getElementById('checkinForm').addEventListener('submit', handleCheckin);

  // Club ID live preview
  document.getElementById('clubIdInput').addEventListener('input', e => {
    const val = e.target.value.trim().toUpperCase();
    const preview = document.getElementById('clubPreview');
    if (val.length >= 4) {
      const club = DB.getClubById(val);
      if (club) {
        preview.innerHTML = `${club.icon} <strong>${club.name}</strong> — ${club.category} (${club.stall})`;
        preview.classList.remove('hidden');
      } else {
        preview.innerHTML = `❌ Club not found`;
        preview.classList.remove('hidden');
      }
    } else {
      preview.classList.add('hidden');
    }
  });

  // Star rating
  const stars = document.querySelectorAll('.star');
  stars.forEach(star => {
    star.addEventListener('mouseenter', () => {
      const val = parseInt(star.dataset.val);
      stars.forEach(s => s.classList.toggle('active', parseInt(s.dataset.val) <= val));
    });
    star.addEventListener('mouseleave', () => {
      stars.forEach(s => s.classList.toggle('active', parseInt(s.dataset.val) <= selectedRating));
    });
    star.addEventListener('click', () => {
      selectedRating = parseInt(star.dataset.val);
      document.getElementById('ratingValue').value = selectedRating;
      stars.forEach(s => s.classList.toggle('active', parseInt(s.dataset.val) <= selectedRating));
      const labels = ['', 'Poor 😞', 'Fair 😐', 'Good 🙂', 'Great 😄', 'Excellent 🤩'];
      document.getElementById('ratingLabel').textContent = labels[selectedRating];
    });
  });

  // Student search
  document.getElementById('studentSearch').addEventListener('input', () => {
    if (currentSession?.type !== 'club') return;
    const stats = DB.getClubStats(currentSession.id);
    const students = DB.getStudents();
    renderStudentsTable(stats.checkins, students);
  });
}

// ─── AUTH HANDLERS ──────────────────────────────────────────────────────────
async function handleStudentSignup(e) {
  e.preventDefault();
  const errEl = document.getElementById('signupError');
  const sucEl = document.getElementById('signupSuccess');
  errEl.classList.add('hidden');
  sucEl.classList.add('hidden');

  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const dept = document.getElementById('signupDept').value;
  const year = document.getElementById('signupYear').value;
  const password = document.getElementById('signupPassword').value;

  if (!name || !email || !dept || !year || !password) {
    return showFormError(errEl, 'Please fill in all fields.');
  }
  if (password.length < 6) return showFormError(errEl, 'Password must be at least 6 characters.');

  const result = DB.registerStudent(name, email, dept, year, password);
  if (result.error) return showFormError(errEl, result.error);

  sucEl.textContent = `✅ Account created! Your Student ID is: ${result.student.id}. Please save it!`;
  sucEl.classList.remove('hidden');
  showToast(`Welcome, ${name}! ID: ${result.student.id}`, 'success', '🎉');

  // Auto-login
  setTimeout(() => {
    currentSession = { type: 'student', id: result.student.id };
    DB.setSession(currentSession);
    updateNavForSession(currentSession);
    navigateTo('student-dashboard');
  }, 2000);
}

function handleStudentLogin(e) {
  e.preventDefault();
  const errEl = document.getElementById('loginError');
  errEl.classList.add('hidden');

  const emailOrId = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  const result = DB.authenticateStudent(emailOrId, password);
  if (result.error) return showFormError(errEl, result.error);

  currentSession = { type: 'student', id: result.student.id };
  DB.setSession(currentSession);
  updateNavForSession(currentSession);
  showToast(`Welcome back, ${result.student.name.split(' ')[0]}!`, 'success', '👋');
  navigateTo('student-dashboard');
}

function handleClubLogin(e) {
  e.preventDefault();
  const errEl = document.getElementById('clubLoginError');
  errEl.classList.add('hidden');

  const clubId = document.getElementById('clubLoginId').value.trim();
  const password = document.getElementById('clubLoginPassword').value;

  const result = DB.authenticateClub(clubId, password);
  if (result.error) return showFormError(errEl, result.error);

  currentSession = { type: 'club', id: result.club.id };
  DB.setSession(currentSession);
  updateNavForSession(currentSession);
  showToast(`Welcome, ${result.club.name}!`, 'success', '🏛️');
  navigateTo('club-dashboard');
}

function handleCheckin(e) {
  e.preventDefault();
  const errEl = document.getElementById('checkinError');
  const sucEl = document.getElementById('checkinSuccess');
  errEl.classList.add('hidden');
  sucEl.classList.add('hidden');

  if (!currentSession || currentSession.type !== 'student') {
    return showFormError(errEl, 'You must be logged in to check in.');
  }

  const clubId = document.getElementById('clubIdInput').value.trim().toUpperCase();
  const rating = parseInt(document.getElementById('ratingValue').value);
  const comment = document.getElementById('ratingComment').value.trim();

  if (!clubId) return showFormError(errEl, 'Please enter a Club ID.');
  if (!DB.getClubById(clubId)) return showFormError(errEl, 'Invalid Club ID. Check the stall display.');
  if (rating < 1 || rating > 5) return showFormError(errEl, 'Please select a rating (1–5 stars).');

  const result = DB.addCheckin(currentSession.id, clubId, rating, comment);
  if (result.error) return showFormError(errEl, result.error);

  const club = DB.getClubById(clubId);
  sucEl.textContent = `✅ Checked in to ${club.name}! Thanks for your ${rating}-star rating.`;
  sucEl.classList.remove('hidden');
  showToast(`Checked in to ${club.name}! 🎉`, 'success', '✅');

  // Reset form
  document.getElementById('clubIdInput').value = '';
  document.getElementById('ratingValue').value = 0;
  document.getElementById('ratingComment').value = '';
  document.getElementById('ratingLabel').textContent = 'Click to rate';
  document.getElementById('clubPreview').classList.add('hidden');
  selectedRating = 0;
  document.querySelectorAll('.star').forEach(s => s.classList.remove('active'));

  renderStudentDashboard();
}

// ─── UTILITIES ──────────────────────────────────────────────────────────────
function showFormError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}

function starsDisplay(rating) {
  const full = Math.round(rating);
  return '★'.repeat(Math.max(0, full)) + '☆'.repeat(Math.max(0, 5 - full));
}

function getRankClass(i) {
  return i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : 'rank-other';
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
}

function formatTimeShort(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

// ─── TOAST SYSTEM ───────────────────────────────────────────────────────────
function showToast(message, type = 'info', icon = 'ℹ️') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('out');
    toast.addEventListener('animationend', () => toast.remove());
  }, 3500);
}
