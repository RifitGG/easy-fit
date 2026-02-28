const MOON_PATH = 'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z';
const SUN_PATH = 'M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 6a6 6 0 100 12 6 6 0 000-12z';

function getStoredTheme() {
  return localStorage.getItem('fitapp_web_theme') || 'dark';
}

function applyTheme(theme) {
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  updateThemeIcon(theme);
}

function updateThemeIcon(theme) {
  var icon = document.getElementById('themeIcon');
  if (!icon) return;
  if (theme === 'light') {
    icon.innerHTML = '<circle cx=\"12\" cy=\"12\" r=\"5\" stroke=\"currentColor\" stroke-width=\"2\"/>' +
      '<line x1=\"12\" y1=\"1\" x2=\"12\" y2=\"3\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"/>' +
      '<line x1=\"12\" y1=\"21\" x2=\"12\" y2=\"23\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"/>' +
      '<line x1=\"4.22\" y1=\"4.22\" x2=\"5.64\" y2=\"5.64\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"/>' +
      '<line x1=\"18.36\" y1=\"18.36\" x2=\"19.78\" y2=\"19.78\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"/>' +
      '<line x1=\"1\" y1=\"12\" x2=\"3\" y2=\"12\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"/>' +
      '<line x1=\"21\" y1=\"12\" x2=\"23\" y2=\"12\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"/>' +
      '<line x1=\"4.22\" y1=\"19.78\" x2=\"5.64\" y2=\"18.36\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"/>' +
      '<line x1=\"18.36\" y1=\"5.64\" x2=\"19.78\" y2=\"4.22\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"/>';
  } else {
    icon.innerHTML = '<path d=\"M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>';
  }
}

function toggleTheme() {
  var current = getStoredTheme();
  var next = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem('fitapp_web_theme', next);
  applyTheme(next);
}

applyTheme(getStoredTheme());

const API_URL = 'http://89.111.171.11/api';

const MUSCLE_LABELS = {
  chest: 'Грудь', back: 'Спина', shoulders: 'Плечи', biceps: 'Бицепс',
  triceps: 'Трицепс', legs: 'Ноги', glutes: 'Ягодицы', abs: 'Пресс',
  forearms: 'Предплечья', calves: 'Икры'
};
const EQUIPMENT_LABELS = {
  barbell: 'Штанга', dumbbell: 'Гантели', cable: 'Тросовый',
  machine: 'Тренажёр', bodyweight: 'Своё тело', kettlebell: 'Гиря', bands: 'Резинки'
};
const DIFFICULTY_LABELS = {
  beginner: 'Начинающий', intermediate: 'Средний', advanced: 'Продвинутый'
};

var AVATAR_SVG = {
  avatar_muscle:    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 12h1l2-4 2 8 2-6 2 4 2-2h7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  avatar_fire:      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2c.5 4-2 6-2 10 0 3 2 5 4 5s4-2 4-5c0-6-6-10-6-10z" stroke="currentColor" stroke-width="1.5"/></svg>',
  avatar_star:      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  avatar_lightning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  avatar_rocket:    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11.95A22 22 0 0112 15z" stroke="currentColor" stroke-width="1.5"/></svg>',
  avatar_trophy:    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 3h12v6a6 6 0 01-12 0V3zM12 15v3M8 21h8M10 18h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  avatar_heart:     '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" stroke="currentColor" stroke-width="1.5"/></svg>',
  avatar_ninja:     '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/><path d="M2 12h20" stroke="currentColor" stroke-width="1.5"/><circle cx="9" cy="12" r="1.5" fill="currentColor"/><circle cx="15" cy="12" r="1.5" fill="currentColor"/></svg>',
  avatar_warrior:   '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6.5 6.5L17.5 17.5M4 9l5-5M15 20l5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  avatar_mountain:  '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M8 3l4 8 5-5 5 16H2L8 3z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  avatar_diamond:   '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M2.7 10.3l8.6 10.8a1 1 0 001.4 0l8.6-10.8a1 1 0 00.1-1.1L18.4 3.1a1 1 0 00-.9-.5H6.5a1 1 0 00-.9.5L2.6 9.2a1 1 0 00.1 1.1z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  avatar_crown:     '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M2 20h20l-2-12-4 4-4-8-4 8-4-4-2 12z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>'
};
var DEFAULT_AVATAR_SVG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="1.5"/></svg>';

