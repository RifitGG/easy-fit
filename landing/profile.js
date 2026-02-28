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

var API_URL = 'http://89.111.171.11/api';

var DIFFICULTY_LABELS = {
  beginner: 'Начинающий', intermediate: 'Средний', advanced: 'Продвинутый'
};

var GOAL_LABELS = {
  lose_weight: 'Похудеть', gain_muscle: 'Набрать массу', maintain: 'Поддержать форму',
  endurance: 'Выносливость', flexibility: 'Гибкость'
};

function isImageUrl(url) {
  return url && (url.startsWith('/uploads/') || url.startsWith('http'));
}

function getInitialLetter(name) {
  return (name || '?').charAt(0).toUpperCase();
}

function getAvatarHtml(avatarUrl, size, name) {
  if (!size) size = 36;
  if (isImageUrl(avatarUrl)) {
    return '<img src="' + API_URL.replace('/api', '') + avatarUrl + '" alt="avatar" style="width:' + size + 'px;height:' + size + 'px;border-radius:50%;object-fit:cover;"/>';
  }
  return '<span style="display:inline-flex;align-items:center;justify-content:center;width:' + size + 'px;height:' + size + 'px;border-radius:50%;background:var(--tint-light);color:var(--tint);font-weight:800;font-size:' + Math.round(size * 0.45) + 'px;">' + getInitialLetter(name) + '</span>';
}

var currentUser = null;
var communitySort = 'recent';
var communityItems = [];
var publishWorkoutId = null;
var publishDifficulty = 'intermediate';
var myPublishedIds = [];


function apiFetch(path, options) {
  if (!options) options = {};
  var token = localStorage.getItem('fitapp_token');
  var headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
  if (token) headers['Authorization'] = 'Bearer ' + token;
  return fetch(API_URL + path, Object.assign({}, options, { headers: headers }))
    .then(function(resp) {
      if (!resp.ok) {
        return resp.json().catch(function() { return {}; }).then(function(err) {
          throw new Error(err.error || 'Ошибка сервера');
        });
      }
      return resp.json();
    });
}


