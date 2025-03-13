
const pool = require('../config/database'); // Importer le pool de connexion à la base de données


class Exercise {
  // Méthode pour créer un exercice
  static async create(professor_id, title, description, filePath) {
    try {
      const query = 'INSERT INTO exercises (professor_id, title, description, content) VALUES (?, ?, ?, ?)';
      const [result] = await pool.execute(query, [professor_id, title, description, filePath]);
      return { id: result.insertId, professor_id, title, description, content: filePath };
    } catch (err) {
      throw err;
    }
  }


  // Méthode pour récupérer tous les exercices
  static async findAll() {
    try {
      const query = 'SELECT * FROM exercises';
      const [rows] = await pool.execute(query);
      return rows;
    } catch (err) {
      throw new Error('Erreur lors de la récupération des exercices');
    }
  }


  // Méthode pour trouver un exercice par titre
  static async findByTitle(title) {
    try {
      const query = 'SELECT * FROM exercises WHERE title LIKE ?';
      const [rows] = await pool.execute(query, [`%${title}%`]);
      return rows;
    } catch (err) {
      throw new Error('Erreur lors de la recherche de l\'exercice');
    }
  }

  // Trouver un exercice par son ID
  static async findById(id) {
    try {
      const query = 'SELECT * FROM exercises WHERE id = ?';
      const [rows] = await pool.execute(query, [id]);
      return rows[0]; // Retourne le premier résultat (ou undefined si non trouvé)
    } catch (err) {
      throw new Error('Erreur lors de la recherche de l’exercice : ' + err.message);
    }
  }
}



module.exports = Exercise;