let exercises = [];
let selectedMuscle = null;
let selectedExercise = null;
let builtExercises = [];
let currentUser = null;
let demoState = null;
let demoTimerInterval = null;

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('fitapp_token');
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(API_URL + path, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка');
  return data;
}

async function loadExercises(retries) {
  if (retries === undefined) retries = 2;
  try {
    exercises = await apiFetch('/exercises');
  } catch {
    if (retries > 0) {
      await new Promise(function(r) { setTimeout(r, 1500); });
      return loadExercises(retries - 1);
    }
    exercises = [];
  }
  const statEl = document.querySelector('.stat-value-exercises');
  if (statEl) statEl.textContent = (exercises.length || 100) + '+';
}

async function checkAuth() {
  const token = localStorage.getItem('fitapp_token');
  if (!token) { currentUser = null; updateNavAuth(); return; }
  try {
    var meData = await apiFetch('/auth/me');
    currentUser = meData.user || meData;
    updateNavAuth();
  } catch {
    localStorage.removeItem('fitapp_token');
    currentUser = null;
    updateNavAuth();
  }
}

function updateNavAuth() {
  var container = document.getElementById('navAuth');
  var dashLink = document.getElementById('navDashLink');
  if (!container) return;
  if (currentUser) {
    var avatarContent;
    if (currentUser.avatar_url && (currentUser.avatar_url.startsWith('/uploads/') || currentUser.avatar_url.startsWith('http'))) {
      avatarContent = '<img src="' + API_URL.replace('/api', '') + currentUser.avatar_url + '" alt="" style="width:24px;height:24px;border-radius:50%;object-fit:cover;"/>';
    } else {
      avatarContent = AVATAR_SVG[currentUser.avatar_url] || DEFAULT_AVATAR_SVG;
    }
    container.innerHTML =
      '<div class="nav-user" onclick="toggleUserMenu()">' +
        '<div class="nav-user-avatar" style="display:flex;align-items:center;justify-content:center;color:var(--tint);">' + avatarContent + '</div>' +
        '<span class="nav-user-name">' + currentUser.name + '</span>' +
      '</div>' +
      '<div class="nav-user-menu" id="userMenu" style="display:none;">' +
        '<div class="nav-menu-item">' + currentUser.email + '</div>' +
        '<a href="profile.html" class="nav-menu-item" style="text-decoration:none;color:var(--text);display:flex;align-items:center;gap:8px;">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 20V10M12 20V4M6 20V14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Личный кабинет</a>' +
        '<div class="nav-menu-item nav-menu-logout" onclick="handleLogout()" style="display:flex;align-items:center;gap:8px;">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Выйти</div>' +
      '</div>';
    if (dashLink) dashLink.style.display = '';
  } else {
    container.innerHTML = '<button class="nav-auth-btn" onclick="showAuthModal()">Войти</button>';
    if (dashLink) dashLink.style.display = 'none';
  }
}

