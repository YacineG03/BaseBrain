const fs = require('fs').promises;
const pdfParse = require('pdf-parse');
const axios = require('axios');
const pool = require('../config/database');

// Fonction pour extraire les questions numérotées du texte
const extractQuestions = (text) => {
  const questions = [];
  const lines = text.split('\n');
  let currentQuestion = null;

  for (let line of lines) {
    line = line.trim();
    // Détecter une ligne qui commence par un numéro suivi d’un texte (ex. "1 Sélectionner..." ou "1. Sélectionner...")
    if (line.match(/^\d+\.?\s/)) {
      if (currentQuestion) questions.push(currentQuestion.trim());
      currentQuestion = line;
    } else if (currentQuestion && line) {
      currentQuestion += '\n' + line;
    }
  }
  if (currentQuestion) questions.push(currentQuestion.trim());
  return questions.filter(q => q && q.match(/^\d+\.?\s/));
};

// Fonction principale pour analyser une soumission
const analyzeSubmissionWithAI = async (filePath, exerciseId) => {
  try {
    // Étape 1 : Extraire le texte du PDF
    const pdfBuffer = await fs.readFile(filePath);
    const pdfData = await pdfParse(pdfBuffer);
    const studentText = pdfData.text.trim();

    if (!studentText) {
      throw new Error('Aucun texte extrait du PDF. Assurez-vous que le fichier contient du texte lisible.');
    }

    console.log('Texte brut extrait du PDF étudiant :', studentText);

    // Étape 2 : Extraire les réponses numérotées (questions)
    const studentQuestions = extractQuestions(studentText);
    if (studentQuestions.length === 0) {
      throw new Error('Aucune question numérotée trouvée dans le PDF de l’étudiant.');
    }
    console.log('Questions extraites du PDF étudiant :', studentQuestions);

    // Étape 3 : Récupérer les correction_model depuis la table corrections
    const [corrections] = await pool.execute(
      'SELECT correction_model FROM corrections WHERE exercise_id = ? AND correction_model IS NOT NULL',
      [exerciseId]
    );

    if (!corrections.length) {
      throw new Error('Aucune correction disponible pour cet exercice.');
    }

    // Fusionner ou sélectionner un correction_model
    // Option 1 : Prendre le premier correction_model non vide
    const correctionModelText = corrections[0].correction_model;

    // Option 2 (alternative) : Fusionner tous les correction_model (décommenter si tu veux cette approche)
    /*
    const allQuestions = new Map();
    corrections.forEach(correction => {
      const questions = extractQuestions(correction.correction_model);
      questions.forEach(q => {
        const questionText = q.replace(/^\d+\.?\s/, '').trim();
        const normalizedQuestionText = questionText.toLowerCase().replace(/\s+/g, ' ').trim();
        if (!allQuestions.has(normalizedQuestionText)) {
          allQuestions.set(normalizedQuestionText, q);
        }
      });
    });
    const correctionModelText = Array.from(allQuestions.values())
      .map((q, index) => `${index + 1}. ${q.replace(/^\d+\.?\s/, '')}`)
      .join('\n');
    */

    if (!correctionModelText) {
      throw new Error('Le modèle de correction est vide ou non défini.');
    }

    console.log('Texte brut du modèle de correction :', correctionModelText);

    const correctionQuestions = extractQuestions(correctionModelText);
    if (correctionQuestions.length === 0) {
      throw new Error('Aucune question numérotée trouvée dans le modèle de correction.');
    }
    console.log('Questions extraites du modèle de correction :', correctionQuestions);

    const results = {};

    // Étape 4 : Évaluer chaque réponse par rapport à la consigne correspondante
    for (let i = 0; i < studentQuestions.length && i < correctionQuestions.length; i++) {
      const studentAnswer = studentQuestions[i].replace(/^\d+\.?\s.*?\n/, '').trim();
      const correction = correctionQuestions[i].replace(/^\d+\.?\s.*?:\s/, '').trim();

      if (!studentAnswer) {
        results[`question${i + 1}`] = {
          grade: 0,
          feedback: 'Aucune réponse fournie pour cette question.',
        };
        continue;
      }

      const prompt = `
      Tu es un correcteur SQL utilisant DeepSeek via Ollama. Évalue cette réponse SQL par rapport au modèle de correction et retourne un JSON avec :
      - "grade": une note entière sur 20 (entre 0 et 20, JAMAIS supérieur à 20 ou avec décimales aberrantes). Si la réponse a des erreurs, la note doit être inférieure à 20.
      - "feedback": un texte expliquant la note, les erreurs spécifiques (ex. "manque une clause WHERE"), l’impact de ces erreurs, et des suggestions précises.
    
      Réponse de l’étudiant : ${studentAnswer}
    
      Modèle de correction : ${correction}
    
      Exemple :
      {
        "grade": 15,
        "feedback": "La requête manque une clause WHERE pour filtrer les résultats. Sans cela, elle retourne tous les livres. Ajoutez 'WHERE auteur = 'Nom_Auteur''."
      }
    `;

      // Étape 5 : Appeler l’API Ollama
      const ollamaUrl = process.env.OLLAMA_URL || 'http://127.0.0.1:11434/api/generate';
      console.log(`Évaluation de la question ${i + 1} - Tentative de connexion à :`, ollamaUrl);

      const responseApi = await axios.post(ollamaUrl, {
        model: 'deepseek-coder',
        prompt: prompt,
        stream: false,
        format: 'json',
      }, {
        timeout: 120000,
        headers: { 'Content-Type': 'application/json' },
      });

      const rawResponse = responseApi.data;
      console.log(`Réponse complète de l’API pour la question ${i + 1} :`, JSON.stringify(rawResponse, null, 2));
      if (!rawResponse.done) {
        console.warn(`Réponse incomplète (done: false) pour la question ${i + 1}.`);
        throw new Error('Réponse incomplète de l’IA. Vérifiez Ollama.');
      }

      const aiResult = rawResponse.response || rawResponse;
      console.log(`Réponse brute de l’IA pour la question ${i + 1} :`, aiResult);

      const cleanedResult = typeof aiResult === 'string' ? aiResult.trim().match(/^\s*\{[\s\S]*?\}\s*$/)?.[0] : aiResult;
      console.log(`Réponse nettoyée pour la question ${i + 1} :`, cleanedResult);

      let result;

      try {
        result = typeof cleanedResult === 'string' && cleanedResult ? JSON.parse(cleanedResult) : cleanedResult;
      } catch (e) {
        console.log(`Échec du parsing JSON pour la question ${i + 1}, tentative manuelle :`, cleanedResult);
        const gradeMatch = cleanedResult?.match(/"grade":\s*(\d+(\.\d+)?)/);
        const feedbackMatch = cleanedResult?.match(/"feedback":\s*"(.*?)"(?=\s*}|$)/);
      
        if (!gradeMatch || !feedbackMatch) {
          throw new Error('Réponse de l’IA invalide : impossible de parser "grade" ou "feedback".');
        }
      
        result = {
          grade: parseFloat(gradeMatch[1]) || 0, // Valeur par défaut 0 si invalide
          feedback: feedbackMatch[1].trim(),
        };
        result.grade = Math.round(result.grade * 2) / 2; // Arrondir à l’incrément de 0.5
      }
      if (result.grade === undefined || result.grade === null || isNaN(result.grade)) {
        console.warn(`Grade invalide pour la question ${i + 1}, attribution de 0 par défaut.`);
        result.grade = 0;
      }
      if (!result.feedback || typeof result.feedback !== 'string') {
        console.warn(`Feedback invalide pour la question ${i + 1}, attribution d’un message par défaut.`);
        result.feedback = 'Aucune évaluation détaillée fournie par l’IA.';
      }

      const grade = Math.min(Math.max(parseFloat(result.grade), 0), 20);
      console.log(`Note normalisée pour la question ${i + 1} :`, grade);

      results[`question${i + 1}`] = {
        grade,
        feedback: result.feedback,
      };
    }

    // Calculer une note globale
    const totalGrade = Object.values(results).reduce((sum, r) => sum + r.grade, 0);
    const averageGrade = Object.keys(results).length > 0 ? totalGrade / Object.keys(results).length : 0;

    return {
      overallGrade: Number(averageGrade.toFixed(2)),
      detailedResults: results,
    };
  } catch (error) {
    console.error('Erreur lors de l’analyse de la soumission :', error.message);
    if (error.response && error.response.status === 404) {
      return {
        overallGrade: 0,
        detailedResults: { error: 'Erreur : L’endpoint Ollama /api/generate est inaccessible (404). Vérifiez la configuration ou redémarrez Ollama avec "ollama serve".' },
      };
    }
    if (error.code === 'ECONNABORTED') {
      return {
        overallGrade: 0,
        detailedResults: { error: 'Erreur : Le traitement a pris trop de temps (timeout dépassé). Essayez de soumettre à nouveau ou utilisez un modèle plus rapide.' },
      };
    }
    return {
      overallGrade: 0,
      detailedResults: { error: `Erreur lors de la correction automatique : ${error.message}. Veuillez réessayer ou contacter l’administrateur.` },
    };
  }
};

module.exports = { analyzeSubmissionWithAI };