function switchTab(tab) {
  document.querySelectorAll('.profile-tab').forEach(function(t) {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  document.querySelectorAll('.tab-content').forEach(function(c) {
    c.style.display = c.id === 'tab-' + tab ? '' : 'none';
  });
  if (tab === 'community' && communityItems.length === 0) loadCommunity();
  if (tab === 'settings') populateSettings();
  if (tab === 'progress') initAnimations();
}



function checkAuth() {
  var token = localStorage.getItem('fitapp_token');
  if (!token) { window.location.href = 'index.html'; return; }
  return apiFetch('/auth/me').then(function(data) {
    currentUser = data.user || data;
    updateProfileHeader();
    updateNavAuth();
    loadDashboard();
    loadCommunity();
  }).catch(function() {
    localStorage.removeItem('fitapp_token');
    window.location.href = 'index.html';
  });
}

function updateProfileHeader() {
  if (!currentUser) return;
  var avatarEl = document.getElementById('profileAvatar');
  var nameEl = document.getElementById('profileName');
  var emailEl = document.getElementById('profileEmail');
  if (nameEl) nameEl.textContent = currentUser.name || 'Пользователь';
  if (emailEl) emailEl.textContent = currentUser.email || '';
  if (avatarEl) {
    if (isImageUrl(currentUser.avatar_url)) {
      avatarEl.innerHTML = '<img src="' + API_URL.replace('/api', '') + currentUser.avatar_url + '" alt="avatar" class="profile-avatar-img"/>' +
        '<div class="profile-avatar-overlay"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="13" r="4" stroke="#fff" stroke-width="2"/></svg></div>';
    } else {
      avatarEl.innerHTML = '<span class="profile-avatar-initial">' + getInitialLetter(currentUser.name) + '</span>' +
        '<div class="profile-avatar-overlay"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="13" r="4" stroke="#fff" stroke-width="2"/></svg></div>';
    }
  }
  updateAvatarUploadPreview();
  renderBMI();
}

function updateNavAuth() {
  var container = document.getElementById('navAuth');
  if (!container || !currentUser) return;
  container.innerHTML =
    '<div class="nav-user" onclick="toggleUserMenu()" style="cursor:pointer;display:flex;align-items:center;gap:8px;">' +
      '<span class="nav-user-avatar-icon">' + getAvatarHtml(currentUser.avatar_url, 28, currentUser.name) + '</span>' +
      '<span style="font-weight:600;font-size:14px;">' + escapeHtml(currentUser.name || '') + '</span>' +
    '</div>' +
    '<div class="nav-user-menu glass elevated" id="userMenu" style="display:none;position:absolute;right:0;top:56px;padding:8px 0;border-radius:12px;min-width:180px;z-index:100;">' +
      '<a href="index.html" style="display:flex;align-items:center;gap:8px;padding:10px 20px;color:var(--text);text-decoration:none;font-size:14px;">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="9,22 9,12 15,12 15,22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
        'Главная</a>' +
      '<div style="border-top:1px solid var(--divider);margin:4px 0;"></div>' +
      '<a href="#" onclick="handleLogout();return false;" style="display:flex;align-items:center;gap:8px;padding:10px 20px;color:#F87171;text-decoration:none;font-size:14px;">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        'Выйти</a>' +
    '</div>';
}

function toggleUserMenu() {
  var menu = document.getElementById('userMenu');
  if (menu) menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

function handleLogout() {
  localStorage.removeItem('fitapp_token');
  currentUser = null;
  window.location.href = 'index.html';
}


function uploadAvatar(input) {
  if (!input.files || !input.files[0]) return;
  var file = input.files[0];
  if (file.size > 5 * 1024 * 1024) {
    var msgEl = document.getElementById('avatarUploadMsg');
    if (msgEl) { msgEl.textContent = 'Файл слишком большой (макс. 5МБ)'; msgEl.className = 'settings-msg error'; }
    return;
  }
  openCropModal(file, 'new');
  input.value = '';
}

function doUploadWithCrop(file, cropX, cropY, cropW, cropH) {
  var formData = new FormData();
  formData.append('avatar', file);
  formData.append('cropX', String(Math.round(cropX)));
  formData.append('cropY', String(Math.round(cropY)));
  formData.append('cropWidth', String(Math.round(cropW)));
  formData.append('cropHeight', String(Math.round(cropH)));
  var token = localStorage.getItem('fitapp_token');
  fetch(API_URL + '/auth/avatar', {
    method: 'POST',
    headers: token ? { 'Authorization': 'Bearer ' + token } : {},
    body: formData
  })
  .then(function(resp) {
    if (!resp.ok) return resp.json().then(function(e) { throw new Error(e.error || 'Ошибка'); });
    return resp.json();
  })
  .then(function(data) {
    currentUser = data.user || data;
    updateProfileHeader();
    updateNavAuth();
    var msgEl = document.getElementById('avatarUploadMsg');
    if (msgEl) { msgEl.textContent = 'Аватар обновлён!'; msgEl.className = 'settings-msg success'; setTimeout(function() { msgEl.textContent = ''; }, 3000); }
  })
  .catch(function(err) {
    var msgEl = document.getElementById('avatarUploadMsg');
    if (msgEl) { msgEl.textContent = err.message; msgEl.className = 'settings-msg error'; }
  });
}

function doRecropAvatar(cropX, cropY, cropW, cropH) {
  apiFetch('/auth/avatar/crop', {
    method: 'POST',
    body: JSON.stringify({ cropX: Math.round(cropX), cropY: Math.round(cropY), cropWidth: Math.round(cropW), cropHeight: Math.round(cropH) })
  }).then(function(data) {
    currentUser = data.user || data;
    updateProfileHeader();
    updateNavAuth();
  }).catch(function(err) {
    alert(err.message || 'Ошибка кадрирования');
  });
}

function updateAvatarUploadPreview() {
  var preview = document.getElementById('avatarUploadPreview');
  if (!preview || !currentUser) return;
  if (isImageUrl(currentUser.avatar_url)) {
    preview.innerHTML = '<img src="' + API_URL.replace('/api', '') + currentUser.avatar_url + '" alt="avatar"/>';
    preview.classList.add('has-image');
  } else {
    preview.innerHTML = '<svg width="40" height="40" viewBox="0 0 24 24" fill="none"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="13" r="4" stroke="currentColor" stroke-width="1.5"/></svg>';
    preview.classList.remove('has-image');
  }
  var recropBtn = document.getElementById('avatarRecropBtn');
  if (!recropBtn) {
    var info = document.querySelector('.avatar-upload-info');
    if (info) {
      var btn = document.createElement('button');
      btn.id = 'avatarRecropBtn';
      btn.className = 'crop-recrop-btn';
      btn.onclick = function() { openCropModal(currentUser.avatar_original_url, 'recrop'); };
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 2v6H2M18 22v-6h4M2 8C4 4 8 2 12 2s8 2 10 6M22 16c-2 4-6 6-10 6s-8-2-10-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Изменить кадрирование';
      info.appendChild(btn);
      recropBtn = btn;
    }
  }
  if (recropBtn) {
    recropBtn.style.display = (currentUser.avatar_original_url && isImageUrl(currentUser.avatar_original_url)) ? 'flex' : 'none';
  }
}


function renderBMI() {
  var valueEl = document.getElementById('bmiValue');
  var pointerEl = document.getElementById('bmiPointer');
  var statusEl = document.getElementById('bmiStatus');
  var detailsEl = document.getElementById('bmiDetails');
  if (!valueEl || !currentUser) return;

  var h = currentUser.height_cm;
  var w = currentUser.weight_kg;
  if (!h || !w || h <= 0) {
    valueEl.textContent = '--';
    if (statusEl) statusEl.innerHTML = '<span style="color:var(--text-secondary)">Укажите рост и вес в настройках</span>';
    if (pointerEl) pointerEl.style.display = 'none';
    if (detailsEl) detailsEl.innerHTML = '';
    return;
  }

  var hm = h / 100;
  var bmi = w / (hm * hm);
  var bmiRound = Math.round(bmi * 10) / 10;
  valueEl.textContent = bmiRound;

  var pct = Math.max(0, Math.min(100, ((bmi - 16) / (40 - 16)) * 100));
  if (pointerEl) { pointerEl.style.display = ''; pointerEl.style.left = pct + '%'; }

  var status, color;
  if (bmi < 18.5) { status = 'Дефицит массы'; color = '#3B82F6'; }
  else if (bmi < 25) { status = 'Норма'; color = '#10B981'; }
  else if (bmi < 30) { status = 'Избыточный вес'; color = '#F59E0B'; }
  else { status = 'Ожирение'; color = '#EF4444'; }

  valueEl.style.color = color;
  if (statusEl) statusEl.innerHTML = '<span style="color:' + color + ';font-weight:700;">' + status + '</span>';

  var idealMin = Math.round(18.5 * hm * hm);
  var idealMax = Math.round(24.9 * hm * hm);
  if (detailsEl) {
    detailsEl.innerHTML =
      '<div class="bmi-detail-row"><span>Рост:</span><b>' + h + ' см</b></div>' +
      '<div class="bmi-detail-row"><span>Вес:</span><b>' + w + ' кг</b></div>' +
      '<div class="bmi-detail-row"><span>Идеальный вес:</span><b>' + idealMin + '–' + idealMax + ' кг</b></div>';
  }
}

/* ───── SETTINGS ───── */

function populateSettings() {
  if (!currentUser) return;
  var nameEl = document.getElementById('settingsName');
  var emailEl = document.getElementById('settingsEmail');
  var heightEl = document.getElementById('settingsHeight');
  var weightEl = document.getElementById('settingsWeight');
  var birthEl = document.getElementById('settingsBirth');
  var goalEl = document.getElementById('settingsGoal');
  if (nameEl) nameEl.value = currentUser.name || '';
  if (emailEl) emailEl.value = currentUser.email || '';
  if (heightEl) heightEl.value = currentUser.height_cm || '';
  if (weightEl) weightEl.value = currentUser.weight_kg || '';
  if (birthEl) birthEl.value = currentUser.birth_date ? currentUser.birth_date.substring(0, 10) : '';
  if (goalEl) goalEl.value = currentUser.goal || '';
}

function saveProfile() {
  var msgEl = document.getElementById('profileSaveMsg');
  msgEl.textContent = '';
  msgEl.className = 'settings-msg';
  var name = document.getElementById('settingsName').value.trim();
  if (!name) { msgEl.textContent = 'Введите имя'; msgEl.className = 'settings-msg error'; return; }
  var body = {
    name: name,
    height_cm: parseFloat(document.getElementById('settingsHeight').value) || null,
    weight_kg: parseFloat(document.getElementById('settingsWeight').value) || null,
    birth_date: document.getElementById('settingsBirth').value || null,
    goal: document.getElementById('settingsGoal').value || null
  };
  apiFetch('/auth/profile', { method: 'PUT', body: JSON.stringify(body) })
    .then(function(data) {
      currentUser = data.user || data;
      updateProfileHeader();
      updateNavAuth();
      msgEl.textContent = 'Сохранено!';
      msgEl.className = 'settings-msg success';
      setTimeout(function() { msgEl.textContent = ''; }, 3000);
    })
    .catch(function(err) {
      msgEl.textContent = err.message;
      msgEl.className = 'settings-msg error';
    });
}

function changePassword() {
  var msgEl = document.getElementById('pwdSaveMsg');
  msgEl.textContent = '';
  msgEl.className = 'settings-msg';
  var current = document.getElementById('pwdCurrent').value;
  var next = document.getElementById('pwdNew').value;
  var confirm = document.getElementById('pwdConfirm').value;
  if (!current || !next) { msgEl.textContent = 'Заполните все поля'; msgEl.className = 'settings-msg error'; return; }
  if (next.length < 6) { msgEl.textContent = 'Минимум 6 символов'; msgEl.className = 'settings-msg error'; return; }
  if (next !== confirm) { msgEl.textContent = 'Пароли не совпадают'; msgEl.className = 'settings-msg error'; return; }
  apiFetch('/auth/password', {
    method: 'PUT',
    body: JSON.stringify({ current_password: current, new_password: next })
  }).then(function() {
    msgEl.textContent = 'Пароль изменён!';
    msgEl.className = 'settings-msg success';
    document.getElementById('pwdCurrent').value = '';
    document.getElementById('pwdNew').value = '';
    document.getElementById('pwdConfirm').value = '';
    setTimeout(function() { msgEl.textContent = ''; }, 3000);
  }).catch(function(err) {
    msgEl.textContent = err.message;
    msgEl.className = 'settings-msg error';
  });
}

/* ───── AUTH MODAL ───── */

function showAuthModal(mode) {
  var m = document.getElementById('authModal');
  if (!m) return;
  m.style.display = 'flex';
  m.dataset.mode = mode || 'login';
  renderAuthModal();
}

function hideAuthModal() {
  var m = document.getElementById('authModal');
  if (m) m.style.display = 'none';
}

function renderAuthModal() {
  var m = document.getElementById('authModal');
  var isReg = m.dataset.mode === 'register';
  var content = document.getElementById('authModalContent');
  content.innerHTML =
    '<div class="auth-modal-card glass elevated">' +
      '<button class="auth-close" onclick="hideAuthModal()">&times;</button>' +
      '<h3>' + (isReg ? 'Регистрация' : 'Вход') + '</h3>' +
      '<p class="auth-desc">' + (isReg ? 'Создайте аккаунт' : 'Войдите в кабинет') + '</p>' +
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
  var m = document.getElementById('authModal');
  m.dataset.mode = m.dataset.mode === 'register' ? 'login' : 'register';
  renderAuthModal();
}

function handleAuthSubmit() {
  var m = document.getElementById('authModal');
  var isReg = m.dataset.mode === 'register';
  var email = document.getElementById('authEmail').value.trim();
  var password = document.getElementById('authPwd').value;
  var errEl = document.getElementById('authError');
  errEl.textContent = '';
  var promise;
  if (isReg) {
    var name = document.getElementById('authName').value.trim();
    if (!name) { errEl.textContent = 'Введите имя'; return; }
    promise = apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ email: email, password: password, name: name }) });
  } else {
    promise = apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email: email, password: password }) });
  }
  promise.then(function(data) {
    localStorage.setItem('fitapp_token', data.token);
    currentUser = data.user;
    hideAuthModal();
    updateProfileHeader();
    updateNavAuth();
    loadDashboard();
    loadCommunity();
  }).catch(function(err) {
    errEl.textContent = err.message;
  });
}

