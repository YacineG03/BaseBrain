const fs = require('fs');
const fsPromises = require('fs').promises; // Pour les opérations asynchrones comme readFile
const path = require('path');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const pdfParse = require('pdf-parse');
const pool = require('../config/database');

// Configuration du client S3 pour MinIO
const s3Client = new S3Client({
  region: 'us-east-1', // Région par défaut, peut être ajustée si nécessaire
  endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
  forcePathStyle: true, // Nécessaire pour MinIO
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  },
});

// Fonction pour télécharger un fichier depuis MinIO et l'enregistrer localement
const downloadFile = async (url, destinationPath) => {
  try {
    // Extraire le bucket et la clé à partir de l'URL
    const urlParts = new URL(url);
    const pathParts = urlParts.pathname.split('/').filter(part => part); // Supprime les "/" vides
    const bucket = pathParts[0]; // Le premier segment après le hostname
    const key = pathParts.slice(1).join('/'); // Le reste du chemin

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await s3Client.send(command);
    const fileStream = response.Body;

    // Écrire le flux dans un fichier local
    await new Promise((resolve, reject) => {
      const file = fs.createWriteStream(destinationPath);
      fileStream.pipe(file);
      file.on('finish', resolve);
      file.on('error', reject);
    });
  } catch (error) {
    console.error(`Erreur lors du téléchargement du fichier depuis ${url}:`, error.message);
    throw error;
  }
};

// Fonction pour extraire les questions numérotées d’un PDF
const extractQuestionsFromPDF = async (filePath) => {
  try {
    const pdfBuffer = await fsPromises.readFile(filePath);
    const pdfData = await pdfParse(pdfBuffer);
    const text = pdfData.text.trim();
    console.log(`Texte brut extrait du PDF ${filePath} :`, text);

    const questions = [];
    const lines = text.split('\n');
    let currentQuestion = null;
    let collectingContent = false;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      console.log(`Ligne analysée (${i}): "${line}"`);

      if (line.match(/^\d+(\.|)?$/) && !collectingContent) {
        if (currentQuestion && currentQuestion.trim()) questions.push(currentQuestion.trim());
        currentQuestion = line;
        collectingContent = true;
      } else if (collectingContent && line) {
        if (currentQuestion) currentQuestion += '\n' + line;
        if (i + 1 < lines.length && lines[i + 1].trim().match(/^\d+(\.|)?$/)) {
          collectingContent = false;
        }
      } else if (!line && collectingContent) {
        collectingContent = false;
      }
    }
    if (currentQuestion && currentQuestion.trim()) questions.push(currentQuestion.trim());
    const filteredQuestions = questions
      .filter(q => q && q.match(/^\d+(\.|)?\s*.+/) && !q.includes('n\'hésitez pas'))
      .map(q => q.replace(/^\d+(\.|)?\s*/, '').trim());
    console.log(`Questions extraites du PDF ${filePath} :`, filteredQuestions);
    return filteredQuestions;
  } catch (error) {
    console.error(`Erreur lors de l’extraction des questions du PDF ${filePath}:`, error);
    return [];
  }
};

// Fonction pour mettre à jour correction_model pour une correction spécifique
async function updateCorrectionModel(correctionId, minioUrls) {
  try {
    if (!minioUrls || !Array.isArray(minioUrls) || minioUrls.length === 0) {
      console.log(`Aucun fichier fourni pour la correction ${correctionId}.`);
      return;
    }

    const allQuestions = new Map();
    for (const url of minioUrls) {
      try {
        const tempFilePath = path.join(__dirname, `../uploads/temp-${Date.now()}-${Math.random().toString(36).substring(7)}.pdf`);
        await downloadFile(url, tempFilePath);
        const questions = await extractQuestionsFromPDF(tempFilePath);

        if (fs.existsSync(tempFilePath)) {
          await fsPromises.unlink(tempFilePath);
        }

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
      } catch (error) {
        console.error(`Erreur lors du traitement de l'URL ${url}:`, error.message);
        continue;
      }
    }

    let correctionModel = '';
    if (allQuestions.size > 0) {
      correctionModel = Array.from(allQuestions.values())
        .map((item, index) => `${index + 1}. ${item.text}\n${item.query}`)
        .join('\n')
        .trim();
    }

    if (correctionModel) {
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