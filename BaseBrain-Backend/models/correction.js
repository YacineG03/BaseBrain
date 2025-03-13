const pool = require('../config/database');


class Correction {
  // Créer une correction pour un exercice
  // static async create(exercise_id, title, description, file_path) {
  //   try {
  //     const query = 'INSERT INTO corrections (exercise_id, title, description, file_path) VALUES (?, ?, ?, ?)';
  //     const [result] = await pool.execute(query, [exercise_id, title, description, file_path]);
  //     return { id: result.insertId, exercise_id, title, description, file_path };
  //   } catch (err) {
  //     throw new Error('Erreur lors de la création de la correction : ' + err.message);
  //   }
  // }
  static async create(exercise_id, title, description, file_path) {
    try {
      const query = `
        INSERT INTO corrections (exercise_id, title, description, file_path, created_at, updated_at)
        VALUES (?, ?, ?, ?, NOW(), NOW())
      `;
      const [result] = await pool.execute(query, [exercise_id, title, description, file_path]);
      return { id: result.insertId, exercise_id, title, description, file_path };
    } catch (error) {
      throw new Error(`Erreur lors de la création de la correction : ${error.message}`);
    }
  }

  // Méthode pour récupérer toutes les corrections
  static async findAll() {
    try {
      const query = 'SELECT * FROM corrections';
      const [rows] = await pool.execute(query);
      return rows;
    } catch (err) {
      throw new Error('Erreur lors de la récupération des corrections : ' + err.message);
    }
  }


  // Recherche des corrections avec des filtres optionnels : titre, date de création
  static async findByExerciseId(exercise_id, filters = {}) {
    try {
      let query = 'SELECT * FROM corrections WHERE exercise_id = ?';
      const params = [exercise_id];
 
      if (filters.title) {
        query += ' AND title LIKE ?';
        params.push('%' + filters.title + '%');
      }
 
      if (filters.created_at) {
        query += ' AND created_at >= ?';
        params.push(filters.created_at);
      }
 
      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (err) {
      throw new Error('Erreur lors de la recherche des corrections : ' + err.message);
    }
  }  
}


module.exports = Correction;