/* ───── DASHBOARD ───── */

function loadDashboard() {
  if (!currentUser) return;
  apiFetch('/workouts/stats').then(function(stats) {
    document.getElementById('dashTotalWorkouts').textContent = stats.totalWorkouts || 0;
    document.getElementById('dashTotalMinutes').textContent = stats.totalMinutes || 0;
    document.getElementById('dashWeekWorkouts').textContent = stats.weekWorkouts || 0;
    document.getElementById('dashWeekMinutes').textContent = stats.weekMinutes || 0;
    var todayCalEl = document.getElementById('dashTodayCal');
    var weekCalEl = document.getElementById('dashWeekCal');
    var totalCalEl = document.getElementById('dashTotalCal');
    if (todayCalEl) todayCalEl.textContent = stats.todayCalories || 0;
    if (weekCalEl) weekCalEl.textContent = stats.weekCalories || 0;
    if (totalCalEl) totalCalEl.textContent = stats.totalCalories || 0;
  }).catch(function() {});

  apiFetch('/workouts/logs').then(function(logs) {
    renderDashLogs(logs);
    renderWeekChart(logs);
  }).catch(function() { renderDashLogs([]); renderWeekChart([]); });

  loadWaterData();

  apiFetch('/community/my/list').then(function(pubs) {
    myPublishedIds = pubs.map(function(p) { return p.workoutId; });
  }).catch(function() { myPublishedIds = []; }).then(function() {
    apiFetch('/workouts').then(function(workouts) {
      renderDashWorkouts(workouts);
    }).catch(function() { renderDashWorkouts([]); });
  });
}

