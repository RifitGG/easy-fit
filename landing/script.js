// ===== EXERCISE DATA =====
const exercises = [
  { id: 'bench-press', name: 'Жим лёжа', muscleGroups: ['chest', 'triceps', 'shoulders'], equipment: 'barbell', difficulty: 'intermediate', description: 'Базовое упражнение для верхней части тела, направленное на грудные мышцы.', steps: ['Лягте на скамью, ноги на полу.', 'Возьмитесь за штангу чуть шире плеч.', 'Снимите штангу и опустите к середине груди.', 'Выжмите штангу вверх до полного выпрямления рук.', 'Повторите нужное количество раз.'] },
  { id: 'squat', name: 'Приседания со штангой', muscleGroups: ['legs', 'glutes'], equipment: 'barbell', difficulty: 'intermediate', description: 'Король упражнений для ног: квадрицепсы, бицепс бедра и ягодицы.', steps: ['Расположите штангу на верхней части трапеций.', 'Встаньте, ноги на ширине плеч.', 'Сгибайте колени и бёдра, опускаясь вниз.', 'Опуститесь до параллели бёдер с полом.', 'Оттолкнитесь пятками и вернитесь в исходное положение.'] },
  { id: 'deadlift', name: 'Становая тяга', muscleGroups: ['back', 'legs', 'glutes'], equipment: 'barbell', difficulty: 'advanced', description: 'Базовое упражнение на всё тело для развития силы и мышечной массы.', steps: ['Встаньте, ноги на ширине бёдер, штанга над серединой стопы.', 'Наклонитесь и возьмитесь за штангу.', 'Держите спину ровно, грудь вперёд.', 'Поднимите штангу, выпрямляя ноги и корпус.', 'Полностью выпрямитесь, затем опустите штангу.'] },
  { id: 'overhead-press', name: 'Жим стоя', muscleGroups: ['shoulders', 'triceps'], equipment: 'barbell', difficulty: 'intermediate', description: 'Базовое жимовое движение для развития сильных плеч.', steps: ['Встаньте, ноги на ширине плеч.', 'Удерживайте штангу на уровне плеч.', 'Выжмите штангу вверх до полного выпрямления рук.', 'Опустите штангу обратно к плечам.', 'Держите кор напряжённым на протяжении всего движения.'] },
  { id: 'pull-up', name: 'Подтягивания', muscleGroups: ['back', 'biceps'], equipment: 'bodyweight', difficulty: 'intermediate', description: 'Классическое упражнение с собственным весом для спины.', steps: ['Возьмитесь за перекладину хватом шире плеч.', 'Повисните на выпрямленных руках.', 'Подтянитесь, пока подбородок не окажется выше перекладины.', 'Плавно опуститесь в исходное положение.', 'Избегайте раскачивания и рывков.'] },
  { id: 'push-up', name: 'Отжимания', muscleGroups: ['chest', 'triceps', 'shoulders'], equipment: 'bodyweight', difficulty: 'beginner', description: 'Базовое упражнение с собственным весом для верхней части тела.', steps: ['Примите упор лёжа, руки на ширине плеч.', 'Опустите тело, пока грудь почти не коснётся пола.', 'Отожмитесь обратно в исходное положение.', 'Держите тело в прямой линии на протяжении всего движения.', 'Вдыхайте при опускании, выдыхайте при подъёме.'] },
  { id: 'dumbbell-curl', name: 'Сгибания с гантелями', muscleGroups: ['biceps', 'forearms'], equipment: 'dumbbell', difficulty: 'beginner', description: 'Изолирующее упражнение для бицепсов.', steps: ['Встаньте с гантелями в руках, руки вдоль тела.', 'Прижмите локти к корпусу.', 'Сгибайте руки, сокращая бицепсы.', 'Сожмите бицепсы в верхней точке.', 'Медленно опустите гантели.'] },
  { id: 'tricep-pushdown', name: 'Разгибания на трицепс', muscleGroups: ['triceps'], equipment: 'cable', difficulty: 'beginner', description: 'Упражнение на блоке для изоляции трицепсов.', steps: ['Встаньте лицом к блочному тренажёру.', 'Возьмитесь за рукоять верхним хватом.', 'Прижмите локти к корпусу.', 'Разогните руки до полного выпрямления.', 'Медленно верните рукоять в исходное положение.'] },
  { id: 'lateral-raise', name: 'Махи гантелями в стороны', muscleGroups: ['shoulders'], equipment: 'dumbbell', difficulty: 'beginner', description: 'Изолирующее упражнение на средние дельты для ширины плеч.', steps: ['Встаньте с гантелями в руках по бокам.', 'Слегка согните локти.', 'Поднимите руки в стороны до параллели с полом.', 'Задержитесь на мгновение в верхней точке.', 'Плавно опустите гантели.'] },
  { id: 'leg-press', name: 'Жим ногами', muscleGroups: ['legs', 'glutes'], equipment: 'machine', difficulty: 'beginner', description: 'Базовое упражнение на тренажёре для ног.', steps: ['Сядьте в тренажёр, спина прижата к спинке.', 'Поставьте ступни на платформу на ширине плеч.', 'Снимите с упоров и опустите платформу к себе.', 'Выжмите платформу, не разгибая колени до конца.', 'Повторите нужное количество раз.'] },
  { id: 'barbell-row', name: 'Тяга штанги в наклоне', muscleGroups: ['back', 'biceps'], equipment: 'barbell', difficulty: 'intermediate', description: 'Базовое тяговое упражнение для толщины спины.', steps: ['Встаньте, ноги на ширине бёдер, штанга в руках.', 'Наклонитесь вперёд, корпус почти параллелен полу.', 'Подтяните штангу к низу груди.', 'Сведите лопатки в верхней точке.', 'Плавно опустите штангу.'] },
  { id: 'plank', name: 'Планка', muscleGroups: ['abs'], equipment: 'bodyweight', difficulty: 'beginner', description: 'Статическое упражнение для кора и стабильности.', steps: ['Примите положение на предплечьях.', 'Тело должно быть в прямой линии от головы до пяток.', 'Напрягите кор и ягодицы.', 'Удерживайте положение нужное время.', 'Не позволяйте бёдрам провисать или подниматься.'] },
  { id: 'cable-fly', name: 'Сведение рук в кроссовере', muscleGroups: ['chest'], equipment: 'cable', difficulty: 'intermediate', description: 'Изолирующее упражнение для груди с постоянным натяжением.', steps: ['Установите блоки на уровне плеч.', 'Возьмите рукоятки и сделайте шаг вперёд.', 'С лёгким сгибом в локтях сведите руки перед собой.', 'Сожмите грудные мышцы в пиковой точке.', 'Медленно вернитесь в исходное положение.'] },
  { id: 'kettlebell-swing', name: 'Махи гирей', muscleGroups: ['glutes', 'back', 'shoulders'], equipment: 'kettlebell', difficulty: 'intermediate', description: 'Динамичное упражнение для всего тела, развивает силу и выносливость.', steps: ['Встаньте, ноги чуть шире плеч.', 'Возьмите гирю двумя руками.', 'Отведите бёдра назад и качните гирю между ног.', 'Мощно выпрямите бёдра, качнув гирю до уровня груди.', 'Дайте гире вернуться вниз и повторите.'] },
  { id: 'lunges', name: 'Выпады', muscleGroups: ['legs', 'glutes'], equipment: 'bodyweight', difficulty: 'beginner', description: 'Одностороннее упражнение для ног, улучшает баланс и силу.', steps: ['Встаньте прямо, ноги вместе.', 'Сделайте шаг вперёд и опустите заднее колено к полу.', 'Переднее колено находится над лодыжкой.', 'Оттолкнитесь передней ногой и шагните другой ногой.', 'Чередуйте ноги при движении вперёд.'] },
  { id: 'calf-raise', name: 'Подъёмы на носки', muscleGroups: ['calves'], equipment: 'machine', difficulty: 'beginner', description: 'Изолирующее упражнение для икроножных мышц.', steps: ['Встаньте в тренажёр, плечи под подушками.', 'Поставьте носки на край платформы.', 'Поднимитесь на носки как можно выше.', 'Задержитесь в верхней точке на мгновение.', 'Опустите пятки ниже уровня платформы и повторите.'] },
  { id: 'dumbbell-fly', name: 'Разводка гантелей', muscleGroups: ['chest'], equipment: 'dumbbell', difficulty: 'intermediate', description: 'Изолирующее упражнение: растяжение и сокращение грудных мышц.', steps: ['Лягте на скамью с гантелями над грудью.', 'С лёгким сгибом в локтях разведите руки в стороны.', 'Опустите, пока не почувствуете растяжение груди.', 'Сведите гантели обратно над грудью.', 'Сохраняйте одинаковый угол в локтях.'] },
  { id: 'resistance-band-pull-apart', name: 'Разведение резинки', muscleGroups: ['shoulders', 'back'], equipment: 'bands', difficulty: 'beginner', description: 'Простое упражнение для задних дельт и верха спины.', steps: ['Держите резинку перед собой на уровне плеч.', 'Руки вытянуты, хват чуть шире плеч.', 'Разведите руки в стороны, сводя лопатки.', 'Доведите резинку до груди.', 'Плавно вернитесь в исходное положение.'] },
  { id: 'hammer-curl', name: 'Молотковые сгибания', muscleGroups: ['biceps', 'forearms'], equipment: 'dumbbell', difficulty: 'beginner', description: 'Вариация сгибаний для брахиалиса и предплечий.', steps: ['Встаньте с гантелями, ладони обращены друг к другу.', 'Прижмите локти к корпусу.', 'Согните руки, сохраняя нейтральный хват.', 'Сожмите мышцы в верхней точке.', 'Медленно опустите гантели.'] },
  { id: 'leg-curl', name: 'Сгибание ног лёжа', muscleGroups: ['legs'], equipment: 'machine', difficulty: 'beginner', description: 'Изолирующее упражнение для бицепса бедра.', steps: ['Лягте лицом вниз на тренажёр.', 'Расположите валик чуть выше лодыжек.', 'Согните ноги, подтягивая валик к ягодицам.', 'Сожмите бицепс бедра в верхней точке.', 'Плавно опустите вес.'] },
];

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

