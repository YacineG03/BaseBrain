const pool = require('../config/database');

class Correction {
  static async create(exercise_id, title, description, file_path) {
    try {
      const query = `
        INSERT INTO corrections (exercise_id, title, description, file_path, created_at, updated_at)
        VALUES (?, ?, ?, ?, NOW(), NOW())
      `;
      const filePathValue = file_path && file_path.length > 0 ? JSON.stringify(file_path) : null;
      const [result] = await pool.execute(query, [exercise_id, title, description, filePathValue]);
      return { id: result.insertId, exercise_id, title, description, file_path };
    } catch (error) {
      throw new Error(`Erreur lors de la création de la correction : ${error.message}`);
    }
  }

  static async findAll() {
    try {
      const query = 'SELECT * FROM corrections';
      const [rows] = await pool.execute(query);
      const corrections = rows.map(row => ({
        ...row,
        file_path: row.file_path ? JSON.parse(row.file_path) : null,
      }));

      // Ajouter les modèles associés
      for (const correction of corrections) {
        const [models] = await pool.execute('SELECT * FROM correction_models WHERE correction_id = ?', [correction.id]);
        correction.models = models.map(model => ({
          ...model,
          configuration: model.configuration ? JSON.parse(model.configuration) : null
        }));
      }

      return corrections;
    } catch (err) {
      throw new Error('Erreur lors de la récupération des corrections : ' + err.message);
    }
  }

  static async findByExerciseId(exercise_id, filters = {}, pagination = {}) {
    try {
      let query = 'SELECT * FROM corrections WHERE exercise_id = ?';
      const params = [exercise_id];

      if (filters.title) {
        query += ' AND title LIKE ?';
        params.push('%' + filters.title + '%');
      }
      if (filters.created_at) {
        query += ' AND DATE(created_at) = ?'; // Ajustement pour comparer uniquement la date
        params.push(filters.created_at);
      }

      if (pagination.limit && pagination.offset !== undefined) {
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(pagination.limit), parseInt(pagination.offset));
      }

      const [rows] = await pool.execute(query, params);
      const corrections = rows.map(row => ({
        ...row,
        file_path: row.file_path ? JSON.parse(row.file_path) : null,
      }));

      // Ajouter les modèles associés
      for (const correction of corrections) {
        const [models] = await pool.execute('SELECT * FROM correction_models WHERE correction_id = ?', [correction.id]);
        correction.models = models.map(model => ({
          ...model,
          configuration: model.configuration ? JSON.parse(model.configuration) : null
        }));
      }

      return corrections;
    } catch (err) {
      throw new Error('Erreur lors de la recherche des corrections : ' + err.message);
    }
  }

  static async countByExerciseId(exercise_id, filters = {}) {
    try {
      let query = 'SELECT COUNT(*) as total FROM corrections WHERE exercise_id = ?';
      const params = [exercise_id];

      if (filters.title) {
        query += ' AND title LIKE ?';
        params.push('%' + filters.title + '%');
      }
      if (filters.created_at) {
        query += ' AND DATE(created_at) = ?';
        params.push(filters.created_at);
      }

      const [result] = await pool.execute(query, params);
      return result[0].total;
    } catch (err) {
      throw new Error('Erreur lors du comptage des corrections : ' + err.message);
    }
  }
}

module.exports = Correction;