function renderDashWorkouts(workouts) {
  var container = document.getElementById('dashWorkoutsList');
  var countEl = document.getElementById('dashWorkoutCount');
  if (countEl) countEl.textContent = workouts.length;
  if (workouts.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:40px 0;color:var(--text-secondary);">Нет созданных тренировок</div>';
    return;
  }
  container.innerHTML = workouts.map(function(w) {
    var exCount = w.exercises ? w.exercises.length : 0;
    var setCount = w.exercises ? w.exercises.reduce(function(s, e) { return s + (e.sets || 0); }, 0) : 0;
    var isPublished = myPublishedIds.indexOf(w.id) !== -1;
    var publishBtn = isPublished
      ? '<span class="dash-workout-published"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Опубликовано</span>'
      : '<button class="dash-workout-publish-btn" onclick="event.stopPropagation();openPublishModal(' + w.id + ',\'' + escapeHtml(w.name).replace(/'/g, "\\'") + '\',' + exCount + ',' + setCount + ')" title="Опубликовать"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Опубликовать</button>';
    return '<div class="dash-workout-item"><div class="dash-workout-info"><div class="dash-workout-name">' + escapeHtml(w.name) + '</div><div class="dash-workout-meta">' + exCount + ' упр. · ' + setCount + ' подх.</div></div>' + publishBtn + '</div>';
  }).join('');
}

/* ───── WATER TRACKING ───── */
var waterCurrentGlasses = 0;
var waterTargetMl = 2000;
var waterTargetGlasses = 8;
var GLASS_ML = 250;

function calculateWaterTarget(weightKg, heightCm, bmi) {
  var ml = weightKg * 30;
  if (bmi >= 30) ml += 500;
  else if (bmi >= 25) ml += 250;
  if (heightCm > 180) ml += 200;
  ml = Math.round(ml / 50) * 50;
  return Math.max(1500, Math.min(4500, ml));
}

function loadWaterData() {
  if (!currentUser) return;
  if (currentUser.weight_kg && currentUser.height_cm) {
    var bmi = currentUser.weight_kg / Math.pow(currentUser.height_cm / 100, 2);
    waterTargetMl = calculateWaterTarget(currentUser.weight_kg, currentUser.height_cm, bmi);
  }
  waterTargetGlasses = Math.ceil(waterTargetMl / GLASS_ML);

  apiFetch('/workouts/water').then(function(data) {
    waterCurrentGlasses = data.glasses || 0;
    renderWaterUI();
  }).catch(function() {
    waterCurrentGlasses = 0;
    renderWaterUI();
  });

  apiFetch('/workouts/water/week').then(function(data) {
    renderWaterWeekChart(data);
  }).catch(function() { renderWaterWeekChart([]); });
}

function renderWaterUI() {
  var progress = Math.min(waterCurrentGlasses / waterTargetGlasses, 1);
  var consumedMl = waterCurrentGlasses * GLASS_ML;

 
  if (circle) {
    var circumference = 213.6; 
    circle.setAttribute('stroke-dashoffset', String(circumference * (1 - progress)));
  }
  var pctEl = document.getElementById('waterPercent');
  if (pctEl) pctEl.textContent = Math.round(progress * 100) + '%';

  var consumedEl = document.getElementById('waterConsumedMl');
  if (consumedEl) consumedEl.textContent = consumedMl + ' мл';
  var targetEl = document.getElementById('waterTargetLabel');
  if (targetEl) targetEl.textContent = 'из ' + waterTargetMl + ' мл (' + waterCurrentGlasses + '/' + waterTargetGlasses + ' стаканов)';

  var grid = document.getElementById('waterGlassGrid');
  if (grid) {
    var html = '';
    for (var i = 0; i < waterTargetGlasses; i++) {
      if (i < waterCurrentGlasses) {
        html += '<div class="dash-water-glass"><svg width="18" height="18" viewBox="0 0 24 24"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0L12 2.69z" fill="#60A5FA" stroke="#60A5FA" stroke-width="2"/></svg></div>';
      } else {
        html += '<div class="dash-water-glass"><svg width="18" height="18" viewBox="0 0 24 24"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0L12 2.69z" fill="none" stroke="var(--divider)" stroke-width="2"/></svg></div>';
      }
    }
    grid.innerHTML = html;
  }
}

function renderWaterWeekChart(data) {
  var chart = document.getElementById('waterWeekChart');
  if (!chart) return;
  var days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  var today = new Date();
  var todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

  var maxG = 1;
  for (var k = 0; k < data.length; k++) {
    if (data[k].glasses > maxG) maxG = data[k].glasses;
  }

  var html = '';
  for (var i = 0; i < 7; i++) {
    var g = data[i] ? data[i].glasses : 0;
    var isToday = data[i] && data[i].date === todayStr;
    var barH = Math.max((g / maxG) * 40, 3);
    var barColor = isToday ? '#60A5FA' : (g > 0 ? 'rgba(96,165,250,0.25)' : 'var(--divider)');
    var dayColor = isToday ? '#60A5FA' : 'var(--text-secondary)';
    var fw = isToday ? '700' : '500';
    html += '<div class="dash-water-week-col">' +
      '<div class="dash-water-week-bar" style="height:' + barH + 'px;background:' + barColor + ';"></div>' +
      '<div class="dash-water-week-day" style="color:' + dayColor + ';font-weight:' + fw + ';">' + days[i] + '</div>' +
      '</div>';
  }
  chart.innerHTML = html;
}

function saveWaterToServer() {
  apiFetch('/workouts/water', {
    method: 'POST',
    body: JSON.stringify({ glasses: waterCurrentGlasses, targetMl: waterTargetMl }),
  }).catch(function() {});
}

function webAddGlass() {
  waterCurrentGlasses++;
  renderWaterUI();
  saveWaterToServer();

  apiFetch('/workouts/water/week').then(function(data) {
    renderWaterWeekChart(data);
  }).catch(function() {});
}

function webRemoveGlass() {
  if (waterCurrentGlasses <= 0) return;
  waterCurrentGlasses--;
  renderWaterUI();
  saveWaterToServer();
  apiFetch('/workouts/water/week').then(function(data) {
    renderWaterWeekChart(data);
  }).catch(function() {});
}

function renderDashLogs(logs) {
  var container = document.getElementById('dashLogsList');
  var recent = logs.slice(0, 10);
  if (recent.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:40px 0;color:var(--text-secondary);">Нет завершённых тренировок</div>';
    return;
  }
  container.innerHTML = recent.map(function(log) {
    var setsCount = 0;
    if (log.exercises) log.exercises.forEach(function(e) { if (e.sets) e.sets.forEach(function(s) { if (s.completed) setsCount++; }); });
    return '<div class="dash-log-item"><div class="dash-log-dot"></div><div class="dash-log-info"><div class="dash-log-name">' + escapeHtml(log.workoutName) + '</div><div class="dash-log-meta">' + log.date + ' · ' + log.durationMinutes + ' мин · ' + setsCount + ' подх.</div></div></div>';
  }).join('');
}

function renderWeekChart(logs) {
  var chart = document.getElementById('dashWeekChart');
  var days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  var today = new Date();
  var dayOfWeek = today.getDay();
  var mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  var monday = new Date(today);
  monday.setDate(today.getDate() - mondayOffset);

  var weekData = days.map(function(_, i) {
    var d = new Date(monday);
    d.setDate(monday.getDate() + i);
    var dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    var dayLogs = logs.filter(function(l) { return l.date === dateStr; });
    var mins = dayLogs.reduce(function(s, l) { return s + (l.durationMinutes || 0); }, 0);
    return { day: days[i], mins: mins, count: dayLogs.length, date: dateStr };
  });

  var maxMins = Math.max.apply(null, weekData.map(function(d) { return d.mins; }));
  if (maxMins < 10) maxMins = 60;

  var todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

  chart.innerHTML = weekData.map(function(d) {
    var height = maxMins > 0 ? Math.max(4, (d.mins / maxMins) * 120) : 4;
    var todayClass = d.date === todayStr ? ' today' : '';
    var activeClass = d.mins > 0 ? ' active' : '';
    return '<div class="dash-bar-col' + todayClass + '"><div class="dash-bar-val">' + (d.mins > 0 ? d.mins + 'м' : '') + '</div><div class="dash-bar' + activeClass + '" style="height:' + height + 'px;"></div><div class="dash-bar-label">' + d.day + '</div></div>';
  }).join('');
}

/* ───── PUBLISH WORKOUT ───── */

function openPublishModal(workoutId, workoutName, exCount, setCount) {
  publishWorkoutId = workoutId;
  publishDifficulty = 'intermediate';
  document.getElementById('publishTitle').value = workoutName;
  document.getElementById('publishDesc').value = '';
  document.getElementById('publishMsg').textContent = '';
  document.getElementById('publishWorkoutBadge').innerHTML =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6.5 6.5L17.5 17.5M4 9L9 4M15 20L20 15M3 12L12 3M12 21L21 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> ' +
    escapeHtml(workoutName) + ' <span style="color:var(--text-secondary);font-weight:400;">(' + exCount + ' упр. · ' + setCount + ' подх.)</span>';
  document.querySelectorAll('.publish-diff-chips .filter-chip').forEach(function(c) {
    c.classList.toggle('active', c.dataset.diff === 'intermediate');
  });
  document.getElementById('publishModal').style.display = 'flex';
}

function closePublishModal() {
  document.getElementById('publishModal').style.display = 'none';
  publishWorkoutId = null;
}

function setPublishDiff(diff) {
  publishDifficulty = diff;
  document.querySelectorAll('.publish-diff-chips .filter-chip').forEach(function(c) {
    c.classList.toggle('active', c.dataset.diff === diff);
  });
}

function submitPublish() {
  var title = document.getElementById('publishTitle').value.trim();
  var desc = document.getElementById('publishDesc').value.trim();
  var msgEl = document.getElementById('publishMsg');
  if (!title) {
    msgEl.textContent = 'Введите название';
    msgEl.className = 'settings-msg error';
    return;
  }
  msgEl.textContent = 'Публикация...';
  msgEl.className = 'settings-msg';
  apiFetch('/community/publish', {
    method: 'POST',
    body: JSON.stringify({ workoutId: publishWorkoutId, title: title, description: desc, difficulty: publishDifficulty })
  }).then(function() {
    closePublishModal();
    loadDashboard();
    loadCommunity();
  }).catch(function(err) {
    msgEl.textContent = err.message || 'Ошибка публикации';
    msgEl.className = 'settings-msg error';
  });
}

/* ───── COMMUNITY ───── */

function setCommunitySort(sort) {
  communitySort = sort;
  document.querySelectorAll('.community-sort-chips .filter-chip').forEach(function(c) {
    c.classList.toggle('active', c.dataset.sort === sort);
  });
  loadCommunity();
}

function loadCommunity() {
  var search = (document.getElementById('communitySearch') || {}).value || '';
  var params = '?limit=12&sort=' + communitySort;
  if (search) params += '&search=' + encodeURIComponent(search);
  apiFetch('/community' + params).then(function(items) {
    communityItems = items;
  }).catch(function() { communityItems = []; }).then(function() { renderCommunity(); });
}

function renderCommunity() {
  var container = document.getElementById('communityList');
  if (!container) return;
  if (communityItems.length === 0) {
    container.innerHTML =
      '<div style="text-align:center;padding:60px 0;color:var(--text-secondary);grid-column:1/-1;">' +
        '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" style="margin-bottom:12px;">' +
          '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" opacity="0.3"/>' +
          '<path d="M2 12H22M12 2C14.5 4.7 16 8.2 16 12S14.5 19.3 12 22M12 2C9.5 4.7 8 8.2 8 12S9.5 19.3 12 22" stroke="currentColor" stroke-width="1.5" opacity="0.3"/>' +
        '</svg>' +
        '<div style="font-size:18px;font-weight:700;margin-bottom:6px;">Пока пусто</div>' +
        '<div>Станьте первым! Опубликуйте тренировку в приложении.</div>' +
      '</div>';
    return;
  }
  container.innerHTML = communityItems.map(function(item) {
    var diffClass = item.difficulty === 'beginner' ? 'diff-beginner' : item.difficulty === 'advanced' ? 'diff-advanced' : 'diff-intermediate';
    var heartClass = item.liked ? 'liked' : '';
    return (
      '<div class="glass community-card" onclick="openCommunityDetail(\'' + item.id + '\')">' +
        '<div class="community-card-top">' +
          '<div class="community-card-title">' + escapeHtml(item.title) + '</div>' +
          '<span class="community-diff ' + diffClass + '">' + DIFFICULTY_LABELS[item.difficulty] + '</span>' +
        '</div>' +
        '<div class="community-card-author">' + escapeHtml(item.authorName) + '</div>' +
        (item.description ? '<div class="community-card-desc">' + escapeHtml(item.description).substring(0, 100) + '</div>' : '') +
        '<div class="community-card-meta">' +
          '<span>' + item.exerciseCount + ' упр.</span>' +
          '<span class="community-views"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M1 12S5 5 12 5s11 7 11 7-4 7-11 7S1 12 1 12z" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/></svg> ' + item.views + '</span>' +
          '<button class="community-like-btn ' + heartClass + '" onclick="event.stopPropagation();toggleCommunityLike(\'' + item.id + '\')">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="' + (item.liked ? '#F87171' : 'none') + '"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" stroke="' + (item.liked ? '#F87171' : 'currentColor') + '" stroke-width="2"/></svg> ' + item.likesCount +
          '</button>' +
        '</div>' +
      '</div>'
    );
  }).join('');
}

function openCommunityDetail(id) {
  var modal = document.getElementById('communityDetailModal');
  var content = document.getElementById('communityDetailContent');
  modal.style.display = 'flex';
  content.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-secondary);">Загрузка...</div>';
  apiFetch('/community/' + id).then(function(detail) {
    var diffClass = detail.difficulty === 'beginner' ? 'diff-beginner' : detail.difficulty === 'advanced' ? 'diff-advanced' : 'diff-intermediate';
    var exHtml = (detail.exercises || []).map(function(ex, i) {
      return '<div class="cd-exercise"><div class="cd-ex-num">' + (i + 1) + '</div><div class="cd-ex-info"><div class="cd-ex-name">' + escapeHtml(ex.exerciseName) + '</div><div class="cd-ex-meta">' + ex.sets + ' x ' + ex.reps + ' · отдых ' + ex.restSeconds + 'с</div></div></div>';
    }).join('');
    content.innerHTML =
      '<button class="auth-close" onclick="closeCommunityDetail()">&times;</button>' +
      '<h3 class="cd-title">' + escapeHtml(detail.title) + '</h3>' +
      '<div class="cd-author">' + escapeHtml(detail.authorName) + '</div>' +
      (detail.description ? '<p class="cd-desc">' + escapeHtml(detail.description) + '</p>' : '') +
      '<div class="cd-stats"><div class="cd-stat"><div class="cd-stat-val">' + detail.views + '</div><div class="cd-stat-lbl">Просмотры</div></div><div class="cd-stat"><div class="cd-stat-val">' + detail.likesCount + '</div><div class="cd-stat-lbl">Лайки</div></div><div class="cd-stat"><div class="cd-stat-val">' + (detail.exercises || []).length + '</div><div class="cd-stat-lbl">Упражнений</div></div></div>' +
      '<div class="cd-section-title">Упражнения</div><div class="cd-exercises">' + exHtml + '</div>' +
      '<div class="cd-actions">' +
        '<button class="cd-like-btn ' + (detail.liked ? 'liked' : '') + '" onclick="toggleCommunityLike(\'' + detail.id + '\');openCommunityDetail(\'' + detail.id + '\')">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="' + (detail.liked ? '#F87171' : 'none') + '"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" stroke="' + (detail.liked ? '#F87171' : 'currentColor') + '" stroke-width="2"/></svg> ' + detail.likesCount +
        '</button>' +
        '<button class="cd-copy-btn" onclick="copyCommunityWorkout(\'' + detail.id + '\')">Добавить к себе</button>' +
      '</div>';
    communityItems = communityItems.map(function(c) { return c.id === id ? Object.assign({}, c, { views: c.views + 1 }) : c; });
  }).catch(function() {
    content.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-secondary);">Ошибка загрузки</div>';
  });
}

