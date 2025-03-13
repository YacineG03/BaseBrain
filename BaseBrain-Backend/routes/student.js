const express = require('express');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
// const fs = require('fs').promises;
const Submission = require('../models/submission');
const Exercise = require('../models/exercise');
const { analyzeSubmissionWithAI } = require('../services/aiService');

const router = express.Router();

// Créer le dossier uploads s’il n’existe pas
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Dossier uploads créé.');
}

// Configuration de multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Dossier de destination
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname).toLowerCase()); // Ajouter l'extension du fichier
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limite de 10 Mo
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' && path.extname(file.originalname).toLowerCase() === '.pdf') {
      cb(null, true); // Accepter les fichiers PDF
    } else {
      cb(new Error('Seuls les fichiers PDF sont autorisés'), false); // Rejeter les autres fichiers
    }
  },
});

// Soumettre une réponse à un exercice (en format PDF)
router.post('/submissions', auth('student'), upload.single('file'), async (req, res) => {
  const { exercise_id } = req.body;
  const studentId = req.user.id; // ID de l'étudiant depuis le token JWT
  const filePath = req.file ? req.file.path : null;

  // Vérification des champs requis
  if (!exercise_id) {
    if (filePath) await fs.unlink(filePath).catch(console.error);
    return res.status(400).json({ error: 'L’ID de l’exercice est requis' });
  }

  if (!filePath) {
    return res.status(400).json({ error: 'Fichier de soumission requis' });
  }

  try {
    // Enregistrer la soumission dans la base de données
    const submission = await Submission.create(studentId, exercise_id, filePath);

    // Analyser la soumission avec l'IA
    const analysisResult = await analyzeSubmissionWithAI(filePath, exercise_id);

    // Mettre à jour la soumission avec les résultats de l'analyse
    await Submission.update(submission.id, {
      grade: analysisResult.overallGrade,
      feedback: JSON.stringify(analysisResult.detailedResults),
    });

    res.status(201).json({
      message: 'Soumission créée et analysée avec succès',
      submission: {
        ...submission,
        grade: analysisResult.overallGrade,
        feedback: analysisResult.detailedResults,
      },
    });
  } catch (err) {
    console.error('Erreur lors de la création de la soumission :', err);
    if (filePath) await fs.unlink(filePath).catch(console.error);
    res.status(500).json({ error: 'Erreur lors de la création de la soumission', details: err.message });
  }
});
// Fonction pour traiter la correction en arrière-plan
async function processCorrection(submissionId, filePath, exerciseId, correctionModel) {
  try {
    // Appeler l’IA pour la correction
    const result = await analyzeSubmissionWithAI(filePath, correctionModel);
    let feedback = '';

    // Vérifier si detailedResults contient une erreur
    if (result.detailedResults && result.detailedResults.error) {
      feedback = result.detailedResults.error;
    } else {
      feedback = JSON.stringify(result.detailedResults);
    }

    // Mettre à jour la soumission dans la base de données
    await Submission.update(submissionId, result.overallGrade, feedback, 'completed');

    // Ne pas supprimer le fichier
    console.log(`Correction terminée pour la soumission ${submissionId}. Le fichier ${filePath} est conservé.`);
  } catch (error) {
    console.error(`Erreur lors de la correction de la soumission ${submissionId}:`, error);
    await Submission.update(
      submissionId,
      0,
      `Erreur lors de la correction : ${error.message}. Veuillez réessayer ou contacter l’administrateur.`,
      'failed'
    );
    // Ne pas tenter de supprimer le fichier en cas d’erreur
  }
}

// Récupérer toutes les soumissions de l'étudiant connecté
router.get('/submissions', auth('student'), async (req, res) => {
  const student_id = req.user.id;

  try {
    const submissions = await Submission.findByStudent(student_id);
    res.json(submissions);
  } catch (err) {
    console.error('Erreur lors de la récupération des soumissions :', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

// Récupérer tous les exercices pour l'étudiant
router.get('/exercises', auth('student'), async (req, res) => {
  try {
    const exercises = await Exercise.findAll();
    res.json(exercises);
  } catch (err) {
    console.error('Erreur lors de la récupération des exercices :', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

// Récupérer les soumissions d’un exercice pour un professeur
router.get('/exercises/:exercise_id/submissions', auth('professor'), async (req, res) => {
  const { exercise_id } = req.params;

  if (!exercise_id || isNaN(exercise_id)) {
    return res.status(400).json({ error: 'ID de l’exercice invalide' });
  }

  try {
    const submissions = await Submission.findByExercise(exercise_id);
    res.json(submissions);
  } catch (err) {
    console.error('Erreur lors de la récupération des soumissions :', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

// Récupérer les statistiques de soumissions pour un exercice
router.get('/exercises/:exercise_id/stats', auth('professor'), async (req, res) => {
  const { exercise_id } = req.params;

  if (!exercise_id || isNaN(exercise_id)) {
    return res.status(400).json({ error: 'ID de l’exercice invalide' });
  }

  try {
    const stats = await Submission.getStatsByExercise(exercise_id);
    res.json(stats);
  } catch (err) {
    console.error('Erreur lors de la récupération des statistiques :', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

// Mettre à jour une soumission (professeur uniquement)
router.put('/submissions/:submission_id', auth('professor'), async (req, res) => {
  const { submission_id } = req.params;
  const { note, feedback } = req.body;

  if (!submission_id || isNaN(submission_id)) {
    return res.status(400).json({ error: 'ID de la soumission invalide' });
  }
  if (note === undefined || isNaN(note) || note < 0 || note > 20) {
    return res.status(400).json({ error: 'Note invalide (doit être entre 0 et 20)' });
  }
  if (!feedback || typeof feedback !== 'string') {
    return res.status(400).json({ error: 'Feedback requis et doit être une chaîne de caractères' });
  }

  try {
    const updated = await Submission.update(submission_id, note, feedback, 'completed');
    res.json(updated);
  } catch (err) {
    console.error('Erreur lors de la mise à jour de la soumission :', err);
    res.status(400).json({ error: 'Erreur lors de la mise à jour', details: err.message });
  }
});

// Vérifier le statut d’une soumission
router.get('/submissions/:id/status', auth('student'), async (req, res) => {
  const { id } = req.params;
  const student_id = req.user.id;

  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'ID de la soumission invalide' });
  }

  try {
    const submission = await Submission.findByIdAndStudent(id, student_id);
    if (!submission) {
      return res.status(404).json({ error: 'Soumission non trouvée ou accès non autorisé' });
    }
    res.json({
      id: submission.id,
      status: submission.status,
      note: submission.note,
      feedback: submission.feedback,
      submitted_at: submission.submitted_at,
    });
  } catch (err) {
    console.error('Erreur lors de la vérification du statut :', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

module.exports = router;