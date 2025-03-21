const express = require('express');
const auth = require('../middleware/auth');
const Exercise = require('../models/exercise');
const Correction = require('../models/correction');
const Submission = require('../models/submission');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3'); // Compatible avec MinIO
const router = express.Router();
const { updateCorrectionModel } = require('../services/correctionService');
const pool = require('../config/database');

// Configuration de MinIO avec l'API S3
const s3Client = new S3Client({
  region: 'us-east-1',
  endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  },
});

// Configuration de multer pour stockage temporaire avant upload MinIO
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname).toLowerCase());
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' && path.extname(file.originalname).toLowerCase() === '.pdf') {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers PDF sont autorisés'), false);
    }
  },
});

// Créer le dossier uploads s’il n’existe pas
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Dossier uploads créé.');
}

// Utilitaire pour uploader un fichier sur MinIO
const uploadToS3 = async (filePath, fileName) => {
  const fileContent = fs.readFileSync(filePath);
  const params = {
    Bucket: process.env.MINIO_BUCKET || 'base-brain-bucket',
    Key: fileName,
    Body: fileContent,
    ContentType: 'application/pdf',
  };
  const command = new PutObjectCommand(params);
  await s3Client.send(command);
  const endpoint = process.env.MINIO_ENDPOINT || 'http://localhost:9000';
  const cleanEndpoint = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
  return `${cleanEndpoint}/${params.Bucket}/${fileName}`;
};

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
};

// Déposer un exercice avec un fichier PDF ou texte et une description
router.post('/exercises', auth('professor'), upload.single('file'), async (req, res) => {
  const { title, description, textContent } = req.body;
  const professor_id = req.user.id;
  const filePath = req.file ? req.file.path : null;
  let content = null;

  // Validations
  if (!title || !description) {
    if (filePath) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Erreur lors de la suppression du fichier temporaire :', err);
      }
    }
    return res.status(400).json({ error: 'Titre et description sont requis' });
  }
  if (!filePath && !textContent) {
    return res.status(400).json({ error: 'Un fichier PDF ou un contenu texte est requis' });
  }

  try {
    if (filePath) {
      const fileName = path.basename(filePath);
      content = await uploadToS3(filePath, `exercises/${fileName}`);
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Erreur lors de la suppression du fichier temporaire après upload :', err);
      }
    } else {
      content = textContent;
    }

    const exercise = await Exercise.create(professor_id, title, description, content);
    res.status(201).json({ message: 'Exercice créé avec succès', exercise });
  } catch (err) {
    console.error('Erreur lors de la création de l’exercice :', err);
    if (filePath) {
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupErr) {
        console.error('Erreur lors de la suppression du fichier temporaire en cas d’erreur :', cleanupErr);
      }
    }
    res.status(500).json({ error: 'Erreur lors de la création de l’exercice', details: err.message });
  }
});

