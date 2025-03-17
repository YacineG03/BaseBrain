// const pool = require('../config/database');

// class Exercise {
//   // Récupérer tous les exercices (pour un étudiant, avec filtres optionnels)
//   static async findForStudent(studentId, filters = {}) {
//     try {
//       let query = 'SELECT * FROM exercises';
//       const params = [];

//       // Ajouter des filtres si présents
//       const whereClauses = [];
//       if (filters.title) {
//         whereClauses.push('title LIKE ?');
//         params.push(`%${filters.title}%`);
//       }
//       if (filters.created_at) {
//         whereClauses.push('DATE(created_at) = ?');
//         params.push(filters.created_at);
//       }

//       if (whereClauses.length > 0) {
//         query += ' WHERE ' + whereClauses.join(' AND ');
//       }

//       query += ' ORDER BY created_at DESC';
//       const [rows] = await pool.execute(query, params);
//       return rows;
//     } catch (err) {
//       throw new Error('Erreur lors de la récupération des exercices pour l\'étudiant : ' + err.message);
//     }
//   }

//   // Récupérer un exercice par son ID
//   static async findById(exerciseId) {
//     try {
//       const [rows] = await pool.execute('SELECT * FROM exercises WHERE id = ?', [exerciseId]);
//       return rows[0] || null;
//     } catch (err) {
//       throw new Error('Erreur lors de la recherche de l\'exercice : ' + err.message);
//     }
//   }

//   // Créer un nouvel exercice (utile pour les enseignants)
//   static async create(professor_id, title, description, content) {
//     try {
//       const query = `
//         INSERT INTO exercises (professor_id, title, description, content, created_at)
//         VALUES (?, ?, ?, ?, NOW())
//       `;
//       const [result] = await pool.execute(query, [
//         professor_id,
//         title,
//         description || null, // Gérer null si non fourni
//         content || null,     // Gérer null si non fourni
//       ]);
//       return { id: result.insertId, professor_id, title, description, content };
//     } catch (err) {
//       throw new Error('Erreur lors de la création de l\'exercice : ' + err.message);
//     }
//   }

//   // Mettre à jour un exercice existant (utile pour les enseignants)
//   static async update(exerciseId, { professor_id, title, description, content }) {
//     try {
//       const query = `
//         UPDATE exercises
//         SET professor_id = ?, title = ?, description = ?, content = ?, created_at = NOW()
//         WHERE id = ?
//       `;
//       const [result] = await pool.execute(query, [
//         professor_id,
//         title,
//         description || null,
//         content || null,
//         exerciseId,
//       ]);

//       if (result.affectedRows === 0) {
//         throw new Error('Aucun exercice trouvé avec cet ID.');
//       }
//       return { id: exerciseId, professor_id, title, description, content };
//     } catch (err) {
//       throw new Error('Erreur lors de la mise à jour de l\'exercice : ' + err.message);
//     }
//   }

//   // Supprimer un exercice (utile pour les enseignants)
//   static async delete(exerciseId) {
//     try {
//       const query = 'DELETE FROM exercises WHERE id = ?';
//       const [result] = await pool.execute(query, [exerciseId]);

//       if (result.affectedRows === 0) {
//         throw new Error('Aucun exercice trouvé avec cet ID.');
//       }
//       return { message: 'Exercice supprimé avec succès.' };
//     } catch (err) {
//       throw new Error('Erreur lors de la suppression de l\'exercice : ' + err.message);
//     }
//   }

//   // Récupérer tous les exercices (pour les enseignants, sans filtre par étudiant)
//   static async findAll() {
//     try {
//       const [rows] = await pool.execute('SELECT * FROM exercises ORDER BY created_at DESC');
//       return rows;
//     } catch (err) {
//       throw new Error('Erreur lors de la récupération des exercices : ' + err.message);
//     }
//   }

//   // Récupérer les exercices d'un professeur spécifique avec filtres et pagination
//   static async findByProfessorId(professor_id, filters = {}, pagination = {}) {
//     try {
//       let query = 'SELECT * FROM exercises WHERE professor_id = ?';
//       const params = [professor_id];

//       if (filters.title) {
//         query += ' AND title LIKE ?';
//         params.push(`%${filters.title}%`);
//       }
//       if (filters.created_at) {
//         query += ' AND DATE(created_at) = ?';
//         params.push(filters.created_at);
//       }

//       if (pagination.limit && pagination.offset !== undefined) {
//         query += ' LIMIT ? OFFSET ?';
//         params.push(parseInt(pagination.limit), parseInt(pagination.offset));
//       }

//       const [rows] = await pool.execute(query, params);
//       return rows;
//     } catch (err) {
//       throw new Error('Erreur lors de la récupération des exercices par professeur : ' + err.message);
//     }
//   }

//   // Compter les exercices d'un professeur avec filtres
//   static async countByProfessorId(professor_id, filters = {}) {
//     try {
//       let query = 'SELECT COUNT(*) as total FROM exercises WHERE professor_id = ?';
//       const params = [professor_id];

//       if (filters.title) {
//         query += ' AND title LIKE ?';
//         params.push(`%${filters.title}%`);
//       }
//       if (filters.created_at) {
//         query += ' AND DATE(created_at) = ?';
//         params.push(filters.created_at);
//       }