function closeCommunityDetail() {
  document.getElementById('communityDetailModal').style.display = 'none';
}

function toggleCommunityLike(id) {
  if (!currentUser) { showAuthModal('login'); return; }
  apiFetch('/community/' + id + '/like', { method: 'POST' }).then(function(result) {
    communityItems = communityItems.map(function(c) {
      if (c.id !== id) return c;
      return Object.assign({}, c, { liked: result.liked, likesCount: c.likesCount + (result.liked ? 1 : -1) });
    });
    renderCommunity();
  }).catch(function() {});
}

function copyCommunityWorkout(id) {
  if (!currentUser) { showAuthModal('login'); return; }
  apiFetch('/community/' + id + '/copy', { method: 'POST' }).then(function() {
    alert('Тренировка добавлена в ваш список!');
    closeCommunityDetail();
    loadDashboard();
  }).catch(function(err) { alert(err.message); });
}


var cropState = {
  mode: 'new', 
  file: null,
  img: null,
  imgW: 0, imgH: 0,
  scale: 1,
  tx: 0, ty: 0,
  dragging: false,
  lastX: 0, lastY: 0,
  areaSize: 420,
  cropRatio: 0.72
};

function openCropModal(fileOrUrl, mode) {
  cropState.mode = mode;
  cropState.scale = 1;
  cropState.tx = 0;
  cropState.ty = 0;
  var modal = document.getElementById('cropModal');
  modal.style.display = 'flex';

  var area = document.getElementById('cropArea');
  cropState.areaSize = area.offsetWidth || 420;

  if (mode === 'new' && fileOrUrl instanceof File) {
    cropState.file = fileOrUrl;
    var reader = new FileReader();
    reader.onload = function(e) { loadCropImage(e.target.result); };
    reader.readAsDataURL(fileOrUrl);
  } else {
    cropState.file = null;
    var url = typeof fileOrUrl === 'string' ? fileOrUrl : '';
    if (url.startsWith('/uploads/')) url = API_URL.replace('/api', '') + url;
    loadCropImage(url);
  }
}