// Lister tous les exercices du professeur
router.get('/exercises', auth('professor'), async (req, res) => {
  const professor_id = req.user.id;
  const { title, created_at, page = 1, limit = 10 } = req.query;

  try {
    if (!professor_id || isNaN(professor_id)) {
      return res.status(400).json({ error: 'ID du professeur invalide' });
    }

    const filters = {};
    if (title) filters.title = title;
    if (created_at) filters.created_at = created_at;

    const offset = (page - 1) * limit;
    const exercises = await Exercise.findByProfessorId(professor_id, filters, { page, limit, offset });

    if (exercises.length === 0) {
      return res.status(404).json({ error: 'Aucun exercice disponible pour ce professeur' });
    }

    const totalExercises = await Exercise.countByProfessorId(professor_id, filters);
    const totalPages = Math.ceil(totalExercises / limit);

    res.json({
      exercises,
      pagination: { page: parseInt(page), limit: parseInt(limit), totalExercises, totalPages },
    });
  } catch (err) {
    console.error('Erreur lors de la récupération des exercices :', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des exercices', details: err.message });
  }
});

// Ajouter une ou plusieurs corrections
router.post('/corrections', auth('professor'), upload.array('files', 5), handleMulterError, async (req, res) => {
  const { exercise_id, title, description, models: modelsRaw } = req.body; // models: [{"name":"deepseek-coder", "config":{...}}, ...]
  const files = req.files;
  let minioUrls = [];

  if (!exercise_id || !title || !description) {
    if (files) files.forEach(file => fs.existsSync(file.path) && fs.unlinkSync(file.path));
    return res.status(400).json({ error: 'Exercice, titre et description sont requis' });
  }
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'Au moins un fichier de correction est requis' });
  }

  // Parser models si fourni, sinon utiliser un modèle par défaut
  let models = [];
  if (modelsRaw) {
    try {
      models = typeof modelsRaw === 'string' ? JSON.parse(modelsRaw) : modelsRaw;
      if (!Array.isArray(models) || models.length !== files.length) {
        if (files) files.forEach(file => fs.existsSync(file.path) && fs.unlinkSync(file.path));
        return res.status(400).json({ error: 'Le champ models doit être un tableau avec un modèle par fichier' });
      }
    } catch (err) {
      if (files) files.forEach(file => fs.existsSync(file.path) && fs.unlinkSync(file.path));
      return res.status(400).json({ error: 'Le champ models doit être un JSON valide' });
    }
  } else {
    // Si models n'est pas fourni, utiliser un modèle par défaut pour chaque fichier
    models = files.map(() => ({ name: 'default-model', config: {} }));
  }

  try {
    const [exercise] = await pool.execute('SELECT id FROM exercises WHERE id = ? AND professor_id = ?', [exercise_id, req.user.id]);
    if (!exercise || exercise.length === 0) {
      if (files) files.forEach(file => fs.existsSync(file.path) && fs.unlinkSync(file.path));
      return res.status(404).json({ error: 'Exercice non trouvé ou non autorisé' });
    }

    for (const file of files) {
      const fileName = path.basename(file.path);
      const minioUrl = await uploadToS3(file.path, `corrections/${fileName}`);
      minioUrls.push(minioUrl);
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    }

    const correction = await Correction.create(exercise_id, title, description, minioUrls);
    // Insérer les modèles dans correction_models
    for (let i = 0; i < minioUrls.length; i++) {
      await pool.execute(
        'INSERT INTO correction_models (correction_id, file_url, model_name, description, configuration) VALUES (?, ?, ?, ?, ?)',
        [
          correction.id,
          minioUrls[i],
          models[i]?.name || null, // Permettre NULL si non fourni
          models[i]?.description || null,
          models[i]?.config ? JSON.stringify(models[i].config) : null,
        ]
      );
    }
    await updateCorrectionModel(correction.id, minioUrls);
    res.status(201).json({ message: 'Correction créée avec succès', correction });
  } catch (err) {
    console.error('Erreur lors de la création de la correction :', err);
    if (files) files.forEach(file => fs.existsSync(file.path) && fs.unlinkSync(file.path));
    res.status(500).json({ error: 'Erreur lors de la création de la correction', details: err.message });
  }
});

