// const express = require('express');
// const auth = require('../middleware/auth');
// const Exercise = require('../models/exercise');
// const Correction = require('../models/correction');  // Modèle de la correction
// const multer = require('multer');
// const path = require('path');
// const router = express.Router();


// // Configuration de multer
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/');  // Dossier de destination
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, uniqueSuffix + path.extname(file.originalname));  // Ajouter l'extension du fichier
//   },
// });


// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 10 * 1024 * 1024 },  // Limite de 10 Mo
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype === 'application/pdf' && path.extname(file.originalname).toLowerCase() === '.pdf') {
//       cb(null, true);  // Accepter les fichiers PDF
//     } else {
//       cb(new Error('Seuls les fichiers PDF sont autorisés'), false);  // Rejeter les autres fichiers
//     }
//   },
// });


// // Déposer un exercice avec un fichier PDF et une description
// router.post('/exercises', auth('professor'), upload.single('file'), async (req, res) => {
//   const { title, description } = req.body;
//   const professor_id = req.user.id;
//   const filePath = req.file ? req.file.path : null;


//   if (!filePath) return res.status(400).json({ error: 'Fichier PDF requis' });


//   try {
//     const exercise = await Exercise.create(professor_id, title, description, filePath);  // Sauvegarder l'exercice
//     res.status(201).json({ message: 'Exercice créé', exercise });
//   } catch (err) {
//     res.status(500).json({ error: 'Erreur lors de la création de l\'exercice' });
//   }
// });


// // Lister tous les exercices
// router.get('/exercises', auth('professor'), async (req, res) => {
//   try {
//     const exercises = await Exercise.findAll();
//     if (exercises.length === 0) {
//       return res.status(404).json({ error: 'Aucun exercice disponible' });
//     }

//     res.json(exercises);
//   } catch (err) {
//     res.status(500).json({ error: 'Erreur lors de la récupération des exercices' });
//   }
// });


// // Lister un exercice par titre
// router.get('/exercises/search', auth('professor'), async (req, res) => {
//   const { title } = req.query;
//   if (!title) {
//     return res.status(400).json({ error: 'Titre requis pour la recherche' });
//   }


//   try {
//     const exercises = await Exercise.findByTitle(title);
//     if (exercises.length === 0) {
//       return res.status(404).json({ error: 'Aucun exercice trouvé' });
//     }
//     res.json(exercises);
//   } catch (err) {
//     res.status(500).json({ error: 'Erreur lors de la recherche de l\'exercice' });
//   }
// });


// router.post('/corrections', auth('professor'), upload.single('file'), async (req, res) => {
//   const { exercise_id, title, description } = req.body; // Récupération des champs
//   const filePath = req.file ? req.file.path : null;


//   // Vérification des champs requis
//   if (!exercise_id || !title || !description) {
//     return res.status(400).json({ error: 'Exercice et texte de correction requis' });
//   }


//   // Vérification si un fichier est présent
//   if (!filePath) {
//     return res.status(400).json({ error: 'Fichier de correction requis' });
//   }


//   try {
//     // Enregistrer la correction dans la base de données
//     const correction = await Correction.create(exercise_id, title, description, filePath,);
//     res.status(201).json({ message: 'Correction créée avec succès', correction });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Erreur lors de la création de la correction' });
//   }
// });


// // Lister toutes les corrections
// router.get('/corrections', auth('professor'), async (req, res) => {
//   try {
//     const corrections = await Correction.findAll();


//     // Vérifier si des corrections existent
//     if (corrections.length === 0) {
//       return res.status(404).json({ error: 'Aucune correction disponible' });
//     }


//     res.json(corrections);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Erreur lors de la récupération des corrections' });
//   }
// });




// // Lister une correction par exercice
// router.get('/corrections/exercise/:exercise_id', auth('professor'), async (req, res) => {
//   const { exercise_id } = req.params;
//   const { title, created_at } = req.query;  // Récupérer les filtres optionnels


//   try {
//     // Appliquer des filtres en fonction des paramètres de la requête
//     const filters = {};
//     if (title) filters.title = title;  // Si un titre est passé, l'ajouter aux filtres
//     if (created_at) filters.created_at = created_at;  // Si une date de création est passée, l'ajouter aux filtres


//     // Récupérer les corrections en appliquant les filtres
//     const corrections = await Correction.findByExerciseId(exercise_id, filters);


//     // Vérifier si des corrections existent
//     if (corrections.length === 0) {
//       return res.status(404).json({ error: 'Aucune correction disponible pour cet exercice avec ces filtres' });
//     }


//     res.json(corrections);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Erreur lors de la récupération des corrections' });
//   }
// });




// module.exports = router;

const express = require('express');
const auth = require('../middleware/auth');
const Exercise = require('../models/exercise');
const Correction = require('../models/correction');
const multer = require('multer');
const path = require('path');
// const fs = require('fs').promises;
const fs = require('fs');
const router = express.Router();
const { updateCorrectionModel } = require('../services/correctionService'); // Importer le service

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

// Déposer un exercice avec un fichier PDF et une description
router.post('/exercises', auth('professor'), upload.single('file'), async (req, res) => {
  const { title, description } = req.body;
  const professor_id = req.user.id;
  const filePath = req.file ? req.file.path : null;

  if (!filePath) return res.status(400).json({ error: 'Fichier PDF requis' });

  try {
    console.log('Fichier reçu pour l’exercice :', req.file);
    console.log('Chemin du fichier stocké :', filePath);

    const exercise = await Exercise.create(professor_id, title, description, filePath); // Sauvegarder l'exercice
    res.status(201).json({ message: 'Exercice créé', exercise });
  } catch (err) {
    console.error('Erreur lors de la création de l’exercice :', err);
    if (filePath) await fs.unlink(filePath).catch(console.error); // Nettoyer le fichier en cas d’erreur
    res.status(500).json({ error: 'Erreur lors de la création de l’exercice', details: err.message });
  }
});

// Lister tous les exercices
router.get('/exercises', auth('professor'), async (req, res) => {
  try {
    const exercises = await Exercise.findAll();
    if (exercises.length === 0) {
      return res.status(404).json({ error: 'Aucun exercice disponible' });
    }

    res.json(exercises);
  } catch (err) {
    console.error('Erreur lors de la récupération des exercices :', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des exercices', details: err.message });
  }
});

// Lister un exercice par titre
router.get('/exercises/search', auth('professor'), async (req, res) => {
  const { title } = req.query;
  if (!title) {
    return res.status(400).json({ error: 'Titre requis pour la recherche' });
  }

  try {
    const exercises = await Exercise.findByTitle(title);
    if (exercises.length === 0) {
      return res.status(404).json({ error: 'Aucun exercice trouvé' });
    }
    res.json(exercises);
  } catch (err) {
    console.error('Erreur lors de la recherche de l’exercice :', err);
    res.status(500).json({ error: 'Erreur lors de la recherche de l’exercice', details: err.message });
  }
});

// Ajouter une correction
// router.post('/corrections', auth('professor'), upload.single('file'), async (req, res) => {
//   const { exercise_id, title, description } = req.body;
//   const filePath = req.file ? req.file.path : null;

//   // Vérification des champs requis
//   if (!exercise_id || !title || !description) {
//     if (filePath) await fs.unlink(filePath).catch(console.error);
//     return res.status(400).json({ error: 'Exercice, titre et description sont requis' });
//   }

//   // Vérification si un fichier est présent
//   if (!filePath) {
//     return res.status(400).json({ error: 'Fichier de correction requis' });
//   }

//   try {
//     console.log('Fichier reçu pour la correction :', req.file);
//     console.log('Chemin du fichier stocké :', filePath);

//     // Enregistrer la correction dans la base de données
//     const correction = await Correction.create(exercise_id, title, description, filePath);

//     // Mettre à jour le correction_model dans la table exercises
//     await updateCorrectionModel(exercise_id);

//     res.status(201).json({ message: 'Correction créée avec succès', correction });
//   } catch (err) {
//     console.error('Erreur lors de la création de la correction :', err);
//     if (filePath) await fs.unlink(filePath).catch(console.error);
//     res.status(500).json({ error: 'Erreur lors de la création de la correction', details: err.message });
//   }
// });
router.post('/corrections', auth('professor'), upload.single('file'), async (req, res) => {
  const { exercise_id, title, description } = req.body;
  const filePath = req.file ? req.file.path : null;

  // Vérification des champs requis
  if (!exercise_id || !title || !description) {
    if (filePath) await fs.unlink(filePath).catch(console.error);
    return res.status(400).json({ error: 'Exercice, titre et description sont requis' });
  }

  // Vérification si un fichier est présent
  if (!filePath) {
    return res.status(400).json({ error: 'Fichier de correction requis' });
  }

  try {
    console.log('Fichier reçu pour la correction :', req.file);
    console.log('Chemin du fichier stocké :', filePath);

    // Enregistrer la correction dans la base de données
    const correction = await Correction.create(exercise_id, title, description, filePath);

    // Mettre à jour le correction_model dans la table corrections
    await updateCorrectionModel(correction.id, filePath);

    res.status(201).json({ message: 'Correction créée avec succès', correction });
  } catch (err) {
    console.error('Erreur lors de la création de la correction :', err);
    if (filePath) await fs.unlink(filePath).catch(console.error);
    res.status(500).json({ error: 'Erreur lors de la création de la correction', details: err.message });
  }
});
// Lister toutes les corrections
router.get('/corrections', auth('professor'), async (req, res) => {
  try {
    const corrections = await Correction.findAll();

    // Vérifier si des corrections existent
    if (corrections.length === 0) {
      return res.status(404).json({ error: 'Aucune correction disponible' });
    }

    res.json(corrections);
  } catch (err) {
    console.error('Erreur lors de la récupération des corrections :', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des corrections', details: err.message });
  }
});

// Lister une correction par exercice
router.get('/corrections/exercise/:exercise_id', auth('professor'), async (req, res) => {
  const { exercise_id } = req.params;
  const { title, created_at } = req.query; // Récupérer les filtres optionnels

  try {
    // Appliquer des filtres en fonction des paramètres de la requête
    const filters = {};
    if (title) filters.title = title; // Si un titre est passé, l'ajouter aux filtres
    if (created_at) filters.created_at = created_at; // Si une date de création est passée, l'ajouter aux filtres

    // Récupérer les corrections en appliquant les filtres
    const corrections = await Correction.findByExerciseId(exercise_id, filters);

    // Vérifier si des corrections existent
    if (corrections.length === 0) {
      return res.status(404).json({ error: 'Aucune correction disponible pour cet exercice avec ces filtres' });
    }

    res.json(corrections);
  } catch (err) {
    console.error('Erreur lors de la récupération des corrections :', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des corrections', details: err.message });
  }
});

module.exports = router;