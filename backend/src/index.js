require('dotenv').config({ override: true });
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const workoutsRoutes = require('./routes/workouts');
const exercisesRoutes = require('./routes/exercises');
const communityRoutes = require('./routes/community');

const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});


app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutsRoutes);
app.use('/api/exercises', exercisesRoutes);
app.use('/api/community', communityRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});


app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(` FitApp API запущен на http://0.0.0.0:${PORT}`);
  console.log(`   LAN: http://212.233.87.224:${PORT}/api`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
});
