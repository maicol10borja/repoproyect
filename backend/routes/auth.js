const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Crear usuario inicial (solo para setup)
router.post('/register', async (req, res) => {
  try {
    const exists = await User.findOne({ username: req.body.username });
    if (exists) return res.status(400).json({ message: 'Usuario ya existe' });

    const hash = await bcrypt.hash(req.body.password, 10);
    const user = new User({ username: req.body.username, password: hash });
    await user.save();
    res.json({ message: 'Usuario creado' });
  } catch(e) {
    res.status(500).json({ message: e.message });
  }
});

// Login - guarda solo id y username en el token (NO todo el objeto)
router.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (!user) return res.status(400).json({ message: 'Usuario no existe' });

    const valid = await bcrypt.compare(req.body.password, user.password);
    if (!valid) return res.status(400).json({ message: 'Contraseña incorrecta' });

    // ✅ CORRECTO: solo poner id y username, no todo el objeto user
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' } // ✅ con expiración
    );

    res.json({ token, username: user.username });
  } catch(e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;