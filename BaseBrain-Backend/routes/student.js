const express = require('express');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const crypto = require('crypto');
const Submission = require('../models/submission');
const Exercise = require('../models/exercise');
const { analyzeSubmissionWithAI } = require('../services/aiService');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');

const router = express.Router();

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
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname).toLowerCase());
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limite de 10 Mo
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' && path.extname(file.originalname).toLowerCase() === '.pdf') {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers PDF sont autorisés'), false);
    }
  },
});

// Créer le dossier uploads s’il n’existe pas (temporaire avant MinIO)
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Dossier uploads créé.');
}

// Utilitaire pour uploader un fichier sur MinIO
const uploadToS3 = async (filePath, fileName) => {
  const fileContent = await fsPromises.readFile(filePath);
  const params = {
    Bucket: process.env.MINIO_BUCKET || 'base-brain-bucket',
    Key: `submissions/${fileName}`,
    Body: fileContent,
    ContentType: 'application/pdf',
  };
  const command = new PutObjectCommand(params);
  await s3Client.send(command);
  const endpoint = process.env.MINIO_ENDPOINT || 'http://localhost:9000';
  const cleanEndpoint = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
  return `${cleanEndpoint}/${params.Bucket}/${params.Key}`;
};

// Utilitaire pour télécharger un fichier depuis MinIO
const downloadFromS3 = async (fileUrl, localPath) => {
  const urlParts = fileUrl.split('/');
  const key = urlParts.slice(-2).join('/');
  const params = {
    Bucket: process.env.MINIO_BUCKET || 'base-brain-bucket',
    Key: key,
  };
  const command = new GetObjectCommand(params);
  const response = await s3Client.send(command);
  const fileStream = response.Body;
  await new Promise((resolve, reject) => {
    fileStream.pipe(fs.createWriteStream(localPath))
      .on('error', reject)
      .on('finish', resolve);
  });
};

// Fonction pour chiffrer un fichier
const encryptFile = async (filePath) => {
  const algorithm = 'aes-256-cbc';
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const input = await fsPromises.readFile(filePath);
  const encrypted = Buffer.concat([cipher.update(input), cipher.final()]);
  const encryptedFilePath = filePath + '.enc';
  await fsPromises.writeFile(encryptedFilePath, Buffer.concat([iv, encrypted]));
  await fsPromises.unlink(filePath);
  return { encryptedFilePath, key: key.toString('hex'), iv: iv.toString('hex') };
};

