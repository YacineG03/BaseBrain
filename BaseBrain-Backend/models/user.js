// const mysql = require('mysql2/promise');

// const pool = mysql.createPool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   port: process.env.DB_PORT,
// });

// const User = {
//   create: async (email, password, role) => {
//     const query = 'INSERT INTO users (email, password, role) VALUES (?, ?, ?)';
//     const [result] = await pool.execute(query, [email, password, role]);
//     return { id: result.insertId, email, password, role };
//   },
//   findByEmail: async (email) => {
//     const query = 'SELECT * FROM users WHERE email = ?';
//     const [rows] = await pool.execute(query, [email]);
//     return rows[0];
//   },
// };

// module.exports = User;

const mysql = require('mysql2/promise');
const pool = require('../config/database'); // Assurez-vous d'importer votre pool de connexion MySQL

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
}

module.exports = User;