function toggleUserMenu() {
  const menu = document.getElementById('userMenu');
  if (menu) menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

function handleLogout() {
  localStorage.removeItem('fitapp_token');
  currentUser = null;
  updateNavAuth();
}

function showAuthModal(mode) {
  const m = document.getElementById('authModal');
  if (!m) return;
  m.style.display = 'flex';
  m.dataset.mode = mode || 'login';
  renderAuthModal();
}

function hideAuthModal() {
  const m = document.getElementById('authModal');
  if (m) m.style.display = 'none';
}

function renderAuthModal() {
  const m = document.getElementById('authModal');
  const isReg = m.dataset.mode === 'register';
  const content = document.getElementById('authModalContent');
  content.innerHTML =
    '<div class="auth-modal-card glass elevated">' +
      '<button class="auth-close" onclick="hideAuthModal()">&times;</button>' +
      '<h3>' + (isReg ? 'Регистрация' : 'Вход') + '</h3>' +
      '<p class="auth-desc">' + (isReg ? 'Создайте аккаунт для сохранения данных' : 'Войдите в личный кабинет') + '</p>' +
      (isReg ? '<input type="text" id="authName" class="auth-input" placeholder="Ваше имя" />' : '') +
      '<input type="email" id="authEmail" class="auth-input" placeholder="Email" />' +
      '<input type="password" id="authPwd" class="auth-input" placeholder="Пароль" />' +
      '<div id="authError" class="auth-error"></div>' +
      '<button class="auth-submit" onclick="handleAuthSubmit()">' + (isReg ? 'Зарегистрироваться' : 'Войти') + '</button>' +
      '<div class="auth-switch" onclick="switchAuthMode()">' +
        (isReg ? 'Уже есть аккаунт? <b>Войти</b>' : 'Нет аккаунта? <b>Зарегистрироваться</b>') +
      '</div>' +
    '</div>';
}

function switchAuthMode() {
  const m = document.getElementById('authModal');
  m.dataset.mode = m.dataset.mode === 'register' ? 'login' : 'register';
  renderAuthModal();
}

async function handleAuthSubmit() {
  const m = document.getElementById('authModal');
  const isReg = m.dataset.mode === 'register';
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPwd').value;
  const errEl = document.getElementById('authError');
  errEl.textContent = '';

  try {
    if (isReg) {
      const name = document.getElementById('authName').value.trim();
      if (!name) { errEl.textContent = 'Введите имя'; return; }
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name })
      });
      localStorage.setItem('fitapp_token', data.token);
      currentUser = data.user;
    } else {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      localStorage.setItem('fitapp_token', data.token);
      currentUser = data.user;
    }
    updateNavAuth();
    hideAuthModal();
  } catch (err) {
    errEl.textContent = err.message;
  }
}

async function init() {
  await loadExercises();
  await checkAuth();
  renderMuscleFilters();
  renderExerciseList();
  renderBuilderList();
}

function switchDemoTab(tab) {
  document.querySelectorAll('.demo-tab').forEach(function(t) { t.classList.remove('active'); });
  var el = document.querySelector('.demo-tab[data-tab="' + tab + '"]');
  if (el) el.classList.add('active');
  document.getElementById('tab-catalog').style.display = tab === 'catalog' ? 'block' : 'none';
  var builder = document.getElementById('tab-builder');
  if (tab === 'builder') {
    builder.style.display = 'block';
    builder.classList.add('visible');
  } else {
    builder.style.display = 'none';
    builder.classList.remove('visible');
  }
}

function renderMuscleFilters() {
  var container = document.getElementById('muscleFilters');
  container.innerHTML = '';
  var allChip = document.createElement('button');
  allChip.className = 'filter-chip' + (selectedMuscle === null ? ' active' : '');
  allChip.textContent = 'Все';
  allChip.onclick = function() { selectedMuscle = null; renderMuscleFilters(); filterExercises(); };
  container.appendChild(allChip);
  Object.entries(MUSCLE_LABELS).forEach(function(pair) {
    var key = pair[0], label = pair[1];
    var chip = document.createElement('button');
    chip.className = 'filter-chip' + (selectedMuscle === key ? ' active' : '');
    chip.textContent = label;
    chip.onclick = function() {
      selectedMuscle = selectedMuscle === key ? null : key;
      renderMuscleFilters();
      filterExercises();
    };
    container.appendChild(chip);
  });
}

function filterExercises() {
  var search = document.getElementById('exerciseSearch').value.toLowerCase();
  var filtered = exercises.filter(function(ex) {
    var matchSearch = !search || ex.name.toLowerCase().includes(search) || ex.description.toLowerCase().includes(search);
    var matchMuscle = !selectedMuscle || ex.muscleGroups.includes(selectedMuscle);
    return matchSearch && matchMuscle;
  });
  renderExerciseList(filtered);
}