// Lister les corrections d’un exercice du professeur
router.get('/corrections/exercise/:exercise_id', auth('professor'), async (req, res) => {
  const { exercise_id } = req.params;
  const { title, created_at, page = 1, limit = 10 } = req.query;
  const professor_id = req.user.id;

  try {
    if (!exercise_id || isNaN(exercise_id)) {
      return res.status(400).json({ error: 'ID de l\'exercice invalide' });
    }

    const [exercise] = await pool.execute('SELECT id FROM exercises WHERE id = ? AND professor_id = ?', [exercise_id, professor_id]);
    if (!exercise || exercise.length === 0) {
      return res.status(404).json({ error: 'Exercice non trouvé ou non autorisé' });
    }

    const filters = {};
    if (title) filters.title = title;
    if (created_at && !/^\d{4}-\d{2}-\d{2}$/.test(created_at)) {
      return res.status(400).json({ error: 'Le format de created_at doit être YYYY-MM-DD' });
    }
    if (created_at) filters.created_at = created_at;

    const offset = (page - 1) * limit;
    const corrections = await Correction.findByExerciseId(exercise_id, filters, { page, limit, offset });

    if (corrections.length === 0) {
      return res.status(404).json({ error: 'Aucune correction disponible pour cet exercice avec ces filtres' });
    }

    const totalCorrections = await Correction.countByExerciseId(exercise_id, filters);
    const totalPages = Math.ceil(totalCorrections / limit);

    // Ajouter les modèles associés
    for (const correction of corrections) {
      const [models] = await pool.execute('SELECT * FROM correction_models WHERE correction_id = ?', [correction.id]);
      correction.models = models;
    }

    res.json({
      corrections,
      pagination: { page: parseInt(page), limit: parseInt(limit), totalCorrections, totalPages },
    });
  } catch (err) {
    console.error('Erreur lors de la récupération des corrections :', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des corrections', details: err.message });
  }
});

// Consulter une soumission
router.get('/submissions/:submissionId', auth('professor'), async (req, res) => {
  const { submissionId } = req.params;
  const professor_id = req.user.id;

  try {
    if (!submissionId || isNaN(submissionId)) {
      return res.status(400).json({ error: 'ID de la soumission invalide' });
    }

    const submission = await Submission.findById(submissionId, professor_id);
    if (!submission) {
      return res.status(404).json({ error: 'Soumission non trouvée ou non autorisée' });
    }

    res.status(200).json(submission);
  } catch (err) {
    console.error('Erreur lors de la récupération de la soumission :', err);
    res.status(500).json({ error: 'Erreur lors de la récupération de la soumission', details: err.message });
  }
});

// Lister toutes les soumissions pour un exercice spécifique
router.get('/submissions/exercise/:exerciseId', auth('professor'), async (req, res) => {
  const { exerciseId } = req.params;
  const { status, submitted_at, page = 1, limit = 10 } = req.query;
  const professor_id = req.user.id;

  try {
    if (!exerciseId || isNaN(exerciseId)) {
      return res.status(400).json({ error: 'ID de l\'exercice invalide' });
    }

    const filters = {};
    if (status) filters.status = status;
    if (submitted_at) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(submitted_at)) {
        return res.status(400).json({ error: 'Le format de submitted_at doit être YYYY-MM-DD' });
      }
      filters.submitted_at = submitted_at;
    }

    const offset = (page - 1) * limit;
    const submissions = await Submission.findByExerciseId(exerciseId, professor_id, filters, { page, limit, offset });

    if (submissions.length === 0) {
      return res.status(404).json({ error: 'Aucune soumission trouvée pour cet exercice avec ces filtres' });
    }

    const totalSubmissions = await Submission.countByExerciseId(exerciseId, professor_id, filters);
    const totalPages = Math.ceil(totalSubmissions / limit);

    res.status(200).json({
      submissions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalSubmissions,
        totalPages,
      },
    });
  } catch (err) {
    console.error('Erreur lors de la récupération des soumissions pour l\'exercice :', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des soumissions', details: err.message });
  }
});

