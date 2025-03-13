const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'votre_secret';

// router.post('/register', async (req, res) => {
//   const { email, password, role } = req.body;
//   const hashedPassword = await bcrypt.hash(password, 10);
//   try {
//     const user = await User.create(email, hashedPassword, role);
//     res.status(201).json({ message: 'Utilisateur créé', user });
//   } catch (err) {
//     res.status(400).json({ error: 'Email déjà utilisé' });
//   }
// });
router.post('/register', async (req, res) => {
  const { email, password, role } = req.body;
  
  // Vérification des données envoyées
  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Tous les champs sont requis' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create(email, hashedPassword, role);
    res.status(201).json({ message: 'Utilisateur créé', user });
  } catch (err) {
    console.error('Erreur lors de la création de l\'utilisateur:', err);
    res.status(400).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Identifiants invalides' });
  }
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

module.exports = router;