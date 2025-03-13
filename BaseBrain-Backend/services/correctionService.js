const fs = require('fs').promises;
const pdfParse = require('pdf-parse');
const pool = require('../config/database');

// Fonction pour extraire les questions numérotées d’un PDF
const extractQuestionsFromPDF = async (filePath) => {
  try {
    const pdfBuffer = await fs.readFile(filePath);
    const pdfData = await pdfParse(pdfBuffer);
    const text = pdfData.text.trim();
    console.log(`Texte brut extrait du PDF ${filePath} :`, text); // Log pour débogage

    const questions = [];
    const lines = text.split('\n');
    let currentQuestion = null;
    let collectingContent = false;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      console.log(`Ligne analysée (${i}): "${line}"`); // Log pour chaque ligne avec index

      // Détecter un numéro (seul ou avec point)
      if (line.match(/^\d+(\.|)?$/) && !collectingContent) {
        if (currentQuestion && currentQuestion.trim()) questions.push(currentQuestion.trim());
        currentQuestion = line;
        collectingContent = true;
      }
      // Ajouter les lignes suivantes comme contenu jusqu’au prochain numéro
      else if (collectingContent && line) {
        if (currentQuestion) currentQuestion += '\n' + line;
        // Vérifier la ligne suivante pour arrêter si c’est un nouveau numéro
        if (i + 1 < lines.length && lines[i + 1].trim().match(/^\d+(\.|)?$/)) {
          collectingContent = false;
        }
      }
      // Réinitialiser si ligne vide après un numéro
      else if (!line && collectingContent) {
        collectingContent = false;
      }
    }
    if (currentQuestion && currentQuestion.trim()) questions.push(currentQuestion.trim());
    const filteredQuestions = questions
      .filter(q => q && q.match(/^\d+(\.|)?\s*.+/) && !q.includes('n\'hésitez pas')) // Exclure les notes finales
      .map(q => q.replace(/^\d+(\.|)?\s*/, '').trim()); // Supprimer le numéro initial
    console.log(`Questions extraites du PDF ${filePath} :`, filteredQuestions);
    return filteredQuestions;
  } catch (error) {
    console.error(`Erreur lors de l’extraction des questions du PDF ${filePath}:`, error);
    return [];
  }
};

// Fonction pour mettre à jour correction_model pour une correction spécifique
async function updateCorrectionModel(correctionId, filePath) {
  try {
    // Extraire les questions du fichier PDF
    const questions = await extractQuestionsFromPDF(filePath);
    const allQuestions = new Map();
    questions.forEach(q => {
      const [questionText, query] = q.split('\n').reduce(
        (acc, line) => {
          if (line.trim().match(/SELECT|FROM|WHERE|JOIN|GROUP/i)) {
            acc[1] += (acc[1] ? '\n' : '') + line.trim();
          } else {
            acc[0] += (acc[0] ? ' ' : '') + line.trim();
          }
          return acc;
        },
        ['', '']
      );
      if (questionText && query) {
        const normalizedQuestionText = questionText.replace(/\s+/g, ' ').toLowerCase().trim();
        if (!allQuestions.has(normalizedQuestionText)) {
          allQuestions.set(normalizedQuestionText, { text: questionText, query: query });
        }
      }
    });

    let correctionModel = '';
    if (allQuestions.size > 0) {
      correctionModel = Array.from(allQuestions.values())
        .map((item, index) => `${index + 1}. ${item.text}\n${item.query}`)
        .join('\n')
        .trim();
    }

    if (correctionModel) {
      // Mettre à jour corrections.correction_model pour cette correction spécifique
      const query = 'UPDATE corrections SET correction_model = ? WHERE id = ?';
      await pool.execute(query, [correctionModel, correctionId]);
      console.log(`Correction_model mis à jour pour la correction ${correctionId}. Contenu :`, correctionModel);
    } else {
      console.log(`Aucun modèle de correction extrait pour la correction ${correctionId}.`);
    }
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du correction_model pour la correction ${correctionId}:`, error);
  }
}

module.exports = { updateCorrectionModel };