function renderExerciseList(list) {
  if (!list) list = exercises;
  var container = document.getElementById('exerciseList');
  container.innerHTML = '';
  if (list.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:40px 0;color:var(--text-secondary);">Упражнения не найдены</div>';
    return;
  }
  list.forEach(function(ex) {
    var item = document.createElement('div');
    item.className = 'glass exercise-item' + (selectedExercise === ex.id ? ' selected' : '');
    item.onclick = function() { selectExercise(ex.id); };
    var muscleLabels = ex.muscleGroups.map(function(mg) { return '<span class="exercise-badge badge-muscle">' + MUSCLE_LABELS[mg] + '</span>'; }).join('');
    var diffClass = 'badge-difficulty-' + ex.difficulty;
    item.innerHTML =
      '<div class="exercise-header"><div class="exercise-name">' + ex.name + '</div>' +
      '<span class="exercise-badge ' + diffClass + '">' + DIFFICULTY_LABELS[ex.difficulty] + '</span></div>' +
      '<div class="exercise-badges" style="margin-bottom:8px;">' + muscleLabels +
      '<span class="exercise-badge badge-equipment">' + EQUIPMENT_LABELS[ex.equipment] + '</span></div>' +
      '<div class="exercise-desc">' + ex.description + '</div>';
    container.appendChild(item);
  });
}

async function selectExercise(id) {
  selectedExercise = id;
  renderExerciseList(getFilteredList());
  var detail = document.getElementById('exerciseDetail');
  detail.classList.add('visible');
  var ex = exercises.find(function(e) { return e.id === id; });
  if (!ex) return;

  var steps = ex.steps || [];
  if (steps.length === 0) {
    try {
      var full = await apiFetch('/exercises/' + id);
      if (full.steps) { ex.steps = full.steps; steps = full.steps; }
    } catch {}
  }

  var muscleLabels = ex.muscleGroups.map(function(mg) { return '<span class="exercise-badge badge-muscle">' + MUSCLE_LABELS[mg] + '</span>'; }).join('');
  var diffClass = 'badge-difficulty-' + ex.difficulty;
  var stepsHtml = steps.map(function(step, i) {
    return '<div class="step-item"><div class="step-number">' + (i + 1) + '</div><div class="step-text">' + step + '</div></div>';
  }).join('');

  document.getElementById('exerciseDetailContent').innerHTML =
    '<div class="exercise-detail-title">' + ex.name + '</div>' +
    '<div class="exercise-detail-desc">' + ex.description + '</div>' +
    '<div class="exercise-detail-meta">' + muscleLabels +
    '<span class="exercise-badge badge-equipment">' + EQUIPMENT_LABELS[ex.equipment] + '</span>' +
    '<span class="exercise-badge ' + diffClass + '">' + DIFFICULTY_LABELS[ex.difficulty] + '</span></div>' +
    '<div class="exercise-steps"><h4>Как выполнять:</h4>' + stepsHtml + '</div>';
}

function getFilteredList() {
  var search = document.getElementById('exerciseSearch').value.toLowerCase();
  return exercises.filter(function(ex) {
    var matchSearch = !search || ex.name.toLowerCase().includes(search) || ex.description.toLowerCase().includes(search);
    var matchMuscle = !selectedMuscle || ex.muscleGroups.includes(selectedMuscle);
    return matchSearch && matchMuscle;
  });
}

function renderBuilderList() {
  var container = document.getElementById('builderExerciseList');
  container.innerHTML = '';
  exercises.forEach(function(ex) {
    var isAdded = builtExercises.includes(ex.id);
    var item = document.createElement('div');
    item.className = 'workout-exercise-add' + (isAdded ? ' added' : '');
    item.onclick = function() { toggleBuilderExercise(ex.id); };
    item.innerHTML = '<span class="name">' + ex.name + '</span><span class="add-icon">' + (isAdded ? '' : '+') + '</span>';
    container.appendChild(item);
  });
}

function toggleBuilderExercise(id) {
  if (builtExercises.includes(id)) {
    builtExercises = builtExercises.filter(function(e) { return e !== id; });
  } else {
    builtExercises.push(id);
  }
  renderBuilderList();
  renderBuiltWorkout();
  selectExercise(id);
}

function removeBuiltExercise(id) {
  builtExercises = builtExercises.filter(function(e) { return e !== id; });
  renderBuilderList();
  renderBuiltWorkout();
}