// Ajuster la note et le feedback d’une soumission
router.put('/submissions/:submissionId', auth('professor'), async (req, res) => {
  const { submissionId } = req.params;
  const { note, feedback, status } = req.body;
  const professor_id = req.user.id;

  try {
    if (!submissionId || isNaN(submissionId)) {
      return res.status(400).json({ error: 'ID de la soumission invalide' });
    }

    const validStatuses = ['pending', 'evaluated', 'adjusted'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Le statut doit être l'un des suivants : ${validStatuses.join(', ')}` });
    }

    const submission = await Submission.findById(submissionId, professor_id);
    if (!submission) {
      return res.status(404).json({ error: 'Soumission non trouvée ou non autorisée' });
    }

    let updatedNote = submission.note;
    let updatedFeedback = submission.feedback;

    if (note !== undefined) {
      const parsedNote = parseFloat(note);
      if (isNaN(parsedNote) || parsedNote < 0 || parsedNote > 20) {
        return res.status(400).json({ error: 'La note doit être un nombre entre 0 et 20' });
      }
      updatedNote = parsedNote;
    }

    if (feedback !== undefined) {
      if (typeof feedback === 'string' && feedback.trim()) {
        updatedFeedback = feedback;
      } else if (typeof feedback === 'object') {
        updatedFeedback = JSON.stringify(feedback);
      }
    }

    const noteHasChanged = (submission.note === null && updatedNote !== null) || 
                          (submission.note !== null && parseFloat(updatedNote.toFixed(2)) !== parseFloat(submission.note.toFixed(2)));
    const feedbackHasChanged = updatedFeedback !== (submission.feedback || '');
    const hasChanges = noteHasChanged || feedbackHasChanged;

    if (!hasChanges && status === undefined) {
      res.status(200).json({ message: 'Aucune modification effectuée', submission });
      return;
    }

    const currentStatus = submission.status || 'pending';
    await Submission.update(submissionId, {
      note: updatedNote,
      feedback: updatedFeedback,
      status: hasChanges ? 'adjusted' : (status || currentStatus),
    });

    const updatedSubmission = await Submission.findById(submissionId, professor_id);
    res.status(200).json({ message: 'Soumission mise à jour avec succès', submission: updatedSubmission });
  } catch (err) {
    console.error('Erreur lors de la mise à jour de la soumission :', err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la soumission', details: err.message });
  }
});

// Mettre à jour une soumission spécifique pour un exercice et un étudiant
router.put('/submissions/exercise/:exerciseId', auth('professor'), async (req, res) => {
  const { exerciseId } = req.params;
  const { studentId, note, feedback, status } = req.body;
  const professor_id = req.user.id;

  try {
    if (!exerciseId || isNaN(exerciseId)) {
      return res.status(400).json({ error: 'ID de l\'exercice invalide' });
    }

    if (!studentId || isNaN(studentId)) {
      return res.status(400).json({ error: 'ID de l\'étudiant invalide' });
    }

    const validStatuses = ['pending', 'evaluated', 'adjusted'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Le statut doit être l'un des suivants : ${validStatuses.join(', ')}` });
    }

    const submission = await Submission.findByExerciseAndStudent(exerciseId, studentId, professor_id);
    if (!submission) {
      return res.status(404).json({ error: 'Soumission non trouvée ou non autorisée' });
    }

    let updatedNote = submission.note;
    let updatedFeedback = submission.feedback;

    if (note !== undefined) {
      const parsedNote = parseFloat(note);
      if (isNaN(parsedNote) || parsedNote < 0 || parsedNote > 20) {
        return res.status(400).json({ error: 'La note doit être un nombre entre 0 et 20' });
      }
      updatedNote = parsedNote;
    }

    if (feedback !== undefined) {
      if (typeof feedback === 'string' && feedback.trim()) {
        updatedFeedback = feedback;
      } else if (typeof feedback === 'object') {
        updatedFeedback = JSON.stringify(feedback);
      }
    }

    const noteHasChanged = (submission.note === null && updatedNote !== null) || 
                          (submission.note !== null && parseFloat(updatedNote.toFixed(2)) !== parseFloat(submission.note.toFixed(2)));
    const feedbackHasChanged = updatedFeedback !== (submission.feedback || '');
    const hasChanges = noteHasChanged || feedbackHasChanged;

    if (!hasChanges && status === undefined) {
      res.status(200).json({ message: 'Aucune modification effectuée', submission });
      return;
    }

    const currentStatus = submission.status || 'pending';
    await Submission.update(submission.id, {
      note: updatedNote,
      feedback: updatedFeedback,
      status: hasChanges ? 'adjusted' : (status || currentStatus),
    });

    const updatedSubmission = await Submission.findById(submission.id, professor_id);
    res.status(200).json({ message: 'Soumission mise à jour avec succès', submission: updatedSubmission });
  } catch (err) {
    console.error('Erreur lors de la mise à jour de la soumission :', err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la soumission', details: err.message });
  }
});

// Tableau de bord des performances des étudiants
router.get('/dashboard/student-performance', auth('professor'), async (req, res) => {
  try {
    const professor_id = req.user.id;
    const { exerciseId, studentId, startDate, endDate, status } = req.query;

    let query = `
      SELECT s.id, s.student_id, s.exercise_id, s.note, s.feedback, s.status, s.submitted_at,
             u.email AS student_email, e.title AS exercise_title
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      JOIN exercises e ON s.exercise_id = e.id
      WHERE e.professor_id = ?
    `;
    const queryParams = [professor_id];

    if (exerciseId) {
      query += ' AND s.exercise_id = ?';
      queryParams.push(exerciseId);
    }
    if (studentId) {
      query += ' AND s.student_id = ?';
      queryParams.push(studentId);
    }
    if (startDate) {
      query += ' AND s.submitted_at >= ?';
      queryParams.push(startDate);
    }
    if (endDate) {
      query += ' AND s.submitted_at <= ?';
      queryParams.push(endDate);
    }
    if (status) {
      query += ' AND s.status = ?';
      queryParams.push(status);
    }

    const [submissions] = await pool.execute(query, queryParams);
    const validSubmissions = submissions.filter(sub => sub.note !== null && !isNaN(parseFloat(sub.note)));

    const totalSubmissions = submissions.length;
    const averageNote = validSubmissions.length
      ? parseFloat((validSubmissions.reduce((sum, sub) => sum + parseFloat(sub.note), 0) / validSubmissions.length).toFixed(2))
      : null;
    const passingSubmissions = validSubmissions.filter(sub => parseFloat(sub.note) >= 10).length;
    const passingRate = totalSubmissions ? parseFloat((passingSubmissions / totalSubmissions) * 100).toFixed(2) : 0;

    const submissionsByStudent = submissions.reduce((acc, sub) => {
      if (!acc[sub.student_id]) {
        acc[sub.student_id] = {
          student_id: sub.student_id,
          student_name: sub.student_name,
          submissions: [],
          averageNote: 0,
          isStruggling: false,
        };
      }
      if (sub.note !== null && !isNaN(parseFloat(sub.note))) {
        acc[sub.student_id].submissions.push({
          submission_id: sub.id,
          exercise_id: sub.exercise_id,
          exercise_title: sub.exercise_title,
          note: parseFloat(sub.note),
          feedback: sub.feedback,
          status: sub.status,
          submitted_at: sub.submitted_at,
        });
      }
      return acc;
    }, {});

    const studentStats = Object.values(submissionsByStudent).map(student => {
      const studentSubmissions = student.submissions;
      const validStudentSubmissions = studentSubmissions.filter(sub => sub.note !== null);
      const avgNote = validStudentSubmissions.length
        ? parseFloat((validStudentSubmissions.reduce((sum, sub) => sum + sub.note, 0) / validStudentSubmissions.length).toFixed(2))
        : null;
      const lowNotesCount = validStudentSubmissions.filter(sub => sub.note < 10).length;
      return {
        student_id: student.student_id,
        student_name: student.student_name,
        averageNote: avgNote,
        submissions: studentSubmissions,
        isStruggling: lowNotesCount >= 2,
      };
    });

    const dashboardData = {
      globalStats: { totalSubmissions, averageNote, passingRate },
      studentStats,
    };

    res.status(200).json({ message: 'Données du tableau de bord récupérées avec succès', data: dashboardData });
  } catch (err) {
    console.error('Erreur lors de la récupération des données du tableau de bord :', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des données du tableau de bord', details: err.message });
  }
});

// Statistiques sur les soumissions, taux de réussite, questions mal comprises et tendances d’apprentissage
router.get('/dashboard/statistics', auth('professor'), async (req, res) => {
  try {
    const professor_id = req.user.id;
    const { exerciseId, startDate, endDate } = req.query;

    let query = `
      SELECT s.id, s.exercise_id, s.student_id, s.note, s.feedback, s.submitted_at,
             e.title AS exercise_title
      FROM submissions s
      JOIN exercises e ON s.exercise_id = e.id
      WHERE e.professor_id = ?
    `;
    const queryParams = [professor_id];

    if (exerciseId) {
      query += ' AND s.exercise_id = ?';
      queryParams.push(exerciseId);
    }
    if (startDate) {
      query += ' AND s.submitted_at >= ?';
      queryParams.push(startDate);
    }
    if (endDate) {
      query += ' AND s.submitted_at <= ?';
      queryParams.push(endDate);
    }

    const [submissions] = await pool.execute(query, queryParams);
    const validSubmissions = submissions.filter(sub => sub.note !== null && !isNaN(parseFloat(sub.note)));

    const totalSubmissions = submissions.length;
    const passingSubmissions = validSubmissions.filter(sub => parseFloat(sub.note) >= 10).length;
    const successRate = totalSubmissions > 0 ? parseFloat((passingSubmissions / totalSubmissions) * 100).toFixed(2) : 0;
    const averageNote = validSubmissions.length > 0
      ? parseFloat((validSubmissions.reduce((sum, sub) => sum + parseFloat(sub.note), 0) / validSubmissions.length).toFixed(2))
      : null;

    const poorlyUnderstoodQuestions = {};
    validSubmissions.forEach(sub => {
      if (sub.feedback) {
        const lines = sub.feedback.split('\n');
        lines.forEach(line => {
          const match = line.match(/Question (\d+): (.+)/);
          if (match) {
            const questionNum = `question${match[1]}`;
            const feedbackText = match[2].trim();
            const gradeMatch = feedbackText.match(/(\d+)/);
            const grade = gradeMatch ? parseFloat(gradeMatch[1]) : null;
            if (grade !== null && grade < 10) {
              if (!poorlyUnderstoodQuestions[questionNum]) {
                poorlyUnderstoodQuestions[questionNum] = {
                  count: 0,
                  averageGrade: 0,
                  feedbackExamples: [],
                };
              }
              poorlyUnderstoodQuestions[questionNum].count += 1;
              poorlyUnderstoodQuestions[questionNum].averageGrade = (
                (poorlyUnderstoodQuestions[questionNum].averageGrade * (poorlyUnderstoodQuestions[questionNum].count - 1)) + grade
              ) / poorlyUnderstoodQuestions[questionNum].count;
              poorlyUnderstoodQuestions[questionNum].feedbackExamples.push(feedbackText);
            }
          }
        });
      }
    });

    const sortedPoorlyUnderstood = Object.entries(poorlyUnderstoodQuestions)
      .sort(([, a], [, b]) => b.count - a.count)
      .map(([question, stats]) => ({
        question,
        count: stats.count,
        averageGrade: parseFloat(stats.averageGrade.toFixed(2)),
        feedbackExamples: stats.feedbackExamples.slice(0, 3),
      }));

    const learningTrends = {};
    validSubmissions.forEach(sub => {
      const week = sub.submitted_at.toISOString().substring(0, 10);
      if (!learningTrends[week]) {
        learningTrends[week] = { totalNotes: 0, count: 0, averageNote: 0 };
      }
      learningTrends[week].totalNotes += parseFloat(sub.note);
      learningTrends[week].count += 1;
      learningTrends[week].averageNote = parseFloat((learningTrends[week].totalNotes / learningTrends[week].count).toFixed(2));
    });

    const sortedTrends = Object.entries(learningTrends)
      .sort(([, a], [, b]) => new Date(a.week) - new Date(b.week))
      .map(([week, stats]) => ({ week, averageNote: stats.averageNote }));

    const statisticsData = {
      totalSubmissions,
      successRate,
      averageNote,
      poorlyUnderstoodQuestions: sortedPoorlyUnderstood,
      learningTrends: sortedTrends,
    };

    res.status(200).json({ message: 'Statistiques récupérées avec succès', data: statisticsData });
  } catch (err) {
    console.error('Erreur lors de la récupération des statistiques :', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques', details: err.message });
  }
});

module.exports = router;