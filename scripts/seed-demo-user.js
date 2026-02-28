/**
 * Seed a demo user with workout history, scheduled workouts, community posts
 * Run: node scripts/seed-demo-user.js
 */

const API = 'http://89.111.171.11/api';

const USER = {
  email: 'demo@easyfit.ru',
  password: 'Demo2024!',
  name: 'Алексей',
};

async function api(path, opts = {}) {
  const url = `${API}${path}`;
  const fetchOpts = {
    method: opts.method || 'GET',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
  };
  if (opts.body) fetchOpts.body = opts.body;
  const res = await fetch(url, fetchOpts);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) throw new Error(`${res.status} ${path}: ${JSON.stringify(data)}`);
  return data;
}

async function main() {
  console.log('=== Seeding demo user ===\n');

  // 1. Register
  console.log('1. Registering user...');
  let token, user;
  try {
    const reg = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: USER.email, password: USER.password, name: USER.name }),
    });
    token = reg.token;
    user = reg.user;
    console.log(`   Created: ${user.name} (${user.email}), id=${user.id}`);
  } catch (e) {
    // Maybe already exists, try login
    console.log('   Already exists, logging in...');
    const login = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: USER.email, password: USER.password }),
    });
    token = login.token;
    user = login.user;
    console.log(`   Logged in: ${user.name} (${user.email}), id=${user.id}`);
  }

  const auth = { Authorization: `Bearer ${token}` };

  // 2. Update profile (height, weight, goal)
  console.log('2. Updating profile...');
  await api('/auth/profile', {
    method: 'PUT',
    headers: auth,
    body: JSON.stringify({ height_cm: 178, weight_kg: 75.5, goal: 'Набрать мышечную массу' }),
  });
  console.log('   Height: 178 cm, Weight: 75.5 kg, Goal: Набрать мышечную массу');

  // 3. Create workout programs
  console.log('3. Creating workout programs...');

  const workoutDefs = [
    {
      name: 'Грудь + Трицепс',
      exercises: [
        { exerciseId: 'bench-press', sets: 4, reps: 10, restSeconds: 90 },
        { exerciseId: 'incline-bench-press', sets: 3, reps: 12, restSeconds: 90 },
        { exerciseId: 'dumbbell-fly', sets: 3, reps: 12, restSeconds: 60 },
        { exerciseId: 'tricep-pushdown', sets: 3, reps: 15, restSeconds: 60 },
        { exerciseId: 'skull-crusher', sets: 3, reps: 12, restSeconds: 60 },
      ],
    },
    {
      name: 'Спина + Бицепс',
      exercises: [
        { exerciseId: 'pull-up', sets: 4, reps: 8, restSeconds: 120 },
        { exerciseId: 'barbell-row', sets: 4, reps: 10, restSeconds: 90 },
        { exerciseId: 'lat-pulldown', sets: 3, reps: 12, restSeconds: 60 },
        { exerciseId: 'dumbbell-curl', sets: 3, reps: 12, restSeconds: 60 },
        { exerciseId: 'hammer-curl', sets: 3, reps: 12, restSeconds: 60 },
      ],
    },
    {
      name: 'Ноги + Плечи',
      exercises: [
        { exerciseId: 'squat', sets: 4, reps: 10, restSeconds: 120 },
        { exerciseId: 'leg-press', sets: 3, reps: 12, restSeconds: 90 },
        { exerciseId: 'lunges', sets: 3, reps: 12, restSeconds: 60 },
        { exerciseId: 'overhead-press', sets: 3, reps: 10, restSeconds: 90 },
        { exerciseId: 'lateral-raise', sets: 3, reps: 15, restSeconds: 60 },
      ],
    },
    {
      name: 'Фулбоди',
      exercises: [
        { exerciseId: 'deadlift', sets: 3, reps: 8, restSeconds: 120 },
        { exerciseId: 'bench-press', sets: 3, reps: 10, restSeconds: 90 },
        { exerciseId: 'pull-up', sets: 3, reps: 8, restSeconds: 90 },
        { exerciseId: 'squat', sets: 3, reps: 10, restSeconds: 120 },
        { exerciseId: 'plank', sets: 3, reps: 60, restSeconds: 60 },
      ],
    },
  ];

  const createdWorkouts = [];
  for (const def of workoutDefs) {
    const w = await api('/workouts', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify(def),
    });
    createdWorkouts.push(w);
    console.log(`   ✓ ${def.name} (id=${w.id})`);
  }

  // 4. Create workout logs (12 workouts over last 5 consecutive days)
  console.log('4. Creating workout logs (12 total, 5 days streak)...');

  const today = new Date();
  // Make 5 consecutive days ending today
  const days = [];
  for (let i = 4; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }

  // Distribute 12 workouts across 5 days: 3,2,3,2,2
  const distribution = [
    { day: 0, workoutIdx: 0 }, // Day 1 - Грудь+Трицепс
    { day: 0, workoutIdx: 1 }, // Day 1 - Спина+Бицепс
    { day: 0, workoutIdx: 3 }, // Day 1 - Фулбоди
    { day: 1, workoutIdx: 2 }, // Day 2 - Ноги+Плечи
    { day: 1, workoutIdx: 0 }, // Day 2 - Грудь+Трицепс
    { day: 2, workoutIdx: 1 }, // Day 3 - Спина+Бицепс
    { day: 2, workoutIdx: 3 }, // Day 3 - Фулбоди
    { day: 2, workoutIdx: 2 }, // Day 3 - Ноги+Плечи
    { day: 3, workoutIdx: 0 }, // Day 4 - Грудь+Трицепс
    { day: 3, workoutIdx: 1 }, // Day 4 - Спина+Бицепс
    { day: 4, workoutIdx: 2 }, // Day 5 (today) - Ноги+Плечи
    { day: 4, workoutIdx: 3 }, // Day 5 (today) - Фулбоди
  ];

  for (const entry of distribution) {
    const date = days[entry.day];
    const workout = workoutDefs[entry.workoutIdx];
    const wId = createdWorkouts[entry.workoutIdx].id;

    // Build exercises with completed sets
    const logExercises = workout.exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      targetSets: ex.sets,
      targetReps: ex.reps,
      restSeconds: ex.restSeconds,
      sets: Array.from({ length: ex.sets }, (_, si) => ({
        setOrder: si + 1,
        reps: ex.reps + Math.floor(Math.random() * 3) - 1, // ± 1 rep variation
        completed: true,
      })),
    }));

    const duration = 35 + Math.floor(Math.random() * 30); // 35-65 min

    const log = await api('/workouts/logs', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({
        workoutId: wId,
        workoutName: workout.name,
        date,
        durationMinutes: duration,
        exercises: logExercises,
      }),
    });
    console.log(`   ✓ ${date} — ${workout.name} (${duration} мин)`);
  }

  // 5. Schedule upcoming workouts
  console.log('5. Scheduling upcoming workouts...');

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(today.getDate() + 2);
  const dayAfter2 = new Date(today);
  dayAfter2.setDate(today.getDate() + 3);

  const schedules = [
    { workoutId: createdWorkouts[0].id, workoutName: 'Грудь + Трицепс', date: today.toISOString().split('T')[0], time: '18:00' },
    { workoutId: createdWorkouts[1].id, workoutName: 'Спина + Бицепс', date: tomorrow.toISOString().split('T')[0], time: '10:00' },
    { workoutId: createdWorkouts[2].id, workoutName: 'Ноги + Плечи', date: dayAfter.toISOString().split('T')[0], time: '18:00' },
    { workoutId: createdWorkouts[3].id, workoutName: 'Фулбоди', date: dayAfter2.toISOString().split('T')[0], time: '09:00' },
  ];

  for (const s of schedules) {
    await api('/workouts/scheduled', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify(s),
    });
    console.log(`   ✓ ${s.date} ${s.time} — ${s.workoutName}`);
  }

  // 6. Publish workouts to community
  console.log('6. Publishing to community...');

  const publications = [
    {
      workoutId: createdWorkouts[0].id,
      title: 'Мощная тренировка на грудь и трицепс',
      description: 'Проверенная программа для набора массы верхней части тела. Жим лёжа + изоляция + суперсеты на трицепс. Делаю 2 раза в неделю, результат виден уже через месяц!',
      difficulty: 'intermediate',
    },
    {
      workoutId: createdWorkouts[3].id,
      title: 'Фулбоди для продвинутых',
      description: 'Базовые многосуставные упражнения: становая, жим, подтягивания, приседания + планка для кора. Идеально если мало времени, но хочешь проработать всё тело за одну тренировку.',
      difficulty: 'advanced',
    },
  ];

  for (const pub of publications) {
    const res = await api('/community/publish', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify(pub),
    });
    console.log(`   ✓ "${pub.title}"`);
  }

  // 7. Add water intake for last 5 days
  console.log('7. Adding water intake...');
  const waterData = [6, 8, 7, 9, 5]; // glasses per day
  for (let i = 0; i < 5; i++) {
    await api('/workouts/water', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ date: days[i], glasses: waterData[i], target_ml: 2700 }),
    });
    console.log(`   ✓ ${days[i]} — ${waterData[i]} стаканов`);
  }

  console.log('\n=== DONE! ===\n');
  console.log('Данные для входа:');
  console.log(`  Email:    ${USER.email}`);
  console.log(`  Пароль:   ${USER.password}`);
  console.log(`  Имя:      ${USER.name}`);
  console.log(`  Рост:     178 см`);
  console.log(`  Вес:      75.5 кг`);
  console.log(`  Цель:     Набрать мышечную массу`);
  console.log(`  User ID:  ${user.id}`);
  console.log(`\n  Тренировок: 12 (5 дней подряд)`);
  console.log(`  Программ:   4`);
  console.log(`  Расписание: 4 дня вперёд`);
  console.log(`  Сообщество: 2 публикации`);
}

main().catch((err) => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
