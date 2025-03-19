// const express = require('express');
// const dotenv = require('dotenv');
// const mysql = require('mysql2/promise');
// const multer = require('multer');
// const path = require('path');
// const passport = require('./config/passport'); // Ajout de Passport

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 3001;

// const pool = mysql.createPool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   port: process.env.DB_PORT,
// });

// pool.getConnection()
//   .then(() => console.log('Connecté à MySQL'))
//   .catch(err => console.error('Erreur de connexion à la DB:', err));

// app.use(express.json());
// app.use(passport.initialize()); // Initialisation de Passport

// // Configuration de multer
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/');
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, uniqueSuffix + path.extname(file.originalname));
//   },
// });

// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 10 * 1024 * 1024 },
//   fileFilter: (req, file, cb) => {
//     console.log('Type MIME détecté:', file.mimetype);
//     console.log('Extension du fichier:', path.extname(file.originalname));
//     if (file.mimetype === 'application/pdf' && path.extname(file.originalname).toLowerCase() === '.pdf') {
//       cb(null, true);
//     } else {
//       cb(new Error('Seuls les fichiers PDF sont acceptés'), false);
//     }
//   },
// });

// const authRoutes = require('./routes/auth');
// const professorRoutes = require('./routes/professor');
// const studentRoutes = require('./routes/student');

// app.use('/api/auth', authRoutes);
// app.use('/api/professor', professorRoutes);
// app.use('/api/student', studentRoutes);

// app.get('/', (req, res) => {
//   res.send('Bienvenue sur le backend de la plateforme d’évaluation !');
// });

// app.listen(PORT, () => {
//   console.log(`Serveur démarré sur le port ${PORT}`);
// });

const express = require('express');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const multer = require('multer');
const path = require('path');
const passport = require('./config/passport');
const cors = require('cors'); // Ajout de cors

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

pool.getConnection()
  .then(() => console.log('Connecté à MySQL'))
  .catch(err => console.error('Erreur de connexion à la DB:', err));

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3002', // Autorise uniquement le frontend sur localhost:3000
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Méthodes HTTP autorisées
  credentials: true, // Si vous utilisez des cookies ou des sessions
})); // Ajout du middleware cors
app.use(passport.initialize());

// Configuration de multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' && path.extname(file.originalname).toLowerCase() === '.pdf') {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers PDF sont acceptés'), false);
    }
  },
});

const authRoutes = require('./routes/auth');
const professorRoutes = require('./routes/professor');
const studentRoutes = require('./routes/student');

app.use('/api/auth', authRoutes);
app.use('/api/professor', professorRoutes);
app.use('/api/student', studentRoutes);

app.get('/', (req, res) => {
  res.send('Bienvenue sur le backend de la plateforme d’évaluation !');
});

// app.listen(PORT, '0.0.0.0', () => {
//   console.log(`Serveur démarré sur l'adresse 0.0.0.0 et le port ${PORT}`);
// });


app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});