//       const [result] = await pool.execute(query, params);
//       return result[0].total;
//     } catch (err) {
//       throw new Error('Erreur lors du comptage des exercices par professeur : ' + err.message);
//     }
//   }
// }

// module.exports = Exercise;

const pool = require('../config/database');

class Exercise {
  // Récupérer tous les exercices (pour un étudiant, avec filtres optionnels)
  static async findForStudent(studentId, filters = {}) {
    try {
      let query = 'SELECT * FROM exercises';
      const params = [];

      const whereClauses = [];
      if (filters.title) {
        whereClauses.push('title LIKE ?');
        params.push(`%${filters.title}%`);
      }
      if (filters.created_at) {
        whereClauses.push('DATE(created_at) = ?');
        params.push(filters.created_at);
      }

      if (whereClauses.length > 0) {
        query += ' WHERE ' + whereClauses.join(' AND ');
      }

      query += ' ORDER BY created_at DESC';
      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (err) {
      throw new Error('Erreur lors de la récupération des exercices pour l\'étudiant : ' + err.message);
    }
  }

  // Récupérer un exercice par son ID
  static async findById(exerciseId) {
    try {
      const [rows] = await pool.execute('SELECT * FROM exercises WHERE id = ?', [exerciseId]);
      return rows[0] || null;
    } catch (err) {
      throw new Error('Erreur lors de la recherche de l\'exercice : ' + err.message);
    }
  }

  // Créer un nouvel exercice (utile pour les enseignants)
  static async create(professor_id, title, description, content) {
    try {
      const query = `
        INSERT INTO exercises (professor_id, title, description, content, created_at)
        VALUES (?, ?, ?, ?, NOW())
      `;
      const [result] = await pool.execute(query, [
        professor_id,
        title,
        description || null,
        content || null,
      ]);
      return { id: result.insertId, professor_id, title, description, content };
    } catch (err) {
      throw new Error('Erreur lors de la création de l\'exercice : ' + err.message);
    }
  }

  // Mettre à jour un exercice existant (utile pour les enseignants)
  static async update(exerciseId, { professor_id, title, description, content }) {
    try {
      const query = `
        UPDATE exercises
        SET professor_id = ?, title = ?, description = ?, content = ?, created_at = NOW()
        WHERE id = ?
      `;
      const [result] = await pool.execute(query, [
        professor_id,
        title,
        description || null,
        content || null,
        exerciseId,
      ]);

      if (result.affectedRows === 0) {
        throw new Error('Aucun exercice trouvé avec cet ID.');
      }
      return { id: exerciseId, professor_id, title, description, content };
    } catch (err) {
      throw new Error('Erreur lors de la mise à jour de l\'exercice : ' + err.message);
    }
  }

  // Supprimer un exercice (utile pour les enseignants)
  static async delete(exerciseId) {
    try {
      const query = 'DELETE FROM exercises WHERE id = ?';
      const [result] = await pool.execute(query, [exerciseId]);

      if (result.affectedRows === 0) {
        throw new Error('Aucun exercice trouvé avec cet ID.');
      }
      return { message: 'Exercice supprimé avec succès.' };
    } catch (err) {
      throw new Error('Erreur lors de la suppression de l\'exercice : ' + err.message);
    }
  }

  // Récupérer tous les exercices (pour les enseignants, sans filtre par étudiant)
  static async findAll() {
    try {
      const [rows] = await pool.execute('SELECT * FROM exercises ORDER BY created_at DESC');
      return rows;
    } catch (err) {
      throw new Error('Erreur lors de la récupération des exercices : ' + err.message);
    }
  }

  // Récupérer les exercices d'un professeur spécifique avec filtres et pagination
  static async findByProfessorId(professor_id, filters = {}, pagination = {}) {
    try {
      let query = 'SELECT * FROM exercises WHERE professor_id = ?';
      const params = [professor_id];

      if (filters.title) {
        query += ' AND title LIKE ?';
        params.push(`%${filters.title}%`);
      }
      if (filters.created_at) {
        query += ' AND DATE(created_at) = ?';
        params.push(filters.created_at);
      }

      if (pagination.limit && pagination.offset !== undefined) {
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(pagination.limit), parseInt(pagination.offset));
      }

      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (err) {
      throw new Error('Erreur lors de la récupération des exercices par professeur : ' + err.message);
    }
  }

  // Compter les exercices d'un professeur avec filtres
  static async countByProfessorId(professor_id, filters = {}) {
    try {
      let query = 'SELECT COUNT(*) as total FROM exercises WHERE professor_id = ?';
      const params = [professor_id];

      if (filters.title) {
        query += ' AND title LIKE ?';
        params.push(`%${filters.title}%`);
      }
      if (filters.created_at) {
        query += ' AND DATE(created_at) = ?';
        params.push(filters.created_at);
      }

      const [result] = await pool.execute(query, params);
      return result[0].total;
    } catch (err) {
      throw new Error('Erreur lors du comptage des exercices par professeur : ' + err.message);
    }
  }
}

module.exports = Exercise;