// Fonction pour déchiffrer un fichier
const decryptFile = async (encryptedFilePath, keyHex, ivHex) => {
  if (!keyHex || !ivHex) {
    throw new Error('Clés de chiffrement manquantes');
  }
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(keyHex, 'hex');
  const iv = Buffer.from(ivHex.slice(0, 32), 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  const input = await fsPromises.readFile(encryptedFilePath);
  const decrypted = Buffer.concat([decipher.update(input.slice(16)), decipher.final()]);
  const decryptedFilePath = encryptedFilePath.replace('.enc', '');
  await fsPromises.writeFile(decryptedFilePath, decrypted);
  return decryptedFilePath;
};

// Fonction pour détecter le plagiat (simplifiée avec Jaccard)
const detectPlagiarism = async (filePath, exercise_id, studentId) => {
  try {
    const content = await fsPromises.readFile(filePath, 'utf-8');
    const contentSet = new Set(content.toLowerCase().split(/\s+/));

    const existingSubmissions = await Submission.findForPlagiarismCheck(exercise_id, studentId);

    let maxSimilarity = 0;
    for (const sub of existingSubmissions) {
      const otherContent = await fsPromises.readFile(sub.file_path, 'utf-8');
      const otherSet = new Set(otherContent.toLowerCase().split(/\s+/));
      const intersection = new Set([...contentSet].filter(x => otherSet.has(x)));
      const union = new Set([...contentSet, ...otherSet]);
      const similarity = intersection.size / union.size;
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }

    return maxSimilarity > 0.8;
  } catch (err) {
    console.error('Erreur lors de la détection de plagiat :', err);
    return false;
  }
};

// Fonction pour formater le feedback en une chaîne de texte
const formatFeedback = (detailedResults) => {
  if (!detailedResults || typeof detailedResults !== 'object') {
    return 'Aucun feedback détaillé disponible.';
  }

  const feedbackEntries = Object.entries(detailedResults);
  if (feedbackEntries.length === 0) {
    return 'Aucun feedback détaillé disponible.';
  }

  const formattedFeedback = feedbackEntries
    .map(([question, result], index) => {
      const questionNumber = parseInt(question.replace('question', ''), 10);

      // Si feedback est une chaîne simple
      if (typeof result.feedback === 'string') {
        return `Question ${questionNumber}: ${result.feedback}`;
      }

      // Si feedback est un objet
      if (result.feedback && typeof result.feedback === 'object') {
        let feedbackText = `Question ${questionNumber}:`;

        // Convertir les clés en minuscules pour une comparaison insensible à la casse
        const feedbackLowerCase = Object.fromEntries(
          Object.entries(result.feedback).map(([key, value]) => [key.toLowerCase(), value])
        );

        // Mapper les clés différentes vers les clés attendues
        const errors =
          feedbackLowerCase['errors'] ||
          feedbackLowerCase['erreurs'] ||
          feedbackLowerCase['erreursspecifiques'] ||
          feedbackLowerCase['erreurs spécifiques'] ||
          [];
        const impacts =
          feedbackLowerCase['impacts'] ||
          feedbackLowerCase['impact_specifique'] ||
          feedbackLowerCase['impactsspecific'] ||
          feedbackLowerCase['impact_on_resultset'] ||
          feedbackLowerCase['impacts de ces erreurs'] ||
          '';
        const suggestions =
          feedbackLowerCase['suggestions'] ||
          feedbackLowerCase['solution'] ||
          feedbackLowerCase['suggestionsprecises'] ||
          feedbackLowerCase['suggestions précises'] ||
          [];

        const hasErrors = Array.isArray(errors) && errors.length > 0;
        const hasImpacts = impacts.length > 0;
        const hasSuggestions = Array.isArray(suggestions) && suggestions.length > 0;

        if (!hasErrors && !hasImpacts && !hasSuggestions) {
          return `Question ${questionNumber}: Aucune évaluation détaillée fournie par l’IA.`;
        }

        if (hasErrors) {
          feedbackText += ` Erreurs: ${errors.join(', ')}.`;
        }
        if (hasImpacts) {
          feedbackText += ` Impacts: ${impacts}.`;
        }
        if (hasSuggestions) {
          feedbackText += ` Suggestions: ${suggestions.join(' ')}.`;
        }

        return feedbackText.trim();
      }

      // Si aucun feedback valide n'est trouvé
      return `Question ${questionNumber}: Aucune évaluation détaillée fournie par l’IA.`;
    })
    .join('\n'); // Ajout de sauts de ligne entre chaque question

  return formattedFeedback || 'Aucun feedback détaillé disponible.';
};

// Fonction pour traiter la correction en arrière-plan
const processCorrection = async (submissionId, filePath, exerciseId, correctionModel) => {
  const tempFilePath = path.join('uploads', `temp_${Date.now()}_${Math.round(Math.random() * 1e9)}.pdf.enc`);
  let decryptedFilePath;
  try {
    // Récupérer la soumission pour obtenir les clés de chiffrement
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      throw new Error('Soumission non trouvée');
    }
    if (!submission.encryption_key || !submission.encryption_iv) {
      throw new Error('Clés de chiffrement manquantes dans la base de données');
    }

    // Télécharger le fichier depuis MinIO
    await downloadFromS3(filePath, tempFilePath);
    console.log(`Fichier téléchargé dans : ${tempFilePath}`);

    // Déchiffrer le fichier
    decryptedFilePath = await decryptFile(tempFilePath, submission.encryption_key, submission.encryption_iv);
    console.log(`Fichier déchiffré dans : ${decryptedFilePath}`);

    // Analyser la soumission
    const result = await analyzeSubmissionWithAI(decryptedFilePath, exerciseId);
    console.log('Résultat de analyzeSubmissionWithAI:', result); // Log pour débogage
    let feedback = result.detailedResults && result.detailedResults.error
      ? result.detailedResults.error
      : formatFeedback(result.detailedResults);

    await Submission.update(submissionId, {
      note: result.overallGrade,
      feedback: feedback,
      status: 'completed',
    });
    console.log(`Correction terminée pour la soumission ${submissionId}`);
  } catch (error) {
    console.error(`Erreur lors de la correction de la soumission ${submissionId}:`, error);
    await Submission.update(submissionId, {
      note: 0,
      feedback: `Erreur lors de la correction : ${error.message}`,
      status: 'failed',
    });
  } finally {
    // Supprimer les fichiers temporaires
    if (fs.existsSync(tempFilePath)) {
      await fsPromises.unlink(tempFilePath).catch(console.error);
    }
    if (decryptedFilePath && fs.existsSync(decryptedFilePath)) {
      await fsPromises.unlink(decryptedFilePath).catch(console.error);
    }
  }
};

// Soumettre une réponse à un exercice (en format PDF)
router.post('/submissions', auth('student'), upload.single('file'), async (req, res) => {
  const { exercise_id } = req.body;
  const studentId = req.user.id;
  const filePath = req.file ? req.file.path : null;

  if (!exercise_id) {
    if (filePath) await fsPromises.unlink(filePath).catch(console.error);
    return res.status(400).json({ error: 'L’ID de l’exercice est requis' });
  }

  if (!filePath) {
    return res.status(400).json({ error: 'Fichier de soumission requis' });
  }

  try {
    const exercise = await Exercise.findById(exercise_id);
    if (!exercise) {
      await fsPromises.unlink(filePath);
      return res.status(404).json({ error: 'Exercice non trouvé' });
    }

    const { encryptedFilePath, key, iv } = await encryptFile(filePath);

    const isPlagiarized = await detectPlagiarism(encryptedFilePath, exercise_id, studentId);
    if (isPlagiarized) {
      await fsPromises.unlink(encryptedFilePath);
      return res.status(400).json({ error: 'Plagiat détecté dans la soumission' });
    }

    const fileName = path.basename(encryptedFilePath);
    const s3Url = await uploadToS3(encryptedFilePath, fileName);
    await fsPromises.unlink(encryptedFilePath);

    const submission = await Submission.create(studentId, exercise_id, s3Url, key, iv);

    processCorrection(submission.id, s3Url, exercise_id, exercise.correction_model || 'default').catch(console.error);

    res.status(201).json({
      message: 'Soumission créée et correction en cours',
      submission: { ...submission, encryption_key: key, encryption_iv: iv },
    });
  } catch (err) {
    console.error('Erreur lors de la création de la soumission :', err);
    if (filePath) await fsPromises.unlink(filePath).catch(console.error);
    res.status(500).json({ error: 'Erreur lors de la création de la soumission', details: err.message });
  }
});

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

