const pool = require('../config/database');
const { analyzeSubmissionWithAI } = require('../services/aiService');
const fs = require('fs').promises;
///DECOMMENTER
class Submission {
  // Créer une soumission
  static async create(studentId, exerciseId, filePath, encryptionKey, encryptionIv) {
    const [student] = await pool.execute('SELECT * FROM users WHERE id = ? AND role = "student"', [studentId]);
    if (!student.length) {
      throw new Error('Utilisateur non trouvé ou n’est pas un étudiant');
    }

    const query = `
      INSERT INTO submissions (student_id, exercise_id, file_path, submitted_at, updated_at, status, encryption_key, encryption_iv)
      VALUES (?, ?, ?, NOW(), NOW(), 'pending', ?, ?)
    `;
    const [result] = await pool.execute(query, [studentId, exerciseId, filePath, encryptionKey, encryptionIv]);
    return { id: result.insertId, student_id: studentId, exercise_id: exerciseId, file_path: filePath };
  }

  // Récupérer une soumission par son ID (pour un professeur)
  static async findById(submissionId, professorId) {
    try {
      const [rows] = await pool.execute(
        `SELECT s.*, u.email AS student_email 
         FROM submissions s 
         JOIN users u ON s.student_id = u.id 
         JOIN exercises e ON s.exercise_id = e.id 
         WHERE s.id = ? AND e.professor_id = ?`,
        [submissionId, professorId]
      );
      return rows[0] || null;
    } catch (err) {
      throw new Error('Erreur lors de la récupération de la soumission : ' + err.message);
    }
  }


  static async findByIdForStudent(submissionId) {
    try {
      const [rows] = await pool.execute(
        `SELECT s.*, u.email AS student_email 
         FROM submissions s 
         JOIN users u ON s.student_id = u.id 
         JOIN exercises e ON s.exercise_id = e.id 
         WHERE s.id = ?`,
        [submissionId]
      );
      return rows[0] || null;
    } catch (err) {
      throw new Error('Erreur lors de la récupération de la soumission : ' + err.message);
    }
  }
  // Mettre à jour une soumission (note, feedback, statut)
  static async update(submissionId, { note, feedback, status }) {
    try {
      console.log('Updating submission:', { submissionId, note, feedback, status });
      const query = `
        UPDATE submissions
        SET note = ?, feedback = ?, status = ?, updated_at = NOW()
        WHERE id = ?
      `;
      const [result] = await pool.execute(query, [
        note,
        typeof feedback === 'object' ? JSON.stringify(feedback) : feedback,
        status,
        submissionId,
      ]);

      if (result.affectedRows === 0) {
        throw new Error('Aucune soumission trouvée avec cet ID.');
      }
      return true;
    } catch (err) {
      throw new Error('Erreur lors de la mise à jour de la soumission : ' + err.message);
    }
  }