function renderBuiltWorkout() {
  var container = document.getElementById('builtWorkout');
  var listEl = document.getElementById('builtExercisesList');
  var summaryEl = document.getElementById('workoutSummary');
  if (builtExercises.length === 0) { container.style.display = 'none'; return; }
  container.style.display = 'block';
  listEl.innerHTML = '';
  builtExercises.forEach(function(id) {
    var ex = exercises.find(function(e) { return e.id === id; });
    if (!ex) return;
    var el = document.createElement('div');
    el.className = 'built-exercise';
    el.innerHTML = '<span class="name">' + ex.name + '</span>' +
      '<button class="remove-btn" onclick="event.stopPropagation();removeBuiltExercise(\'' + id + '\')"></button>';
    listEl.appendChild(el);
  });
  var sets = builtExercises.length * 3;
  var muscles = [];
  builtExercises.forEach(function(id) {
    var ex = exercises.find(function(e) { return e.id === id; });
    if (ex) ex.muscleGroups.forEach(function(mg) { if (!muscles.includes(mg)) muscles.push(mg); });
  });
  summaryEl.innerHTML =
    '<div class="row"><span class="label">Упражнений:</span><span class="value">' + builtExercises.length + '</span></div>' +
    '<div class="row"><span class="label">Примерно подходов:</span><span class="value">' + sets + '</span></div>' +
    '<div class="row"><span class="label">Групп мышц:</span><span class="value">' + muscles.map(function(m) { return MUSCLE_LABELS[m]; }).join(', ') + '</span></div>' +
    '<button class="demo-start-btn" onclick="startDemoWorkout()"> Начать демо тренировку</button>';
}

function startDemoWorkout() {
  if (builtExercises.length === 0) return;
  var exList = builtExercises.map(function(id) {
    return exercises.find(function(e) { return e.id === id; });
  }).filter(Boolean);

  demoState = {
    exercises: exList,
    currentEx: 0,
    currentSet: 0,
    setsPerExercise: 3,
    repsPerSet: 10,
    restSeconds: 60,
    phase: 'exercise',
    restTime: 0,
    completedSets: 0,
    totalSets: exList.length * 3,
    startTime: Date.now()
  };

  var runner = document.getElementById('demoRunner');
  runner.style.display = 'flex';
  renderDemoRunner();
}

function renderDemoRunner() {
  var runner = document.getElementById('demoRunnerContent');
  var s = demoState;
  if (!s) return;
  var progress = s.totalSets > 0 ? (s.completedSets / s.totalSets) * 100 : 0;
  var ex = s.exercises[s.currentEx];

  if (s.phase === 'done') {
    var elapsed = Math.round((Date.now() - s.startTime) / 60000);
    runner.innerHTML =
      '<div class="demo-done">' +
        '<div class="demo-done-icon"></div>' +
        '<h3>Тренировка завершена!</h3>' +
        '<div class="demo-done-stats">' +
          '<div class="demo-done-stat"><div class="val">' + Math.max(1, elapsed) + '</div><div class="lbl">мин</div></div>' +
          '<div class="demo-done-stat"><div class="val">' + s.completedSets + '</div><div class="lbl">подходов</div></div>' +
          '<div class="demo-done-stat"><div class="val">' + (s.completedSets * s.repsPerSet) + '</div><div class="lbl">повторов</div></div>' +
        '</div>' +
        (currentUser
          ? '<button class="demo-finish-btn" onclick="closeDemoRunner()">Готово</button>'
          : '<p class="demo-register-hint">Зарегистрируйтесь, чтобы сохранять результаты тренировок</p>' +
            '<button class="demo-register-btn" onclick="closeDemoRunner();showAuthModal(\'register\')">Создать аккаунт</button>' +
            '<button class="demo-finish-btn secondary" onclick="closeDemoRunner()">Пропустить</button>') +
      '</div>';
    return;
  }

  if (s.phase === 'rest') {
    runner.innerHTML =
      '<div class="demo-progress-bar"><div class="demo-progress-fill" style="width:' + progress + '%"></div></div>' +
      '<div class="demo-rest">' +
        '<div class="demo-rest-label">Отдых</div>' +
        '<div class="demo-rest-timer">' + formatTime(s.restTime) + '</div>' +
        '<div class="demo-rest-next">Далее: ' + ex.name + '  подход ' + (s.currentSet + 1) + ' из ' + s.setsPerExercise + '</div>' +
        '<button class="demo-skip-btn" onclick="skipRest()">Пропустить отдых</button>' +
      '</div>';
    return;
  }

  var steps = (ex.steps || []).map(function(step, i) {
    return '<div class="demo-step"><span class="demo-step-num">' + (i + 1) + '</span>' + step + '</div>';
  }).join('');

  runner.innerHTML =
    '<div class="demo-progress-bar"><div class="demo-progress-fill" style="width:' + progress + '%"></div></div>' +
    '<button class="demo-quit" onclick="quitDemo()"></button>' +
    '<div class="demo-exercise-info">' +
      '<div class="demo-ex-counter">Упражнение ' + (s.currentEx + 1) + ' из ' + s.exercises.length + '</div>' +
      '<div class="demo-ex-name">' + ex.name + '</div>' +
      '<div class="demo-set-info">Подход ' + (s.currentSet + 1) + ' из ' + s.setsPerExercise + '  ' + s.repsPerSet + ' повт.</div>' +
      '<div class="demo-steps">' + steps + '</div>' +
      '<div class="demo-set-dots">' + renderSetDots(s) + '</div>' +
      '<button class="demo-complete-btn" onclick="completeSet()">Выполнено </button>' +
      '<button class="demo-skip-set-btn" onclick="skipSet()">Пропустить</button>' +
    '</div>';
}