function loadCropImage(src) {
  var img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = function() {
    cropState.img = img;
    cropState.imgW = img.naturalWidth;
    cropState.imgH = img.naturalHeight;

    var circleSize = cropState.areaSize * cropState.cropRatio;
    var aspect = img.naturalWidth / img.naturalHeight;
    if (aspect >= 1) {
      cropState.dispH = circleSize;
      cropState.dispW = circleSize * aspect;
    } else {
      cropState.dispW = circleSize;
      cropState.dispH = circleSize / aspect;
    }
    cropState.scale = 1;
    cropState.tx = 0;
    cropState.ty = 0;
    drawCropCanvas();
  };
  img.src = src;
}

function drawCropCanvas() {
  if (!cropState.img) return;
  var canvas = document.getElementById('cropCanvas');
  var area = document.getElementById('cropArea');
  var size = area.offsetWidth || cropState.areaSize;
  canvas.width = size;
  canvas.height = size;
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);

  var s = cropState.scale;
  var w = cropState.dispW * s;
  var h = cropState.dispH * s;
  var x = size / 2 - w / 2 + cropState.tx;
  var y = size / 2 - h / 2 + cropState.ty;

  ctx.drawImage(cropState.img, x, y, w, h);
}

function getCropRect() {
  var size = cropState.areaSize;
  var circleSize = size * cropState.cropRatio;
  var r = circleSize / 2;
  var s = cropState.scale;
  var ratio = cropState.imgW / cropState.dispW;

  var cropDispX = cropState.dispW * s / 2 - r - cropState.tx;
  var cropDispY = cropState.dispH * s / 2 - r - cropState.ty;
  var cropDispSize = circleSize;

  var originX = Math.max(0, Math.round(cropDispX * ratio / s));
  var originY = Math.max(0, Math.round(cropDispY * ratio / s));
  var cropSz = Math.round(cropDispSize * ratio / s);
  cropSz = Math.min(cropSz, cropState.imgW - originX, cropState.imgH - originY);
  cropSz = Math.max(1, cropSz);

  return { cropX: originX, cropY: originY, cropW: cropSz, cropH: cropSz };
}