// Récupérer une soumission spécifique
router.get('/submissions/:submissionId', auth('student'), async (req, res) => {
  const { submissionId } = req.params;
  const student_id = req.user.id;

  if (!submissionId || isNaN(submissionId)) {
    return res.status(400).json({ error: 'ID de la soumission invalide' });
  }

  try {
    const submission = await Submission.findByIdAndStudent(submissionId, student_id);
    if (!submission) {
      return res.status(404).json({ error: 'Soumission non trouvée ou accès non autorisé' });
    }
    res.json({
      id: submission.id,
      exercise_id: submission.exercise_id,
      file_path: submission.file_path,
      note: submission.note,
      feedback: submission.feedback,
      status: submission.status,
      submitted_at: submission.submitted_at,
    });
  } catch (err) {
    console.error('Erreur lors de la récupération de la soumission :', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

// Récupérer tous les exercices pour l'étudiant
router.get('/exercises', auth('student'), async (req, res) => {
  try {
    const studentId = req.user.id;
    const { title, created_at } = req.query;
    const filters = {};
    if (title) filters.title = title;
    if (created_at) filters.created_at = created_at;

    const exercises = await Exercise.findForStudent(studentId, filters);
    res.json(exercises);
  } catch (err) {
    console.error('Erreur lors de la récupération des exercices :', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

// Suivi des performances
router.get('/performance', auth('student'), async (req, res) => {
  try {
    const studentId = req.user.id;

    // Étape 1 : Récupérer les soumissions de l’étudiant avec détails
    const studentSubmissions = await Submission.findByStudentWithDetails(studentId);

    // Étape 2 : Calculer la moyenne de la classe pour chaque exercice
    const exerciseIds = [...new Set(studentSubmissions.map(sub => sub.exercise_id))];
    const classAverages = {};

    for (const exerciseId of exerciseIds) {
      const classAverage = await Submission.getClassAverageByExercise(exerciseId);
      classAverages[exerciseId] = classAverage;
    }

    // Étape 3 : Formatter les données pour le graphique d’évolution
    const performanceData = {
      labels: studentSubmissions.map(sub => sub.submitted_at.toISOString().split('T')[0]),
      notes: studentSubmissions.map(sub => parseFloat(sub.note).toFixed(2)),
      exercises: studentSubmissions.map(sub => sub.exercise_title),
      classAverages: studentSubmissions.map(sub => classAverages[sub.exercise_id] || null),
    };

    // Étape 4 : Analyser les performances passées
    const pastPerformance = {
      totalSubmissions: studentSubmissions.length,
      highestNote: studentSubmissions.length
        ? Math.max(...studentSubmissions.map(sub => parseFloat(sub.note)))
        : null,
      lowestNote: studentSubmissions.length
        ? Math.min(...studentSubmissions.map(sub => parseFloat(sub.note)))
        : null,
      averageNote: studentSubmissions.length
        ? parseFloat((studentSubmissions.reduce((sum, sub) => sum + parseFloat(sub.note), 0) / studentSubmissions.length).toFixed(2))
        : null,
    };

    // Étape 5 : Calculer la progression dans le temps
    const progression = [];
    for (let i = 1; i < studentSubmissions.length; i++) {
      const previousNote = parseFloat(studentSubmissions[i - 1].note);
      const currentNote = parseFloat(studentSubmissions[i].note);
      const difference = parseFloat((currentNote - previousNote).toFixed(2));
      progression.push({
        from: studentSubmissions[i - 1].submitted_at.toISOString().split('T')[0],
        to: studentSubmissions[i].submitted_at.toISOString().split('T')[0],
        fromExercise: studentSubmissions[i - 1].exercise_title,
        toExercise: studentSubmissions[i].exercise_title,
        difference: difference,
        trend: difference > 0 ? 'up' : difference < 0 ? 'down' : 'stable',
      });
    }

    res.status(200).json({
      message: 'Données de performance récupérées avec succès',
      data: {
        performance: performanceData,
        pastPerformance,
        progression,
      },
    });
  } catch (err) {
    console.error('Erreur lors de la récupération des données de performance :', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des données de performance', details: err.message });
  }
});

module.exports = router;