function renderSetDots(s) {
  var dots = '';
  for (var i = 0; i < s.setsPerExercise; i++) {
    var cls = 'demo-dot';
    if (i < s.currentSet) cls += ' done';
    else if (i === s.currentSet) cls += ' current';
    dots += '<span class="' + cls + '"></span>';
  }
  return dots;
}

function completeSet() {
  var s = demoState;
  s.completedSets++;
  s.currentSet++;
  if (s.currentSet >= s.setsPerExercise) {
    s.currentEx++;
    s.currentSet = 0;
    if (s.currentEx >= s.exercises.length) {
      s.phase = 'done';
      renderDemoRunner();
      return;
    }
  }
  s.phase = 'rest';
  s.restTime = s.restSeconds;
  startRestTimer();
  renderDemoRunner();
}

function skipSet() {
  var s = demoState;
  s.currentSet++;
  if (s.currentSet >= s.setsPerExercise) {
    s.currentEx++;
    s.currentSet = 0;
    if (s.currentEx >= s.exercises.length) {
      s.phase = 'done';
      renderDemoRunner();
      return;
    }
  }
  renderDemoRunner();
}

function startRestTimer() {
  clearInterval(demoTimerInterval);
  demoTimerInterval = setInterval(function() {
    var s = demoState;
    if (!s || s.phase !== 'rest') { clearInterval(demoTimerInterval); return; }
    s.restTime--;
    if (s.restTime <= 0) {
      clearInterval(demoTimerInterval);
      s.phase = 'exercise';
    }
    renderDemoRunner();
  }, 1000);
}

function skipRest() {
  clearInterval(demoTimerInterval);
  demoState.restTime = 0;
  demoState.phase = 'exercise';
  renderDemoRunner();
}

function quitDemo() {
  clearInterval(demoTimerInterval);
  demoState = null;
  document.getElementById('demoRunner').style.display = 'none';
}

function closeDemoRunner() {
  clearInterval(demoTimerInterval);
  demoState = null;
  document.getElementById('demoRunner').style.display = 'none';
}

function formatTime(sec) {
  var m = Math.floor(sec / 60);
  var ss = sec % 60;
  return m + ':' + (ss < 10 ? '0' : '') + ss;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function initAnimations() {
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right').forEach(function(el) {
    observer.observe(el);
  });
}

document.addEventListener('DOMContentLoaded', function() {
  init();
  initAnimations();
  document.addEventListener('click', function(e) {
    var menu = document.getElementById('userMenu');
    if (menu && !e.target.closest('.nav-user') && !e.target.closest('.nav-user-menu')) {
      menu.style.display = 'none';
    }
  });
});