function confirmCrop() {
  var rect = getCropRect();
  closeCropModal();
  if (cropState.mode === 'new' && cropState.file) {
    doUploadWithCrop(cropState.file, rect.cropX, rect.cropY, rect.cropW, rect.cropH);
  } else {
    doRecropAvatar(rect.cropX, rect.cropY, rect.cropW, rect.cropH);
  }
}

function closeCropModal() {
  document.getElementById('cropModal').style.display = 'none';
}

function handleAvatarHeaderClick() {
  if (currentUser && isImageUrl(currentUser.avatar_original_url)) {
    var choice = confirm('Изменить кадрирование текущего аватара?\n\nОК = Изменить кадрирование\nОтмена = Загрузить новое фото');
    if (choice) {
      openCropModal(currentUser.avatar_original_url, 'recrop');
    } else {
      document.getElementById('avatarFileInput').click();
    }
  } else {
    document.getElementById('avatarFileInput').click();
  }
}

(function() {
  function initCropEvents() {
    var area = document.getElementById('cropArea');
    if (!area) return;

    area.addEventListener('mousedown', function(e) {
      cropState.dragging = true;
      cropState.lastX = e.clientX;
      cropState.lastY = e.clientY;
      e.preventDefault();
    });
    window.addEventListener('mousemove', function(e) {
      if (!cropState.dragging) return;
      cropState.tx += e.clientX - cropState.lastX;
      cropState.ty += e.clientY - cropState.lastY;
      cropState.lastX = e.clientX;
      cropState.lastY = e.clientY;
      drawCropCanvas();
    });
    window.addEventListener('mouseup', function() { cropState.dragging = false; });

    area.addEventListener('wheel', function(e) {
      e.preventDefault();
      var delta = e.deltaY > 0 ? -0.08 : 0.08;
      cropState.scale = Math.max(0.3, Math.min(5, cropState.scale + delta));
      drawCropCanvas();
    }, { passive: false });

    var lastTouchDist = 0;
    var lastTouchX = 0, lastTouchY = 0;
    area.addEventListener('touchstart', function(e) {
      if (e.touches.length === 1) {
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        lastTouchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        lastTouchX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        lastTouchY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      }
      e.preventDefault();
    }, { passive: false });
    area.addEventListener('touchmove', function(e) {
      if (e.touches.length === 2) {
        var dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        if (lastTouchDist > 0) {
          cropState.scale = Math.max(0.3, Math.min(5, cropState.scale * (dist / lastTouchDist)));
        }
        lastTouchDist = dist;
        var mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        var my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        cropState.tx += mx - lastTouchX;
        cropState.ty += my - lastTouchY;
        lastTouchX = mx;
        lastTouchY = my;
      } else if (e.touches.length === 1) {
        cropState.tx += e.touches[0].clientX - lastTouchX;
        cropState.ty += e.touches[0].clientY - lastTouchY;
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;
      }
      drawCropCanvas();
      e.preventDefault();
    }, { passive: false });
    area.addEventListener('touchend', function() { lastTouchDist = 0; });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCropEvents);
  } else {
    initCropEvents();
  }
})();

/* ───── UTILS ───── */

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

/* ───── INIT ───── */

document.addEventListener('DOMContentLoaded', function() {
  checkAuth();
  initAnimations();
  document.addEventListener('click', function(e) {
    var menu = document.getElementById('userMenu');
    if (menu && !e.target.closest('.nav-user') && !e.target.closest('.nav-user-menu')) {
      menu.style.display = 'none';
    }
  });
});