let selectedMuscle = null;
let selectedExercise = null;
let builtExercises = [];

function init() {
  renderMuscleFilters();
  renderExerciseList();
  renderBuilderList();
}

function switchDemoTab(tab) {
  document.querySelectorAll('.demo-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.demo-tab[data-tab="${tab}"]`).classList.add('active');

  document.getElementById('tab-catalog').style.display = tab === 'catalog' ? 'block' : 'none';
  const builder = document.getElementById('tab-builder');
  if (tab === 'builder') {
    builder.style.display = 'block';
    builder.classList.add('visible');
  } else {
    builder.style.display = 'none';
    builder.classList.remove('visible');
  }
}

function renderMuscleFilters() {
  const container = document.getElementById('muscleFilters');
  const allChip = document.createElement('button');
  allChip.className = 'filter-chip active';
  allChip.textContent = 'Все';
  allChip.onclick = () => { selectedMuscle = null; renderMuscleFilters(); filterExercises(); };
  container.innerHTML = '';
  container.appendChild(allChip);

  if (selectedMuscle !== null) allChip.classList.remove('active');

  Object.entries(MUSCLE_LABELS).forEach(([key, label]) => {
    const chip = document.createElement('button');
    chip.className = 'filter-chip' + (selectedMuscle === key ? ' active' : '');
    chip.textContent = label;
    chip.onclick = () => {
      selectedMuscle = selectedMuscle === key ? null : key;
      renderMuscleFilters();
      filterExercises();
    };
    container.appendChild(chip);
  });
}

function filterExercises() {
  const search = document.getElementById('exerciseSearch').value.toLowerCase();
  const filtered = exercises.filter(ex => {
    const matchSearch = !search || ex.name.toLowerCase().includes(search) || ex.description.toLowerCase().includes(search);
    const matchMuscle = !selectedMuscle || ex.muscleGroups.includes(selectedMuscle);
    return matchSearch && matchMuscle;
  });
  renderExerciseList(filtered);
}

function renderExerciseList(list) {
  if (!list) list = exercises;
  const container = document.getElementById('exerciseList');
  container.innerHTML = '';

  if (list.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 40px 0; color: var(--text-secondary);">Упражнения не найдены</div>';
    return;
  }

  list.forEach(ex => {
    const item = document.createElement('div');
    item.className = 'glass exercise-item' + (selectedExercise === ex.id ? ' selected' : '');
    item.onclick = () => selectExercise(ex.id);

    const muscleLabels = ex.muscleGroups.map(mg => `<span class="exercise-badge badge-muscle">${MUSCLE_LABELS[mg]}</span>`).join('');
    const diffClass = 'badge-difficulty-' + ex.difficulty;

    item.innerHTML = `
      <div class="exercise-header">
        <div class="exercise-name">${ex.name}</div>
        <span class="exercise-badge ${diffClass}">${DIFFICULTY_LABELS[ex.difficulty]}</span>
      </div>
      <div class="exercise-badges" style="margin-bottom: 8px;">
        ${muscleLabels}
        <span class="exercise-badge badge-equipment">${EQUIPMENT_LABELS[ex.equipment]}</span>
      </div>
      <div class="exercise-desc">${ex.description}</div>
    `;
    container.appendChild(item);
  });
}

function selectExercise(id) {
  selectedExercise = id;
  const ex = exercises.find(e => e.id === id);
  if (!ex) return;

  renderExerciseList(getFilteredList());

  const detail = document.getElementById('exerciseDetail');
  detail.classList.add('visible');

  const muscleLabels = ex.muscleGroups.map(mg => `<span class="exercise-badge badge-muscle">${MUSCLE_LABELS[mg]}</span>`).join('');
  const diffClass = 'badge-difficulty-' + ex.difficulty;
  const stepsHtml = ex.steps.map((step, i) => `
    <div class="step-item">
      <div class="step-number">${i + 1}</div>
      <div class="step-text">${step}</div>
    </div>
  `).join('');

  document.getElementById('exerciseDetailContent').innerHTML = `
    <div class="exercise-detail-title">${ex.name}</div>
    <div class="exercise-detail-desc">${ex.description}</div>
    <div class="exercise-detail-meta">
      ${muscleLabels}
      <span class="exercise-badge badge-equipment">${EQUIPMENT_LABELS[ex.equipment]}</span>
      <span class="exercise-badge ${diffClass}">${DIFFICULTY_LABELS[ex.difficulty]}</span>
    </div>
    <div class="exercise-steps">
      <h4>Как выполнять:</h4>
      ${stepsHtml}
    </div>
  `;
}

function getFilteredList() {
  const search = document.getElementById('exerciseSearch').value.toLowerCase();
  return exercises.filter(ex => {
    const matchSearch = !search || ex.name.toLowerCase().includes(search) || ex.description.toLowerCase().includes(search);
    const matchMuscle = !selectedMuscle || ex.muscleGroups.includes(selectedMuscle);
    return matchSearch && matchMuscle;
  });
}

function renderBuilderList() {
  const container = document.getElementById('builderExerciseList');
  container.innerHTML = '';
  exercises.forEach(ex => {
    const isAdded = builtExercises.includes(ex.id);
    const item = document.createElement('div');
    item.className = 'workout-exercise-add' + (isAdded ? ' added' : '');
    item.onclick = () => toggleBuilderExercise(ex.id);
    item.innerHTML = `
      <span class="name">${ex.name}</span>
      <span class="add-icon">${isAdded ? '✓' : '+'}</span>
    `;
    container.appendChild(item);
  });
}

function toggleBuilderExercise(id) {
  if (builtExercises.includes(id)) {
    builtExercises = builtExercises.filter(e => e !== id);
  } else {
    builtExercises.push(id);
  }
  renderBuilderList();
  renderBuiltWorkout();
  selectExercise(id);
}

function removeBuiltExercise(id) {
  builtExercises = builtExercises.filter(e => e !== id);
  renderBuilderList();
  renderBuiltWorkout();
}

function renderBuiltWorkout() {
  const container = document.getElementById('builtWorkout');
  const listEl = document.getElementById('builtExercisesList');
  const summaryEl = document.getElementById('workoutSummary');

  if (builtExercises.length === 0) {
    container.style.display = 'none';
    return;
  }
  container.style.display = 'block';
  listEl.innerHTML = '';

  builtExercises.forEach(id => {
    const ex = exercises.find(e => e.id === id);
    if (!ex) return;
    const el = document.createElement('div');
    el.className = 'built-exercise';
    el.innerHTML = `
      <span class="name">${ex.name}</span>
      <button class="remove-btn" onclick="event.stopPropagation(); removeBuiltExercise('${id}')">✕</button>
    `;
    listEl.appendChild(el);
  });

  const sets = builtExercises.length * 3;
  const muscles = [...new Set(builtExercises.flatMap(id => {
    const ex = exercises.find(e => e.id === id);
    return ex ? ex.muscleGroups : [];
  }))];

  summaryEl.innerHTML = `
    <div class="row"><span class="label">Упражнений:</span><span class="value">${builtExercises.length}</span></div>
    <div class="row"><span class="label">Примерно подходов:</span><span class="value">${sets}</span></div>
    <div class="row"><span class="label">Групп мышц:</span><span class="value">${muscles.map(m => MUSCLE_LABELS[m]).join(', ')}</span></div>
  `;
}

function initAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right').forEach(el => {
    observer.observe(el);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  init();
  initAnimations();
});
