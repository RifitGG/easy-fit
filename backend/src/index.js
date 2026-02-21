require('dotenv').config({ override: true });
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const workoutsRoutes = require('./routes/workouts');
const exercisesRoutes = require('./routes/exercises');

const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});


app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutsRoutes);
app.use('/api/exercises', exercisesRoutes);

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
  console.log(`   LAN: http://192.168.0.103:${PORT}/api`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
});
