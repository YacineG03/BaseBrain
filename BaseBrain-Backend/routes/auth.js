const express = require('express');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const passport = require('../config/passport');
const User = require('../models/user');
const router = express.Router();
const pool = require("../config/database"); 
// Inscription (classique)
router.post('/register', async (req, res) => {
  const { email, password, role, nom, prenom, telephone, sexe } = req.body;
  try {
    const user = await User.create(email, password, role, null, null, nom, prenom, telephone, sexe);
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ message: 'Utilisateur créé avec succès', token, user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Connexion (classique)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.verifyCredentials(email, password);
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ message: 'Connexion réussie', token, user });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

// Mise à jour d’un utilisateur (par l’utilisateur lui-même, un professeur ou un admin)
router.put('/users/:userId', auth(), async (req, res) => {
  const { userId } = req.params;
  const { email, password, role, nom, prenom, telephone, sexe } = req.body;

  // Autorisation : l'utilisateur peut modifier son propre compte, ou un professeur/admin peut modifier d'autres comptes
  if (req.user.id !== parseInt(userId) && !['professor', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Accès interdit' });
  }

  try {
    const user = await User.update(userId, { email, password, role, nom, prenom, telephone, sexe });
    res.status(200).json({ message: 'Utilisateur mis à jour', user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Suppression d’un utilisateur (par l’utilisateur lui-même, un professeur ou un admin)
router.delete('/users/:userId', auth(), async (req, res) => {
  const { userId } = req.params;

  // Autorisation : l'utilisateur peut se supprimer lui-même, ou un professeur/admin peut supprimer d'autres comptes
  if (req.user.id !== parseInt(userId) && !['professor', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Accès interdit' });
  }

  try {
    await User.delete(userId);
    res.status(200).json({ message: 'Utilisateur supprimé' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Routes Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    const token = jwt.sign({ id: req.user.id, role: req.user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.redirect(`http://localhost:3000?token=${token}`);
  }
);

// Récupérer tous les utilisateurs (admin uniquement)
router.get('/users', auth('admin'), async (req, res) => {
  try {
    const users = await User.findAll();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Créer un utilisateur (admin uniquement)
router.post('/users', auth('admin'), async (req, res) => {
  const { email, password, role, nom, prenom, telephone, sexe } = req.body;
  try {
    const user = await User.create(email, password, role, null, null, nom, prenom, telephone, sexe);
    res.status(201).json({ message: 'Utilisateur créé par l\'admin', user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Mettre à jour n’importe quel utilisateur (admin uniquement)
router.put('/admin/users/:userId', auth('admin'), async (req, res) => {
  const { userId } = req.params;
  const { email, password, role, nom, prenom, telephone, sexe } = req.body;
  try {
    const user = await User.update(userId, { email, password, role, nom, prenom, telephone, sexe });
    res.status(200).json({ message: 'Utilisateur mis à jour par l\'admin', user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Supprimer n’importe quel utilisateur (admin uniquement)
router.delete('/admin/users/:userId', auth('admin'), async (req, res) => {
  const { userId } = req.params;
  try {
    await User.delete(userId);
    res.status(200).json({ message: 'Utilisateur supprimé par l\'admin' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/me", auth(), async (req, res) => {
  try {
    const userId = req.user.id;
    const [users] = await pool.execute("SELECT id, email, prenom, nom, role FROM users WHERE id = ?", [userId]);
    
    if (!users || users.length === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    res.status(200).json(users[0]);
  } catch (err) {
    console.error("Erreur lors de la récupération des informations de l'utilisateur :", err);
    res.status(500).json({ error: "Erreur serveur", details: err.message });
  }
});

module.exports = router;