  // Récupérer une soumission par ID et étudiant
  static async findByIdAndStudent(id, student_id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM submissions WHERE id = ? AND student_id = ?', [id, student_id]);
      return rows[0];
    } catch (err) {
      throw new Error('Erreur lors de la recherche de la soumission : ' + err.message);
    }
  }

  // Récupérer toutes les soumissions d’un étudiant
  static async findByStudent(student_id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM submissions WHERE student_id = ?', [student_id]);
      return rows;
    } catch (err) {
      throw new Error('Erreur lors de la récupération des soumissions : ' + err.message);
    }
  }

  // Récupérer toutes les soumissions pour un exercice spécifique (pour un professeur)
  static async findByExerciseId(exerciseId, professorId, filters = {}, pagination = {}) {
    try {
      let query = `
        SELECT s.*, u.email AS student_email 
        FROM submissions s 
        JOIN users u ON s.student_id = u.id 
        JOIN exercises e ON s.exercise_id = e.id 
        WHERE s.exercise_id = ? AND e.professor_id = ?
      `;
      const params = [exerciseId, professorId];

      if (filters.status) {
        query += ' AND s.status = ?';
        params.push(filters.status);
      }
      if (filters.submitted_at) {
        query += ' AND DATE(s.submitted_at) = ?';
        params.push(filters.submitted_at);
      }

      if (pagination.limit && pagination.offset !== undefined) {
        query += ' ORDER BY s.submitted_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(pagination.limit), parseInt(pagination.offset));
      } else {
        query += ' ORDER BY s.submitted_at DESC';
      }

      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (err) {
      throw new Error('Erreur lors de la récupération des soumissions pour l\'exercice : ' + err.message);
    }
  }

  // Récupérer une soumission par exercice et étudiant (pour un professeur)
  static async findByExerciseAndStudent(exerciseId, studentId, professorId) {
    try {
      const [rows] = await pool.execute(
        `SELECT s.*, u.email AS student_email 
         FROM submissions s 
         JOIN users u ON s.student_id = u.id 
         JOIN exercises e ON s.exercise_id = e.id 
         WHERE s.exercise_id = ? AND s.student_id = ? AND e.professor_id = ?`,
        [exerciseId, studentId, professorId]
      );
      return rows[0] || null;
    } catch (err) {
      throw new Error('Erreur lors de la récupération de la soumission : ' + err.message);
    }
  }

 // Compter les soumissions pour un exercice (pour un professeur)
  static async countByExerciseId(exerciseId, professorId, filters = {}) {
    try {
      let query = `
        SELECT COUNT(*) as total 
        FROM submissions s 
        JOIN exercises e ON s.exercise_id = e.id 
        WHERE s.exercise_id = ? AND e.professor_id = ?
      `;
      const params = [exerciseId, professorId];

      if (filters.status) {
        query += ' AND s.status = ?';
        params.push(filters.status);
      }
      if (filters.submitted_at) {
        query += ' AND DATE(s.submitted_at) = ?';
        params.push(filters.submitted_at);
      }

      const [result] = await pool.execute(query, params);
      return result[0].total;
    } catch (err) {
      throw new Error('Erreur lors du comptage des soumissions pour l\'exercice : ' + err.message);
    }
  }
  // Récupérer toutes les soumissions pour un exercice (sans vérification de professeur)
  static async findByExercise(exercise_id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM submissions WHERE exercise_id = ?', [exercise_id]);
      return rows;
    } catch (err) {
      throw new Error('Erreur lors de la récupération des soumissions : ' + err.message);
    }
  }

  // Récupérer les statistiques par exercice
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

  // Récupérer les soumissions d’un étudiant avec détails
  static async findByStudentWithDetails(studentId) {
    try {
      const query = `
        SELECT s.id, s.exercise_id, s.note, s.submitted_at,
               e.title AS exercise_title
        FROM submissions s
        JOIN exercises e ON s.exercise_id = e.id
        WHERE s.student_id = ? AND s.note IS NOT NULL
        ORDER BY s.submitted_at ASC
      `;
      const [rows] = await pool.execute(query, [studentId]);
      return rows;
    } catch (err) {
      throw new Error('Erreur lors de la récupération des soumissions avec détails : ' + err.message);
    }
  }

  // Récupérer la moyenne de la classe pour un exercice
  static async getClassAverageByExercise(exerciseId) {
    try {
      const query = `
        SELECT AVG(s.note) AS class_average
        FROM submissions s
        WHERE s.exercise_id = ? AND s.note IS NOT NULL
      `;
      const [result] = await pool.execute(query, [exerciseId]);
      return result[0].class_average ? parseFloat(result[0].class_average).toFixed(2) : null;
    } catch (err) {
      throw new Error('Erreur lors du calcul de la moyenne de la classe : ' + err.message);
    }
  }

  // Récupérer les soumissions pour détection de plagiat
  static async findForPlagiarismCheck(exerciseId, studentId) {
    try {
      const query = `
        SELECT file_path FROM submissions 
        WHERE exercise_id = ? AND student_id != ?
      `;
      const [rows] = await pool.execute(query, [exerciseId, studentId]);
      return rows;
    } catch (err) {
      throw new Error('Erreur lors de la récupération des soumissions pour détection de plagiat : ' + err.message);
    }
  }

  // Supprimer une soumission
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

module.exports = Submission;

