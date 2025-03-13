const pool = require('../config/database');
const { analyzeSubmissionWithAI } = require('../services/aiService');
const fs = require('fs').promises;

// Classe Submission
class Submission {
  // static async create(student_id, exercise_id, file_path, note = 0, feedback = 'Correction en cours de génération...', status = 'pending', submitted_at = new Date()) {
  //   try {
  //     // Validation : Vérifier que l’exercice existe
  //     const [exercise] = await pool.execute('SELECT id, correction_model FROM exercises WHERE id = ?', [exercise_id]);
  //     if (!exercise.length) {
  //       throw new Error('L’exercice spécifié n’existe pas.');
  //     }
  //     const correctionModel = exercise[0].correction_model || null;

  //     // Validation : Vérifier que l’étudiant existe
  //     const [student] = await pool.execute('SELECT id FROM users WHERE id = ? AND role = "student"', [student_id]);
  //     if (!student.length) {
  //       throw new Error('L’étudiant spécifié n’existe pas ou n’a pas le rôle approprié.');
  //     }

  //     // Insérer la soumission
  //     const query = 'INSERT INTO submissions (student_id, exercise_id, file_path, note, feedback, status, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?)';
  //     const [result] = await pool.execute(query, [student_id, exercise_id, file_path, note, feedback, status, submitted_at]);

  //     // Analyser avec l’IA en arrière-plan
  //     const submissionId = result.insertId;
  //     processCorrection(submissionId, file_path, correctionModel).catch((err) =>
  //       console.error(`Erreur lors du traitement de la soumission ${submissionId}:`, err)
  //     );

  //     // Retourner la soumission initiale
  //     return {
  //       id: submissionId,
  //       student_id,
  //       exercise_id,
  //       file_path,
  //       note,
  //       feedback,
  //       status,
  //       submitted_at,
  //     };
  //   } catch (err) {
  //     throw new Error('Erreur lors de la création de la soumission : ' + err.message);
  //   }
  // }
// models/submission.js
  static async create(studentId, exerciseId, filePath) {
    const query = `
      INSERT INTO submissions (student_id, exercise_id, file_path, submitted_at, updated_at)
      VALUES (?, ?, ?, NOW(), NOW())
    `;
    const [result] = await pool.execute(query, [studentId, exerciseId, filePath]);
    return { id: result.insertId, student_id: studentId, exercise_id: exerciseId, file_path: filePath };
  }

  static async update(submissionId, { grade, feedback }) {
    const query = `
      UPDATE submissions
      SET note = ?, feedback = ?, updated_at = NOW()
      WHERE id = ?
    `;
    await pool.execute(query, [grade, JSON.stringify(feedback), submissionId]);
  }

  // static async update(submission_id, note, feedback, status) {
  //   try {
  //     const query = 'UPDATE submissions SET note = ?, feedback = ?, status = ? WHERE id = ?';
  //     await pool.execute(query, [
  //       note !== undefined ? note : 0,
  //       feedback || 'Aucun feedback disponible.',
  //       status || 'completed',
  //       submission_id
  //     ]);
  //     const [submission] = await pool.execute('SELECT * FROM submissions WHERE id = ?', [submission_id]);
  //     return submission[0];
  //   } catch (err) {
  //     throw new Error('Erreur lors de la mise à jour de la soumission : ' + err.message);
  //   }
  // }

  static async findByIdAndStudent(id, student_id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM submissions WHERE id = ? AND student_id = ?', [id, student_id]);
      return rows[0];
    } catch (err) {
      throw new Error('Erreur lors de la recherche de la soumission : ' + err.message);
    }
  }

  static async findByStudent(student_id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM submissions WHERE student_id = ?', [student_id]);
      return rows;
    } catch (err) {
      throw new Error('Erreur lors de la récupération des soumissions : ' + err.message);
    }
  }

  static async findByExercise(exercise_id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM submissions WHERE exercise_id = ?', [exercise_id]);
      return rows;
    } catch (err) {
      throw new Error('Erreur lors de la récupération des soumissions : ' + err.message);
    }
  }

  static async getStatsByExercise(exercise_id) {
    try {
      const [rows] = await pool.execute(
        'SELECT AVG(note) as average_grade, COUNT(*) as total_submissions FROM submissions WHERE exercise_id = ?',
        [exercise_id]
      );
      return rows[0];
    } catch (err) {
      throw new Error('Erreur lors de la récupération des statistiques : ' + err.message);
    }
  }

  static async delete(id) {
    try {
      const query = 'DELETE FROM submissions WHERE id = ?';
      const [result] = await pool.execute(query, [id]);
      if (result.affectedRows === 0) {
        throw new Error('Aucune soumission trouvée avec cet ID.');
      }
      return { message: 'Soumission supprimée avec succès.' };
    } catch (err) {
      throw new Error('Erreur lors de la suppression de la soumission : ' + err.message);
    }
  }
}

// Fonction pour traiter la correction en arrière-plan
async function processCorrection(submissionId, filePath, correctionModel) {
  try {
    const result = await analyzeSubmissionWithAI(filePath, correctionModel);
    let feedback = '';

    // Vérifier si detailedResults contient une erreur
    if (result.detailedResults && result.detailedResults.error) {
      feedback = result.detailedResults.error;
    } else {
      feedback = JSON.stringify(result.detailedResults);
    }

    await Submission.update(submissionId, result.overallGrade, feedback, 'completed');
    await fs.unlink(filePath); // Nettoyage du fichier
    console.log(`Correction terminée pour la soumission ${submissionId}`);
  } catch (error) {
    console.error(`Erreur lors de la correction de la soumission ${submissionId}:`, error);
    await Submission.update(
      submissionId,
      0,
      `Erreur lors de la correction : ${error.message}. Veuillez réessayer ou contacter l’administrateur.`,
      'failed'
    );
    try {
      await fs.unlink(filePath); // Nettoyage même en cas d’erreur
    } catch (unlinkErr) {
      console.error(`Erreur lors de la suppression du fichier ${filePath}:`, unlinkErr);
    }
  }
}

module.exports = Submission;