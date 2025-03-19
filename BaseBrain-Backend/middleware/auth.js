const jwt = require('jsonwebtoken');

const auth = (requiredRole) => {
  return (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // "Bearer <token>"
    if (!token) {
      return res.status(401).json({ error: 'Token requis' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // Ajoute les infos du user (id, role) à la requête
      if (requiredRole && decoded.role !== requiredRole) {
        return res.status(403).json({ error: 'Accès interdit' });
      }
      next();
    } catch (err) {
      res.status(401).json({ error: 'Token invalide' });
    }
  };
};

module.exports = auth;