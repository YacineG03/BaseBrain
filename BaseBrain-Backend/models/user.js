
const mysql = require('mysql2/promise');
const pool = require('../config/database'); 

class User {
  // Méthode pour créer un utilisateur
  static async create(email, password, role) {
    try {
      // Vérification si l'email existe déjà
      const [existingUser] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
      
      if (existingUser.length > 0) {
        throw new Error('Email déjà utilisé');
      }

      // Insertion de l'utilisateur dans la base de données
      const [result] = await pool.execute(
        'INSERT INTO users (email, password, role) VALUES (?, ?, ?)', 
        [email, password, role]
      );
      return { id: result.insertId, email, role };
    } catch (err) {
      throw err; // Propager l'erreur
    }
  }

  // Méthode pour trouver un utilisateur par email
  static async findByEmail(email) {
    try {
      const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
      return rows[0]; // Retourne le premier utilisateur trouvé
    } catch (err) {
      throw new Error('Erreur lors de la recherche de l\'utilisateur');
    }
  }

  static async findById(userId) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [userId]);
    return rows[0] || null;
  }
}

module.exports = User;
