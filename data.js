/**
 * APEX 2026 — Data Layer
 * Manages all localStorage data, authentication, and business logic
 */

const STORAGE_KEYS = {
  STUDENTS: 'apex2026_students',
  CLUBS: 'apex2026_clubs',
  CHECKINS: 'apex2026_checkins',
  SESSION: 'apex2026_session',
};

// ─── Initial Club Data ─────────────────────────────────────────────────────
const INITIAL_CLUBS = [
  { id: 'CLUB-001', name: 'TechNova',        password: 'tech001',   icon: '💻', category: 'Technology & AI', stall: 'Hall A - Stall 1' },
  { id: 'CLUB-002', name: 'CodeCraft',        password: 'code002',   icon: '⚙️', category: 'Programming',    stall: 'Hall A - Stall 2' },
  { id: 'CLUB-003', name: 'RoboZone',         password: 'robo003',   icon: '🤖', category: 'Robotics',        stall: 'Hall B - Stall 1' },
  { id: 'CLUB-004', name: 'DesignHub',        password: 'design004', icon: '🎨', category: 'UI/UX Design',    stall: 'Hall B - Stall 2' },
  { id: 'CLUB-005', name: 'CyberShield',      password: 'cyber005',  icon: '🛡️', category: 'Cybersecurity',   stall: 'Hall C - Stall 1' },
  { id: 'CLUB-006', name: 'DataVault',        password: 'data006',   icon: '📊', category: 'Data Science',    stall: 'Hall C - Stall 2' },
  { id: 'CLUB-007', name: 'CloudNine',        password: 'cloud007',  icon: '☁️', category: 'Cloud & DevOps',  stall: 'Hall D - Stall 1' },
  { id: 'CLUB-008', name: 'GreenTech',        password: 'green008',  icon: '🌱', category: 'Sustainability',  stall: 'Hall D - Stall 2' },
  { id: 'CLUB-009', name: 'MakerSpace',       password: 'maker009',  icon: '🔧', category: 'Hardware Hacks',  stall: 'Hall E - Stall 1' },
  { id: 'CLUB-010', name: 'BizPilot',         password: 'biz010',    icon: '🚀', category: 'Entrepreneurship',stall: 'Hall E - Stall 2' },
  { id: 'CLUB-011', name: 'GameForge',        password: 'game011',   icon: '🎮', category: 'Game Dev',         stall: 'Hall F - Stall 1' },
  { id: 'CLUB-012', name: 'PhotonLab',        password: 'photo012',  icon: '📷', category: 'Photography',     stall: 'Hall F - Stall 2' },
];

// ─── Simple Hash (not cryptographic, client-side demo) ────────────────────
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

// ─── ID Generator ─────────────────────────────────────────────────────────
function generateStudentId() {
  const students = DB.getStudents();
  const num = String(students.length + 1).padStart(4, '0');
  return `STUD-${num}`;
}

