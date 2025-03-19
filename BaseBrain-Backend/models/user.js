const mysql = require('mysql2/promise');
const pool = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  // Créer un utilisateur (classique ou OAuth)
  static async create(email, password, role, provider = null, providerId = null, nom = null, prenom = null, telephone = null, sexe = null) {
    try {
      // Vérification si l'email existe déjà
      const [existingUser] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
      if (existingUser.length > 0) {
        throw new Error('Email déjà utilisé');
      }

      // Hachage du mot de passe si fourni (pas pour OAuth)
      let hashedPassword = null;
      if (password && !provider) {
        hashedPassword = await bcrypt.hash(password, 10);
      }

      // Insertion de l'utilisateur
      const query = `
        INSERT INTO users (email, password, role, provider, provider_id, nom, prenom, telephone, sexe)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const [result] = await pool.execute(query, [
        email,
        hashedPassword || null,
        role,
        provider || null,
        providerId || null,
        nom || null,
        prenom || null,
        telephone || null,
        sexe || null,
      ]);
      return { id: result.insertId, email, role, nom, prenom, telephone, sexe };
    } catch (err) {
      throw err;
    }
  }

  // Mettre à jour un utilisateur
  static async update(userId, { email, password, role, nom, prenom, telephone, sexe }) {
    try {
      const [existingUser] = await pool.execute('SELECT * FROM users WHERE id = ?', [userId]);
      if (!existingUser.length) {
        throw new Error('Utilisateur non trouvé');
      }

      let hashedPassword = existingUser[0].password;
      if (password) {
        hashedPassword = await bcrypt.hash(password, 10);
      }

      const query = `
        UPDATE users 
        SET email = ?, password = ?, role = ?, nom = ?, prenom = ?, telephone = ?, sexe = ?
        WHERE id = ?
      `;
      await pool.execute(query, [
        email || existingUser[0].email,
        hashedPassword,
        role || existingUser[0].role,
        nom || existingUser[0].nom,
        prenom || existingUser[0].prenom,
        telephone || existingUser[0].telephone,
        sexe || existingUser[0].sexe,
        userId
      ]);
      return { 
        id: userId, 
        email: email || existingUser[0].email, 
        role: role || existingUser[0].role, 
        nom: nom || existingUser[0].nom,
        prenom: prenom || existingUser[0].prenom,
        telephone: telephone || existingUser[0].telephone,
        sexe: sexe || existingUser[0].sexe
      };
    } catch (err) {
      throw err;
    }
  }

  // Supprimer un utilisateur
  static async delete(userId) {
    try {
      const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
      if (result.affectedRows === 0) {
        throw new Error('Utilisateur non trouvé');
      }
      return { message: 'Utilisateur supprimé avec succès' };
    } catch (err) {
      throw err;
    }
  }

  // Trouver un utilisateur par email
  static async findByEmail(email) {
    try {
      const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
      return rows[0];
    } catch (err) {
      throw new Error('Erreur lors de la recherche de l\'utilisateur');
    }
  }

  // Trouver un utilisateur par ID
  static async findById(userId) {
    try {
      const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [userId]);
      return rows[0] || null;
    } catch (err) {
      throw new Error('Erreur lors de la recherche de l\'utilisateur');
    }
  }

  // Vérifier les identifiants (authentification classique)
  static async verifyCredentials(email, password) {
    try {
      const user = await User.findByEmail(email);
      if (!user || !user.password) {
        throw new Error('Email ou mot de passe incorrect');
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new Error('Email ou mot de passe incorrect');
      }
      return user;
    } catch (err) {
      throw err;
    }
  }

  // Récupérer tous les utilisateurs (pour admin)
  static async findAll() {
    try {
      const [users] = await pool.execute(
        'SELECT id, email, role, nom, prenom, telephone, sexe, created_at FROM users'
      );
      return users;
    } catch (err) {
      throw new Error('Erreur lors de la récupération des utilisateurs');
    }
  }
}

module.exports = User;