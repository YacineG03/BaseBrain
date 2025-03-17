const express = require('express');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const multer = require('multer');
const path = require('path');


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

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

// Configuration de multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Conserver l'extension .pdf
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limite de 10 Mo
  fileFilter: (req, file, cb) => {
    console.log('Type MIME détecté:', file.mimetype);
    console.log('Extension du fichier:', path.extname(file.originalname));
    // Vérifier strictement le type MIME et l'extension
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

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});