// ─── Database Layer ────────────────────────────────────────────────────────
const DB = {
  // ── Clubs ──
  getClubs() {
    const stored = localStorage.getItem(STORAGE_KEYS.CLUBS);
    if (!stored) {
      const clubs = INITIAL_CLUBS.map(c => ({ ...c, passwordHash: simpleHash(c.password) }));
      localStorage.setItem(STORAGE_KEYS.CLUBS, JSON.stringify(clubs));
      return clubs;
    }
    return JSON.parse(stored);
  },

  getClubById(id) {
    return this.getClubs().find(c => c.id === id.toUpperCase());
  },

  // ── Students ──
  getStudents() {
    const stored = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    return stored ? JSON.parse(stored) : [];
  },

  saveStudents(students) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  },

  getStudentById(id) {
    return this.getStudents().find(s => s.id === id);
  },

  getStudentByEmail(email) {
    return this.getStudents().find(s => s.email.toLowerCase() === email.toLowerCase());
  },

  registerStudent(name, email, dept, year, password) {
    const students = this.getStudents();
    if (this.getStudentByEmail(email)) return { error: 'An account with this email already exists.' };
    const student = {
      id: generateStudentId(),
      name,
      email: email.toLowerCase(),
      dept,
      year,
      passwordHash: simpleHash(password),
      createdAt: new Date().toISOString(),
    };
    students.push(student);
    this.saveStudents(students);
    return { student };
  },

  authenticateStudent(emailOrId, password) {
    const students = this.getStudents();
    const passwordHash = simpleHash(password);
    const student = students.find(s =>
      (s.email.toLowerCase() === emailOrId.toLowerCase() || s.id.toLowerCase() === emailOrId.toLowerCase())
      && s.passwordHash === passwordHash
    );
    if (!student) return { error: 'Invalid credentials. Please check your email/ID and password.' };
    return { student };
  },

  // ── Clubs Auth ──
  authenticateClub(clubId, password) {
    const club = this.getClubById(clubId);
    if (!club) return { error: 'Club ID not found. Please check the ID displayed at the stall.' };
    if (club.passwordHash !== simpleHash(password)) return { error: 'Incorrect password. Please contact the club team.' };
    return { club };
  },

  // ── Check-ins ──
  getCheckins() {
    const stored = localStorage.getItem(STORAGE_KEYS.CHECKINS);
    return stored ? JSON.parse(stored) : [];
  },

  saveCheckins(checkins) {
    localStorage.setItem(STORAGE_KEYS.CHECKINS, JSON.stringify(checkins));
    window.dispatchEvent(new Event('apex-data-update'));
  },

  addCheckin(studentId, clubId, rating, comment) {
    const checkins = this.getCheckins();
    // Check duplicate
    const already = checkins.find(c => c.studentId === studentId && c.clubId === clubId);
    if (already) return { error: 'You have already checked in and rated this club stall.' };
    const checkin = {
      id: `CHK-${Date.now()}`,
      studentId,
      clubId,
      rating: parseInt(rating),
      comment: comment || '',
      timestamp: new Date().toISOString(),
    };
    checkins.push(checkin);
    this.saveCheckins(checkins);
    return { checkin };
  },

  getCheckinsByClub(clubId) {
    return this.getCheckins().filter(c => c.clubId === clubId);
  },

  getCheckinsByStudent(studentId) {
    return this.getCheckins().filter(c => c.studentId === studentId);
  },

  // ── Session ──
  getSession() {
    const stored = sessionStorage.getItem(STORAGE_KEYS.SESSION);
    return stored ? JSON.parse(stored) : null;
  },

  setSession(session) {
    sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  },

  clearSession() {
    sessionStorage.removeItem(STORAGE_KEYS.SESSION);
  },

  // ── Stats ──
  getClubStats(clubId) {
    const checkins = this.getCheckinsByClub(clubId);
    const today = new Date().toDateString();
    const todayCheckins = checkins.filter(c => new Date(c.timestamp).toDateString() === today);
    const totalRating = checkins.reduce((sum, c) => sum + c.rating, 0);
    const avgRating = checkins.length > 0 ? (totalRating / checkins.length).toFixed(1) : '0.0';
    const ratingDist = [5, 4, 3, 2, 1].map(r => ({
      stars: r,
      count: checkins.filter(c => c.rating === r).length,
    }));
    return {
      total: checkins.length,
      todayCount: todayCheckins.length,
      avgRating,
      totalComments: checkins.filter(c => c.comment && c.comment.trim()).length,
      ratingDist,
      checkins,
    };
  },

  getAllClubsSorted(sortBy = 'visits') {
    const clubs = this.getClubs();
    return clubs.map(club => {
      const stats = this.getClubStats(club.id);
      return { ...club, ...stats };
    }).sort((a, b) => {
      if (sortBy === 'rating') return parseFloat(b.avgRating) - parseFloat(a.avgRating) || b.total - a.total;
      return b.total - a.total || parseFloat(b.avgRating) - parseFloat(a.avgRating);
    });
  },

  getGlobalStats() {
    const checkins = this.getCheckins();
    const students = this.getStudents();
    const clubs = this.getClubs();
    const totalRating = checkins.reduce((sum, c) => sum + c.rating, 0);
    const avgRating = checkins.length > 0 ? (totalRating / checkins.length).toFixed(1) : '0.0';
    const uniqueStudentIds = new Set(checkins.map(c => c.studentId));
    return {
      totalCheckins: uniqueStudentIds.size,
      totalClubs: clubs.length,
      totalRatings: checkins.length,
      avgRating,
    };
  },
};

// Initialize clubs on load
DB.getClubs();
